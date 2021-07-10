/**
 *Submitted for verification at Etherscan.io on 2020-11-16
 */

pragma solidity ^0.5.17;

import "@openzeppelinV2/contracts/token/ERC20/IERC20.sol";
import "@openzeppelinV2/contracts/math/SafeMath.sol";
import "@openzeppelinV2/contracts/utils/Address.sol";
import "@openzeppelinV2/contracts/token/ERC20/SafeERC20.sol";

import "../../interfaces/yearn/IController.sol";
import "../../interfaces/curve/Curve.sol";

interface yvERC20 {
    function deposit(uint256) external;

    function withdraw(uint256) external;

    function getPricePerFullShare() external view returns (uint256);
}

/*

 A strategy must implement the following calls;
 
 - deposit()
 - withdraw(address) must exclude any tokens used in the yield - Controller role - withdraw should return to Controller
 - withdraw(uint) - Controller | Vault role - withdraw should always return to vault
 - withdrawAll() - Controller | Vault role - withdraw should always return to vault
 - balanceOf()
 
 Where possible, strategies must remain as immutable as possible, instead of updating variables, we update the contract by linking it in the controller
 
*/

contract StrategyTUSDypool {
    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;

    address public constant want = address(0x0000000000085d4780B73119b644AE5ecd22b376);
    address public constant ypool = address(0x45F783CCE6B7FF23B2ab2D70e416cdb7D6055f51);
    address public constant ycrv = address(0xdF5e0e81Dff6FAF3A7e52BA697820c5e32D806A8);
    address public constant yycrv = address(0x5dbcF33D8c2E976c6b560249878e6F1491Bca25c);

    address public constant dai = address(0x6B175474E89094C44Da98b954EedeAC495271d0F);
    address public constant ydai = address(0x16de59092dAE5CcF4A1E6439D611fd0653f0Bd01);
    address public constant usdc = address(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48);
    address public constant yusdc = address(0xd6aD7a6750A7593E092a9B218d66C0A814a3436e);
    address public constant usdt = address(0xdAC17F958D2ee523a2206206994597C13D831ec7);
    address public constant yusdt = address(0x83f798e925BcD4017Eb265844FDDAbb448f1707D);
    address public constant tusd = address(0x0000000000085d4780B73119b644AE5ecd22b376);
    address public constant ytusd = address(0x73a052500105205d34Daf004eAb301916DA8190f);

    address public governance;
    address public controller;
    address public strategist;

    uint256 public constant DENOMINATOR = 10000;
    uint256 public treasuryFee = 500;
    uint256 public withdrawalFee = 0;
    uint256 public strategistReward = 50;
    uint256 public threshold = 6000;
    uint256 public slip = 100;
    uint256 public tank = 0;
    uint256 public p = 0;

    event Threshold(address indexed strategy);

    modifier isAuthorized() {
        require(msg.sender == governance || msg.sender == strategist || msg.sender == controller || msg.sender == address(this), "!authorized");
        _;
    }

    constructor(address _controller) public {
        governance = msg.sender;
        strategist = msg.sender;
        controller = _controller;
    }

    function getName() external pure returns (string memory) {
        return "StrategyTUSDypool";
    }

    function deposit() public isAuthorized {
        rebalance();
        uint256 _want = (IERC20(want).balanceOf(address(this))).sub(tank);
        if (_want > 0) {
            IERC20(want).safeApprove(ytusd, 0);
            IERC20(want).safeApprove(ytusd, _want);
            yvERC20(ytusd).deposit(_want);
        }
        uint256 _y = IERC20(ytusd).balanceOf(address(this));
        if (_y > 0) {
            IERC20(ytusd).safeApprove(ypool, 0);
            IERC20(ytusd).safeApprove(ypool, _y);
            uint256 v = _want.mul(1e18).div(ICurveFi(ypool).get_virtual_price());
            ICurveFi(ypool).add_liquidity([0, 0, 0, _y], v.mul(DENOMINATOR.sub(slip)).div(DENOMINATOR));
        }
        uint256 _bal = IERC20(ycrv).balanceOf(address(this));
        if (_bal > 0) {
            IERC20(ycrv).safeApprove(yycrv, 0);
            IERC20(ycrv).safeApprove(yycrv, _bal);
            yvERC20(yycrv).deposit(_bal);
        }
    }

    // Controller only function for creating additional rewards from dust
    function withdraw(IERC20 _asset) external returns (uint256 balance) {
        require(msg.sender == controller, "!controller");
        require(want != address(_asset), "want");
        require(ycrv != address(_asset), "ycrv");
        require(yycrv != address(_asset), "yycrv");
        balance = _asset.balanceOf(address(this));
        _asset.safeTransfer(controller, balance);
    }

    // Withdraw partial funds, normally used with a vault withdrawal
    function withdraw(uint256 _amount) external {
        require(msg.sender == controller, "!controller");

        rebalance();
        uint256 _balance = IERC20(want).balanceOf(address(this));
        if (_balance < _amount) {
            _amount = _withdrawSome(_amount.sub(_balance));
            _amount = _amount.add(_balance);
            tank = 0;
        } else {
            if (tank >= _amount) tank = tank.sub(_amount);
            else tank = 0;
        }

        address _vault = IController(controller).vaults(address(want));
        require(_vault != address(0), "!vault"); // additional protection so we don't burn the funds
        uint256 _fee = _amount.mul(withdrawalFee).div(DENOMINATOR);
        IERC20(want).safeTransfer(IController(controller).rewards(), _fee);
        IERC20(want).safeTransfer(_vault, _amount.sub(_fee));
    }

    function _withdrawSome(uint256 _amount) internal returns (uint256) {
        uint256 _amnt = _amount.mul(1e18).div(ICurveFi(ypool).get_virtual_price());
        uint256 _amt = _amnt.mul(1e18).div(yvERC20(yycrv).getPricePerFullShare());
        uint256 _before = IERC20(ycrv).balanceOf(address(this));
        yvERC20(yycrv).withdraw(_amt);
        uint256 _after = IERC20(ycrv).balanceOf(address(this));
        return _withdrawOne(_after.sub(_before));
    }

    function _withdrawOne(uint256 _amnt) internal returns (uint256) {
        IERC20(ycrv).safeApprove(ypool, 0);
        IERC20(ycrv).safeApprove(ypool, _amnt);

        uint256 _aux = _amnt.mul(DENOMINATOR.sub(slip)).div(DENOMINATOR);
        uint256 _t = IERC20(ycrv).totalSupply();
        ICurveFi(ypool).remove_liquidity(
            _amnt,
            [
                ICurveFi(ypool).balances(0).mul(_aux).div(_t),
                ICurveFi(ypool).balances(1).mul(_aux).div(_t),
                ICurveFi(ypool).balances(2).mul(_aux).div(_t),
                ICurveFi(ypool).balances(3).mul(_aux).div(_t)
            ]
        );

        uint256 _ydai = IERC20(ydai).balanceOf(address(this));
        uint256 _yusdc = IERC20(yusdc).balanceOf(address(this));
        uint256 _yusdt = IERC20(yusdt).balanceOf(address(this));

        uint256 tmp;
        if (_ydai > 0) {
            IERC20(ydai).safeApprove(ypool, 0);
            IERC20(ydai).safeApprove(ypool, _ydai);
            tmp = ICurveFi(ypool).get_dy(0, 3, _ydai);
            ICurveFi(ypool).exchange(0, 3, _ydai, tmp.mul(DENOMINATOR.sub(slip)).div(DENOMINATOR));
        }
        if (_yusdc > 0) {
            IERC20(yusdc).safeApprove(ypool, 0);
            IERC20(yusdc).safeApprove(ypool, _yusdc);
            tmp = ICurveFi(ypool).get_dy(1, 3, _yusdc);
            ICurveFi(ypool).exchange(1, 3, _yusdc, tmp.mul(DENOMINATOR.sub(slip)).div(DENOMINATOR));
        }
        if (_yusdt > 0) {
            IERC20(yusdt).safeApprove(ypool, 0);
            IERC20(yusdt).safeApprove(ypool, _yusdt);
            tmp = ICurveFi(ypool).get_dy(2, 3, _yusdt);
            ICurveFi(ypool).exchange(2, 3, _yusdt, tmp.mul(DENOMINATOR.sub(slip)).div(DENOMINATOR));
        }

        uint256 _before = IERC20(want).balanceOf(address(this));
        yvERC20(ytusd).withdraw(IERC20(ytusd).balanceOf(address(this)));
        uint256 _after = IERC20(want).balanceOf(address(this));

        return _after.sub(_before);
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
        uint256 _yycrv = IERC20(yycrv).balanceOf(address(this));
        if (_yycrv > 0) {
            yvERC20(yycrv).withdraw(_yycrv);
            _withdrawOne(IERC20(ycrv).balanceOf(address(this)));
        }
    }

    function balanceOfWant() public view returns (uint256) {
        return IERC20(want).balanceOf(address(this));
    }

    function balanceOfYCRV() public view returns (uint256) {
        return IERC20(ycrv).balanceOf(address(this));
    }

    function balanceOfYCRVinWant() public view returns (uint256) {
        return balanceOfYCRV().mul(ICurveFi(ypool).get_virtual_price()).div(1e18);
    }

    function balanceOfYYCRV() public view returns (uint256) {
        return IERC20(yycrv).balanceOf(address(this));
    }

    function balanceOfYYCRVinYCRV() public view returns (uint256) {
        return balanceOfYYCRV().mul(yvERC20(yycrv).getPricePerFullShare()).div(1e18);
    }

    function balanceOfYYCRVinWant() public view returns (uint256) {
        return balanceOfYYCRVinYCRV().mul(ICurveFi(ypool).get_virtual_price()).div(1e18);
    }

    function balanceOf() public view returns (uint256) {
        return balanceOfWant().add(balanceOfYYCRVinWant());
    }

    function migrate(address _strategy) external {
        require(msg.sender == governance, "!governance");
        require(IController(controller).approvedStrategies(want, _strategy), "!stategyAllowed");
        IERC20(yycrv).safeTransfer(_strategy, IERC20(yycrv).balanceOf(address(this)));
        IERC20(ycrv).safeTransfer(_strategy, IERC20(ycrv).balanceOf(address(this)));
        IERC20(want).safeTransfer(_strategy, IERC20(want).balanceOf(address(this)));
    }

    function forceD(uint256 _amount) external isAuthorized {
        IERC20(want).safeApprove(ytusd, 0);
        IERC20(want).safeApprove(ytusd, _amount);
        yvERC20(ytusd).deposit(_amount);

        uint256 _y = IERC20(ytusd).balanceOf(address(this));
        IERC20(ytusd).safeApprove(ypool, 0);
        IERC20(ytusd).safeApprove(ypool, _y);
        uint256 v = _amount.mul(1e18).div(ICurveFi(ypool).get_virtual_price());
        ICurveFi(ypool).add_liquidity([0, 0, 0, _y], v.mul(DENOMINATOR.sub(slip)).div(DENOMINATOR));

        uint256 _bal = IERC20(ycrv).balanceOf(address(this));
        IERC20(ycrv).safeApprove(yycrv, 0);
        IERC20(ycrv).safeApprove(yycrv, _bal);
        yvERC20(yycrv).deposit(_bal);

        if (_amount < tank) tank = tank.sub(_amount);
        else tank = 0;
    }

    function forceW(uint256 _amt) external isAuthorized {
        uint256 _before = IERC20(ycrv).balanceOf(address(this));
        yvERC20(yycrv).withdraw(_amt);
        uint256 _after = IERC20(ycrv).balanceOf(address(this));
        _amt = _after.sub(_before);

        _before = IERC20(want).balanceOf(address(this));
        _withdrawOne(_amt);
        _after = IERC20(want).balanceOf(address(this));
        tank = tank.add(_after.sub(_before));
    }

    function drip() public isAuthorized {
        uint256 _p = yvERC20(yycrv).getPricePerFullShare();
        _p = _p.mul(ICurveFi(ypool).get_virtual_price()).div(1e18);
        require(_p >= p, "backward");
        uint256 _r = (_p.sub(p)).mul(balanceOfYYCRV()).div(1e18);
        uint256 _s = _r.mul(strategistReward).div(DENOMINATOR);
        IERC20(yycrv).safeTransfer(strategist, _s.mul(1e18).div(_p));
        uint256 _t = _r.mul(treasuryFee).div(DENOMINATOR);
        IERC20(yycrv).safeTransfer(IController(controller).rewards(), _t.mul(1e18).div(_p));
        p = _p;
    }

    function tick() public view returns (uint256 _t, uint256 _c) {
        _t = ICurveFi(ypool).balances(3).mul(yvERC20(ytusd).getPricePerFullShare()).div(1e18).mul(threshold).div(DENOMINATOR);
        _c = balanceOfYYCRVinWant();
    }

    function rebalance() public isAuthorized {
        drip();
        (uint256 _t, uint256 _c) = tick();
        if (_c > _t) {
            _withdrawSome(_c.sub(_t));
            tank = IERC20(want).balanceOf(address(this));
            emit Threshold(address(this));
        }
    }

    function setGovernance(address _governance) external {
        require(msg.sender == governance, "!governance");
        governance = _governance;
    }

    function setController(address _controller) external {
        require(msg.sender == governance, "!governance");
        controller = _controller;
    }

    function setStrategist(address _strategist) external {
        require(msg.sender == governance || msg.sender == strategist, "!gs");
        strategist = _strategist;
    }

    function setWithdrawalFee(uint256 _withdrawalFee) external {
        require(msg.sender == governance, "!governance");
        withdrawalFee = _withdrawalFee;
    }

    function setTreasuryFee(uint256 _treasuryFee) external {
        require(msg.sender == governance, "!governance");
        treasuryFee = _treasuryFee;
    }

    function setStrategistReward(uint256 _strategistReward) external {
        require(msg.sender == governance, "!governance");
        strategistReward = _strategistReward;
    }

    function setThreshold(uint256 _threshold) external {
        require(msg.sender == strategist || msg.sender == governance, "!ksg");
        threshold = _threshold;
    }

    function setSlip(uint256 _slip) external {
        require(msg.sender == strategist || msg.sender == governance, "!ksg");
        slip = _slip;
    }
}
