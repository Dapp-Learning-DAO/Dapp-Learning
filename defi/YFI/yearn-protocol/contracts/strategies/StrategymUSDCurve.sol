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

contract StrategymUSDCurve {
    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;

    address public constant want = address(0xe2f2a5C287993345a840Db3B0845fbC70f5935a5);
    address public constant mpool = address(0x8474DdbE98F5aA3179B3B3F5942D724aFcdec9f6);
    address public constant m3crv = address(0x1AEf73d49Dedc4b1778d0706583995958Dc862e6);
    address public constant yvm3crv = address(0x0FCDAeDFb8A7DfDa2e9838564c5A1665d856AFDF);

    address public governance;
    address public controller;
    address public strategist;

    uint256 public constant DENOMINATOR = 10000;
    uint256 public treasuryFee = 1000;
    uint256 public withdrawalFee = 0;
    uint256 public strategistReward = 1000;
    uint256 public threshold = 6000;
    uint256 public slip = 100;
    uint256 public tank = 0;
    uint256 public p = 0;

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
        return "StrategymUSDCurve";
    }

    function deposit() public isAuthorized {
        rebalance();
        uint256 _want = (IERC20(want).balanceOf(address(this))).sub(tank);
        if (_want > 0) {
            IERC20(want).safeApprove(mpool, 0);
            IERC20(want).safeApprove(mpool, _want);
            uint256 v = _want.mul(1e18).div(ICurveFi(mpool).get_virtual_price());
            ICurveFi(mpool).add_liquidity([_want, 0], v.mul(DENOMINATOR.sub(slip)).div(DENOMINATOR));
        }
        uint256 _bal = IERC20(m3crv).balanceOf(address(this));
        if (_bal > 0) {
            IERC20(m3crv).safeApprove(yvm3crv, 0);
            IERC20(m3crv).safeApprove(yvm3crv, _bal);
            yvERC20(yvm3crv).deposit(_bal);
        }
    }

    // Controller only function for creating additional rewards from dust
    function withdraw(IERC20 _asset) external returns (uint256 balance) {
        require(msg.sender == controller, "!controller");
        require(want != address(_asset), "want");
        require(m3crv != address(_asset), "musd3crv");
        require(yvm3crv != address(_asset), "yvmusd3crv");
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
        uint256 _amnt = _amount.mul(1e18).div(ICurveFi(mpool).get_virtual_price());
        uint256 _amt = _amnt.mul(1e18).div(yvERC20(yvm3crv).getPricePerFullShare());
        uint256 _before = IERC20(m3crv).balanceOf(address(this));
        yvERC20(yvm3crv).withdraw(_amt);
        uint256 _after = IERC20(m3crv).balanceOf(address(this));
        return _withdrawOne(_after.sub(_before));
    }

    function _withdrawOne(uint256 _amnt) internal returns (uint256) {
        uint256 _before = IERC20(want).balanceOf(address(this));
        IERC20(m3crv).safeApprove(mpool, 0);
        IERC20(m3crv).safeApprove(mpool, _amnt);
        ICurveFi(mpool).remove_liquidity_one_coin(_amnt, 0, _amnt.mul(DENOMINATOR.sub(slip)).div(DENOMINATOR));
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
        uint256 _yvm3crv = IERC20(yvm3crv).balanceOf(address(this));
        if (_yvm3crv > 0) {
            yvERC20(yvm3crv).withdraw(_yvm3crv);
            _withdrawOne(IERC20(m3crv).balanceOf(address(this)));
        }
    }

    function balanceOfWant() public view returns (uint256) {
        return IERC20(want).balanceOf(address(this));
    }

    function balanceOfm3CRV() public view returns (uint256) {
        return IERC20(m3crv).balanceOf(address(this));
    }

    function balanceOfm3CRVinWant() public view returns (uint256) {
        return balanceOfm3CRV().mul(ICurveFi(mpool).get_virtual_price()).div(1e18);
    }

    function balanceOfyvm3CRV() public view returns (uint256) {
        return IERC20(yvm3crv).balanceOf(address(this));
    }

    function balanceOfyvm3CRVinm3CRV() public view returns (uint256) {
        return balanceOfyvm3CRV().mul(yvERC20(yvm3crv).getPricePerFullShare()).div(1e18);
    }

    function balanceOfyvm3CRVinWant() public view returns (uint256) {
        return balanceOfyvm3CRVinm3CRV().mul(ICurveFi(mpool).get_virtual_price()).div(1e18);
    }

    function balanceOf() public view returns (uint256) {
        return balanceOfWant().add(balanceOfyvm3CRVinWant());
    }

    function migrate(address _strategy) external {
        require(msg.sender == governance, "!governance");
        require(IController(controller).approvedStrategies(want, _strategy), "!stategyAllowed");
        IERC20(yvm3crv).safeTransfer(_strategy, IERC20(yvm3crv).balanceOf(address(this)));
        IERC20(m3crv).safeTransfer(_strategy, IERC20(m3crv).balanceOf(address(this)));
        IERC20(want).safeTransfer(_strategy, IERC20(want).balanceOf(address(this)));
    }

    function forceD(uint256 _amount) external isAuthorized {
        IERC20(want).safeApprove(mpool, 0);
        IERC20(want).safeApprove(mpool, _amount);
        uint256 v = _amount.mul(1e18).div(ICurveFi(mpool).get_virtual_price());
        ICurveFi(mpool).add_liquidity([_amount, 0], v.mul(DENOMINATOR.sub(slip)).div(DENOMINATOR));
        if (_amount < tank) tank = tank.sub(_amount);
        else tank = 0;

        uint256 _bal = IERC20(m3crv).balanceOf(address(this));
        IERC20(m3crv).safeApprove(yvm3crv, 0);
        IERC20(m3crv).safeApprove(yvm3crv, _bal);
        yvERC20(yvm3crv).deposit(_bal);
    }

    function forceW(uint256 _amt) external isAuthorized {
        uint256 _before = IERC20(m3crv).balanceOf(address(this));
        yvERC20(yvm3crv).withdraw(_amt);
        uint256 _after = IERC20(m3crv).balanceOf(address(this));
        _amt = _after.sub(_before);

        IERC20(m3crv).safeApprove(mpool, 0);
        IERC20(m3crv).safeApprove(mpool, _amt);
        _before = IERC20(want).balanceOf(address(this));
        ICurveFi(mpool).remove_liquidity_one_coin(_amt, 0, _amt.mul(DENOMINATOR.sub(slip)).div(DENOMINATOR));
        _after = IERC20(want).balanceOf(address(this));
        tank = tank.add(_after.sub(_before));
    }

    function drip() public isAuthorized {
        uint256 _p = yvERC20(yvm3crv).getPricePerFullShare();
        _p = _p.mul(ICurveFi(mpool).get_virtual_price()).div(1e18);
        require(_p >= p, "backward");
        uint256 _r = (_p.sub(p)).mul(balanceOfyvm3CRV()).div(1e18);
        uint256 _s = _r.mul(strategistReward).div(DENOMINATOR);
        IERC20(yvm3crv).safeTransfer(strategist, _s.mul(1e18).div(_p));
        uint256 _t = _r.mul(treasuryFee).div(DENOMINATOR);
        IERC20(yvm3crv).safeTransfer(IController(controller).rewards(), _t.mul(1e18).div(_p));
        p = _p;
    }

    function tick() public view returns (uint256 _t, uint256 _c) {
        _t = ICurveFi(mpool).balances(0).mul(threshold).div(DENOMINATOR);
        _c = balanceOfyvm3CRVinWant();
    }

    function rebalance() public isAuthorized {
        drip();
        (uint256 _t, uint256 _c) = tick();
        if (_c > _t) {
            _withdrawSome(_c.sub(_t));
            tank = IERC20(want).balanceOf(address(this));
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
        require(msg.sender == strategist || msg.sender == governance, "!sg");
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
        require(msg.sender == strategist || msg.sender == governance, "!sg");
        threshold = _threshold;
    }

    function setSlip(uint256 _slip) external {
        require(msg.sender == strategist || msg.sender == governance, "!sg");
        slip = _slip;
    }
}
