pragma solidity ^0.5.17;

import "@openzeppelinV2/contracts/token/ERC20/IERC20.sol";
import "@openzeppelinV2/contracts/math/SafeMath.sol";
import "@openzeppelinV2/contracts/utils/Address.sol";
import "@openzeppelinV2/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelinV2/contracts/token/ERC20/ERC20.sol";
import "@openzeppelinV2/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelinV2/contracts/ownership/Ownable.sol";

import "../../interfaces/aave/Aave.sol";
import "../../interfaces/aave/AaveToken.sol";
import "../../interfaces/aave/Oracle.sol";
import "../../interfaces/aave/LendingPoolAddressesProvider.sol";
import "../../interfaces/yearn/IController.sol";

contract yDelegatedVault is ERC20, ERC20Detailed {
    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;

    IERC20 public token;

    address public governance;
    address public controller;
    uint256 public insurance;
    uint256 public healthFactor = 4;

    uint256 public ltv = 65;
    uint256 public max = 100;

    address public constant aave = address(0x24a42fD28C976A61Df5D00D0599C34c4f90748c8);

    constructor(address _token, address _controller)
        public
        ERC20Detailed(
            string(abi.encodePacked("yearn ", ERC20Detailed(_token).name())),
            string(abi.encodePacked("y", ERC20Detailed(_token).symbol())),
            ERC20Detailed(_token).decimals()
        )
    {
        token = IERC20(_token);
        governance = msg.sender;
        controller = _controller;
    }

    function debt() public view returns (uint256) {
        address _reserve = IController(controller).want(address(this));
        (, uint256 currentBorrowBalance, , , , , , , , ) = Aave(getAave()).getUserReserveData(_reserve, address(this));
        return currentBorrowBalance;
    }

    function credit() public view returns (uint256) {
        return IController(controller).balanceOf(address(this));
    }

    // % of tokens locked and cannot be withdrawn per user
    // this is impermanent locked, unless the debt out accrues the strategy
    function locked() public view returns (uint256) {
        return credit().mul(1e18).div(debt());
    }

    function debtShare(address _lp) public view returns (uint256) {
        return debt().mul(balanceOf(_lp)).mul(totalSupply());
    }

    function getAave() public view returns (address) {
        return LendingPoolAddressesProvider(aave).getLendingPool();
    }

    function getAaveCore() public view returns (address) {
        return LendingPoolAddressesProvider(aave).getLendingPoolCore();
    }

    function setHealthFactor(uint256 _hf) external {
        require(msg.sender == governance, "!governance");
        healthFactor = _hf;
    }

    function activate() public {
        Aave(getAave()).setUserUseReserveAsCollateral(underlying(), true);
    }

    function repay(address reserve, uint256 amount) public {
        // Required for certain stable coins (USDT for example)
        IERC20(reserve).approve(address(getAaveCore()), 0);
        IERC20(reserve).approve(address(getAaveCore()), amount);
        Aave(getAave()).repay(reserve, amount, address(uint160(address(this))));
    }

    function repayAll() public {
        address _reserve = reserve();
        uint256 _amount = IERC20(_reserve).balanceOf(address(this));
        repay(_reserve, _amount);
    }

    // Used to swap any borrowed reserve over the debt limit to liquidate to 'token'
    function harvest(address reserve, uint256 amount) external {
        require(msg.sender == controller, "!controller");
        require(reserve != address(token), "token");
        IERC20(reserve).safeTransfer(controller, amount);
    }

    // Ignore insurance fund for balance calculations
    function balance() public view returns (uint256) {
        return token.balanceOf(address(this)).sub(insurance);
    }

    function setGovernance(address _governance) external {
        require(msg.sender == governance, "!governance");
        governance = _governance;
    }

    function setController(address _controller) external {
        require(msg.sender == governance, "!governance");
        controller = _controller;
    }

    function getAaveOracle() public view returns (address) {
        return LendingPoolAddressesProvider(aave).getPriceOracle();
    }

    function getReservePriceETH(address reserve) public view returns (uint256) {
        return Oracle(getAaveOracle()).getAssetPrice(reserve);
    }

    function shouldRebalance() external view returns (bool) {
        return (over() > 0);
    }

    function over() public view returns (uint256) {
        over(0);
    }

    function getUnderlyingPriceETH(uint256 _amount) public view returns (uint256) {
        _amount = _amount.mul(getUnderlyingPrice()).div(uint256(10)**ERC20Detailed(address(token)).decimals()); // Calculate the amount we are withdrawing in ETH
        return _amount.mul(ltv).div(max).div(healthFactor);
    }

    function over(uint256 _amount) public view returns (uint256) {
        address _reserve = reserve();
        uint256 _eth = getUnderlyingPriceETH(_amount);
        (uint256 _maxSafeETH, uint256 _totalBorrowsETH, ) = maxSafeETH();
        _maxSafeETH = _maxSafeETH.mul(105).div(100); // 5% buffer so we don't go into a earn/rebalance loop
        if (_eth > _maxSafeETH) {
            _maxSafeETH = 0;
        } else {
            _maxSafeETH = _maxSafeETH.sub(_eth); // Add the ETH we are withdrawing
        }
        if (_maxSafeETH < _totalBorrowsETH) {
            uint256 _over = _totalBorrowsETH.mul(_totalBorrowsETH.sub(_maxSafeETH)).div(_totalBorrowsETH);
            _over = _over.mul(uint256(10)**ERC20Detailed(_reserve).decimals()).div(getReservePrice());
            return _over;
        } else {
            return 0;
        }
    }

    function _rebalance(uint256 _amount) internal {
        uint256 _over = over(_amount);
        if (_over > 0) {
            if (_over > credit()) {
                _over = credit();
            }
            if (_over > 0) {
                IController(controller).withdraw(address(this), _over);
                repayAll();
            }
        }
    }

    function rebalance() external {
        _rebalance(0);
    }

    function claimInsurance() external {
        require(msg.sender == controller, "!controller");
        token.safeTransfer(controller, insurance);
        insurance = 0;
    }

    function maxSafeETH()
        public
        view
        returns (
            uint256 maxBorrowsETH,
            uint256 totalBorrowsETH,
            uint256 availableBorrowsETH
        )
    {
        (, , uint256 _totalBorrowsETH, , uint256 _availableBorrowsETH, , , ) = Aave(getAave()).getUserAccountData(address(this));
        uint256 _maxBorrowETH = (_totalBorrowsETH.add(_availableBorrowsETH));
        return (_maxBorrowETH.div(healthFactor), _totalBorrowsETH, _availableBorrowsETH);
    }

    function shouldBorrow() external view returns (bool) {
        return (availableToBorrowReserve() > 0);
    }

    function availableToBorrowETH() public view returns (uint256) {
        (uint256 _maxSafeETH, uint256 _totalBorrowsETH, uint256 _availableBorrowsETH) = maxSafeETH();
        _maxSafeETH = _maxSafeETH.mul(95).div(100); // 5% buffer so we don't go into a earn/rebalance loop
        if (_maxSafeETH > _totalBorrowsETH) {
            return _availableBorrowsETH.mul(_maxSafeETH.sub(_totalBorrowsETH)).div(_availableBorrowsETH);
        } else {
            return 0;
        }
    }

    function availableToBorrowReserve() public view returns (uint256) {
        address _reserve = reserve();
        uint256 _available = availableToBorrowETH();
        if (_available > 0) {
            return _available.mul(uint256(10)**ERC20Detailed(_reserve).decimals()).div(getReservePrice());
        } else {
            return 0;
        }
    }

    function getReservePrice() public view returns (uint256) {
        return getReservePriceETH(reserve());
    }

    function getUnderlyingPrice() public view returns (uint256) {
        return getReservePriceETH(underlying());
    }

    function earn() external {
        address _reserve = reserve();
        uint256 _borrow = availableToBorrowReserve();
        if (_borrow > 0) {
            Aave(getAave()).borrow(_reserve, _borrow, 2, 7);
        }
        //rebalance here
        uint256 _balance = IERC20(_reserve).balanceOf(address(this));
        if (_balance > 0) {
            IERC20(_reserve).safeTransfer(controller, _balance);
            IController(controller).earn(address(this), _balance);
        }
    }

    function depositAll() external {
        deposit(token.balanceOf(msg.sender));
    }

    function deposit(uint256 _amount) public {
        uint256 _pool = balance();
        token.safeTransferFrom(msg.sender, address(this), _amount);

        // 0.5% of deposits go into an insurance fund incase of negative profits to protect withdrawals
        // At a 4 health factor, this is a -2% position
        uint256 _insurance = _amount.mul(50).div(10000);
        _amount = _amount.sub(_insurance);
        insurance = insurance.add(_insurance);

        //Controller can claim insurance to liquidate to cover interest

        uint256 shares = 0;
        if (totalSupply() == 0) {
            shares = _amount;
        } else {
            shares = (_amount.mul(totalSupply())).div(_pool);
        }
        _mint(msg.sender, shares);
    }

    function reserve() public view returns (address) {
        return IController(controller).want(address(this));
    }

    function underlying() public view returns (address) {
        return AaveToken(address(token)).underlyingAssetAddress();
    }

    function withdrawAll() public {
        withdraw(balanceOf(msg.sender));
    }

    // Calculates in impermanent lock due to debt
    function maxWithdrawal(address account) public view returns (uint256) {
        uint256 _balance = balanceOf(account);
        uint256 _safeWithdraw = _balance.mul(locked()).div(1e18);
        if (_safeWithdraw > _balance) {
            return _balance;
        } else {
            uint256 _diff = _balance.sub(_safeWithdraw);
            return _balance.sub(_diff.mul(healthFactor)); // technically 150%, not 200%, but adding buffer
        }
    }

    function safeWithdraw() external {
        withdraw(maxWithdrawal(msg.sender));
    }

    // No rebalance implementation for lower fees and faster swaps
    function withdraw(uint256 _shares) public {
        uint256 r = (balance().mul(_shares)).div(totalSupply());
        _burn(msg.sender, _shares);
        _rebalance(r);
        token.safeTransfer(msg.sender, r);
    }

    function getPricePerFullShare() external view returns (uint256) {
        return balance().mul(1e18).div(totalSupply());
    }
}
