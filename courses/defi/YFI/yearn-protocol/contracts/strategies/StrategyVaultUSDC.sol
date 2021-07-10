// SPDX-License-Identifier: MIT

pragma solidity ^0.5.17;

import "@openzeppelinV2/contracts/token/ERC20/IERC20.sol";
import "@openzeppelinV2/contracts/math/SafeMath.sol";
import "@openzeppelinV2/contracts/utils/Address.sol";
import "@openzeppelinV2/contracts/token/ERC20/SafeERC20.sol";

import "../../interfaces/aave/Aave.sol";
import "../../interfaces/aave/LendingPoolAddressesProvider.sol";

import "../../interfaces/yearn/IController.sol";
import "../../interfaces/yearn/IVault.sol";

contract StrategyVaultUSDC {
    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;

    address public constant want = address(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48);
    address public constant vault = address(0x597aD1e0c13Bfe8025993D9e79C69E1c0233522e);

    address public constant aave = address(0x24a42fD28C976A61Df5D00D0599C34c4f90748c8);

    address public governance;
    address public controller;

    constructor(address _controller) public {
        governance = msg.sender;
        controller = _controller;
    }

    function deposit() external {
        uint256 _balance = IERC20(want).balanceOf(address(this));
        if (_balance > 0) {
            IERC20(want).safeApprove(address(vault), 0);
            IERC20(want).safeApprove(address(vault), _balance);
            IVault(vault).deposit(_balance);
        }
    }

    function getAave() public view returns (address) {
        return LendingPoolAddressesProvider(aave).getLendingPool();
    }

    function getName() external pure returns (string memory) {
        return "StrategyVaultUSDC";
    }

    function debt() external view returns (uint256) {
        (, uint256 currentBorrowBalance, , , , , , , , ) = Aave(getAave()).getUserReserveData(
            want,
            IController(controller).vaults(address(this))
        );
        return currentBorrowBalance;
    }

    function have() public view returns (uint256) {
        uint256 _have = balanceOf();
        return _have;
    }

    function skimmable() public view returns (uint256) {
        (, uint256 currentBorrowBalance, , , , , , , , ) = Aave(getAave()).getUserReserveData(
            want,
            IController(controller).vaults(address(this))
        );
        uint256 _have = have();
        if (_have > currentBorrowBalance) {
            return _have.sub(currentBorrowBalance);
        } else {
            return 0;
        }
    }

    function skim() external {
        uint256 _balance = IERC20(want).balanceOf(address(this));
        uint256 _amount = skimmable();
        if (_balance < _amount) {
            _amount = _withdrawSome(_amount.sub(_balance));
            _amount = _amount.add(_balance);
        }
        IERC20(want).safeTransfer(controller, _amount);
    }

    // Controller only function for creating additional rewards from dust
    function withdraw(IERC20 _asset) external returns (uint256 balance) {
        require(msg.sender == controller, "!controller");
        require(address(_asset) != address(want), "!want");
        require(address(_asset) != address(vault), "!vault");
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
        address _vault = IController(controller).vaults(address(this));
        require(_vault != address(0), "!vault"); // additional protection so we don't burn the funds
        IERC20(want).safeTransfer(_vault, _amount);
    }

    // Withdraw all funds, normally used when migrating strategies
    function withdrawAll() external returns (uint256 balance) {
        require(msg.sender == controller, "!controller");
        _withdrawAll();
        balance = IERC20(want).balanceOf(address(this));
        address _vault = IController(controller).vaults(address(this));
        require(_vault != address(0), "!vault"); // additional protection so we don't burn the funds
        IERC20(want).safeTransfer(_vault, balance);
    }

    function _withdrawAll() internal {
        IVault(vault).withdraw(IERC20(vault).balanceOf(address(this)));
    }

    function _withdrawSome(uint256 _amount) internal returns (uint256) {
        uint256 _redeem = IERC20(vault).balanceOf(address(this)).mul(_amount).div(balanceSavingsInToken());
        uint256 _before = IERC20(want).balanceOf(address(this));
        IVault(vault).withdraw(_redeem);
        uint256 _after = IERC20(want).balanceOf(address(this));
        return _after.sub(_before);
    }

    function balanceOf() public view returns (uint256) {
        return IERC20(want).balanceOf(address(this)).add(balanceSavingsInToken());
    }

    function balanceSavingsInToken() public view returns (uint256) {
        return IERC20(vault).balanceOf(address(this)).mul(IVault(vault).getPricePerFullShare()).div(1e18);
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
