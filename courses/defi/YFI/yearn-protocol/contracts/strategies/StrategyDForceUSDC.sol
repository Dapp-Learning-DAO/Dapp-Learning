// SPDX-License-Identifier: MIT

pragma solidity ^0.5.17;

import "@openzeppelinV2/contracts/token/ERC20/IERC20.sol";
import "@openzeppelinV2/contracts/math/SafeMath.sol";
import "@openzeppelinV2/contracts/utils/Address.sol";
import "@openzeppelinV2/contracts/token/ERC20/SafeERC20.sol";

import "../../interfaces/dforce/Rewards.sol";
import "../../interfaces/dforce/Token.sol";
import "../../interfaces/uniswap/Uni.sol";

import "../../interfaces/yearn/IController.sol";

contract StrategyDForceUSDC {
    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;

    address public constant want = address(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48); // USDC
    address public constant dusdc = address(0x16c9cF62d8daC4a38FB50Ae5fa5d51E9170F3179);
    address public constant pool = address(0xB71dEFDd6240c45746EC58314a01dd6D833fD3b5);
    address public constant df = address(0x431ad2ff6a9C365805eBaD47Ee021148d6f7DBe0);
    address public constant uni = address(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
    address public constant weth = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2); // used for df <> weth <> usdc route

    uint256 public performanceFee = 5000;
    uint256 public constant performanceMax = 10000;

    uint256 public withdrawalFee = 500;
    uint256 public constant withdrawalMax = 10000;

    address public governance;
    address public controller;
    address public strategist;

    constructor(address _controller) public {
        governance = msg.sender;
        strategist = msg.sender;
        controller = _controller;
    }

    function getName() external pure returns (string memory) {
        return "StrategyDForceUSDC";
    }

    function setStrategist(address _strategist) external {
        require(msg.sender == governance, "!governance");
        strategist = _strategist;
    }

    function setWithdrawalFee(uint256 _withdrawalFee) external {
        require(msg.sender == governance, "!governance");
        withdrawalFee = _withdrawalFee;
    }

    function setPerformanceFee(uint256 _performanceFee) external {
        require(msg.sender == governance, "!governance");
        performanceFee = _performanceFee;
    }

    function deposit() public {
        uint256 _want = IERC20(want).balanceOf(address(this));
        if (_want > 0) {
            IERC20(want).safeApprove(dusdc, 0);
            IERC20(want).safeApprove(dusdc, _want);
            dERC20(dusdc).mint(address(this), _want);
        }

        uint256 _dusdc = IERC20(dusdc).balanceOf(address(this));
        if (_dusdc > 0) {
            IERC20(dusdc).safeApprove(pool, 0);
            IERC20(dusdc).safeApprove(pool, _dusdc);
            dRewards(pool).stake(_dusdc);
        }
    }

    // Controller only function for creating additional rewards from dust
    function withdraw(IERC20 _asset) external returns (uint256 balance) {
        require(msg.sender == controller, "!controller");
        require(want != address(_asset), "want");
        require(dusdc != address(_asset), "dusdc");
        balance = _asset.balanceOf(address(this));
        _asset.safeTransfer(controller, balance);
    }

    // Withdraw partial funds, normally used with a vault withdrawal
    function withdraw(uint256 _amount) external {
        require(msg.sender == controller, "!controller");
        uint256 _balance = IERC20(want).balanceOf(address(this));
        if (_balance < _amount) {
            _amount = _withdrawSome(_amount.sub(_balance));
            _amount = _amount.add(_balance);
        }

        uint256 _fee = _amount.mul(withdrawalFee).div(withdrawalMax);

        IERC20(want).safeTransfer(IController(controller).rewards(), _fee);
        address _vault = IController(controller).vaults(address(want));
        require(_vault != address(0), "!vault"); // additional protection so we don't burn the funds

        IERC20(want).safeTransfer(_vault, _amount.sub(_fee));
    }

    // Withdraw all funds, normally used when migrating strategies
    function withdrawAll() external returns (uint256 balance) {
        require(msg.sender == controller, "!controller");
        _withdrawAll();

        balance = IERC20(want).balanceOf(address(this));

        address _vault = IController(controller).vaults(address(want));
        require(_vault != address(0), "!vault"); // additional protection so we don't burn the funds
        IERC20(want).safeTransfer(_vault, balance);
    }

    function _withdrawAll() internal {
        dRewards(pool).exit();
        uint256 _dusdc = IERC20(dusdc).balanceOf(address(this));
        if (_dusdc > 0) {
            dERC20(dusdc).redeem(address(this), _dusdc);
        }
    }

    function harvest() public {
        require(msg.sender == strategist || msg.sender == governance, "!authorized");
        dRewards(pool).getReward();
        uint256 _df = IERC20(df).balanceOf(address(this));
        if (_df > 0) {
            IERC20(df).safeApprove(uni, 0);
            IERC20(df).safeApprove(uni, _df);

            address[] memory path = new address[](3);
            path[0] = df;
            path[1] = weth;
            path[2] = want;

            Uni(uni).swapExactTokensForTokens(_df, uint256(0), path, address(this), now.add(1800));
        }
        uint256 _want = IERC20(want).balanceOf(address(this));
        if (_want > 0) {
            uint256 _fee = _want.mul(performanceFee).div(performanceMax);
            IERC20(want).safeTransfer(IController(controller).rewards(), _fee);
            deposit();
        }
    }

    function _withdrawSome(uint256 _amount) internal returns (uint256) {
        uint256 _dusdc = _amount.mul(1e18).div(dERC20(dusdc).getExchangeRate());
        uint256 _before = IERC20(dusdc).balanceOf(address(this));
        dRewards(pool).withdraw(_dusdc);
        uint256 _after = IERC20(dusdc).balanceOf(address(this));
        uint256 _withdrew = _after.sub(_before);
        _before = IERC20(want).balanceOf(address(this));
        dERC20(dusdc).redeem(address(this), _withdrew);
        _after = IERC20(want).balanceOf(address(this));
        _withdrew = _after.sub(_before);
        return _withdrew;
    }

    function balanceOfWant() public view returns (uint256) {
        return IERC20(want).balanceOf(address(this));
    }

    function balanceOfPool() public view returns (uint256) {
        return (dRewards(pool).balanceOf(address(this))).mul(dERC20(dusdc).getExchangeRate()).div(1e18);
    }

    function getExchangeRate() public view returns (uint256) {
        return dERC20(dusdc).getExchangeRate();
    }

    function balanceOfDUSDC() public view returns (uint256) {
        return dERC20(dusdc).getTokenBalance(address(this));
    }

    function balanceOf() public view returns (uint256) {
        return balanceOfWant().add(balanceOfDUSDC()).add(balanceOfPool());
    }

    function setGovernance(address _governance) external {
        require(msg.sender == governance, "!governance");
        governance = _governance;
    }

    function setController(address _controller) external {
        require(msg.sender == governance, "!governance");
        controller = _controller;
    }
}
