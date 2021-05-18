pragma solidity ^0.5.17;

import "@openzeppelinV2/contracts/token/ERC20/IERC20.sol";
import "@openzeppelinV2/contracts/math/SafeMath.sol";
import "@openzeppelinV2/contracts/utils/Address.sol";
import "@openzeppelinV2/contracts/token/ERC20/SafeERC20.sol";

import "../../interfaces/maker/Maker.sol";
import "../../interfaces/uniswap/Uni.sol";

import "../../interfaces/yearn/IController.sol";
import "../../interfaces/yearn/IStrategy.sol";
import "../../interfaces/yearn/IVault.sol";

/*

 A strategy must implement the following calls;

 - deposit()
 - withdraw(address) must exclude any tokens used in the yield - Controller role - withdraw should return to Controller
 - withdraw(uint) - Controller | Vault role - withdraw should always return to vault
 - withdrawAll() - Controller | Vault role - withdraw should always return to vault
 - balanceOf()

 Where possible, strategies must remain as immutable as possible, instead of updating variables, we update the contract by linking it in the controller

*/
contract StrategyMKRVaultDAIDelegate {
    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;

    address public constant token = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
    address public constant want = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
    address public constant weth = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
    address public constant dai = address(0x6B175474E89094C44Da98b954EedeAC495271d0F);

    address public cdp_manager = address(0x5ef30b9986345249bc32d8928B7ee64DE9435E39);
    address public vat = address(0x35D1b3F3D7966A1DFe207aa4514C12a259A0492B);
    address public mcd_join_eth_a = address(0x2F0b23f53734252Bda2277357e97e1517d6B042A);
    address public mcd_join_dai = address(0x9759A6Ac90977b93B58547b4A71c78317f391A28);
    address public mcd_spot = address(0x65C79fcB50Ca1594B025960e539eD7A9a6D434A3);
    address public jug = address(0x19c0976f590D67707E62397C87829d896Dc0f1F1);

    address public eth_price_oracle = address(0xCF63089A8aD2a9D8BD6Bb8022f3190EB7e1eD0f1);
    address public constant yVaultDAI = address(0xACd43E627e64355f1861cEC6d3a6688B31a6F952);

    address public constant uniswap = address(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
    address public constant sushiswap = address(0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F);

    uint256 public c = 20000;
    uint256 public c_safe = 40000;
    uint256 public buffer = 500;
    uint256 public constant c_base = 10000;
    uint256 public performanceFee = 450;
    uint256 public withdrawalFee = 0;
    uint256 public strategistReward = 50;

    bytes32 public constant ilk = "ETH-A";

    address public governance;
    address public controller;
    address public strategist;
    address public keeper;
    address public dex;

    uint256 public cdpId;

    constructor(address _controller) public {
        governance = msg.sender;
        strategist = msg.sender;
        keeper = msg.sender;
        controller = _controller;
        dex = uniswap;
        cdpId = ManagerLike(cdp_manager).open(ilk, address(this));
        _approveAll();
    }

    function getName() external pure returns (string memory) {
        return "StrategyMKRVaultDAIDelegate";
    }

    function setStrategist(address _strategist) external {
        require(msg.sender == governance, "!governance");
        strategist = _strategist;
    }

    function setKeeper(address _keeper) external {
        require(msg.sender == keeper || msg.sender == governance, "!allowed");
        keeper = _keeper;
    }

    function setWithdrawalFee(uint256 _withdrawalFee) external {
        require(msg.sender == governance, "!governance");
        withdrawalFee = _withdrawalFee;
    }

    function setPerformanceFee(uint256 _performanceFee) external {
        require(msg.sender == governance, "!governance");
        performanceFee = _performanceFee;
    }

    function setStrategistReward(uint256 _strategistReward) external {
        require(msg.sender == governance, "!governance");
        strategistReward = _strategistReward;
    }

    function setBorrowCollateralizationRatio(uint256 _c) external {
        require(msg.sender == governance, "!governance");
        c = _c;
    }

    function setWithdrawCollateralizationRatio(uint256 _c_safe) external {
        require(msg.sender == governance, "!governance");
        c_safe = _c_safe;
    }

    function setBuffer(uint256 _buffer) external {
        require(msg.sender == governance, "!governance");
        buffer = _buffer;
    }

    function setOracle(address _oracle) external {
        require(msg.sender == governance, "!governance");
        eth_price_oracle = _oracle;
    }

    // optional
    function setMCDValue(
        address _manager,
        address _ethAdapter,
        address _daiAdapter,
        address _spot,
        address _jug
    ) external {
        require(msg.sender == governance, "!governance");
        cdp_manager = _manager;
        vat = ManagerLike(_manager).vat();
        mcd_join_eth_a = _ethAdapter;
        mcd_join_dai = _daiAdapter;
        mcd_spot = _spot;
        jug = _jug;
    }

    function switchDex(bool isUniswap) external {
        require(msg.sender == strategist || msg.sender == governance, "!authorized");
        if (isUniswap) {
            dex = uniswap;
        } else {
            dex = sushiswap;
        }
    }

    function _approveAll() internal {
        IERC20(token).approve(mcd_join_eth_a, uint256(-1));
        IERC20(dai).approve(mcd_join_dai, uint256(-1));
        VatLike(vat).hope(mcd_join_dai);
        IERC20(dai).approve(yVaultDAI, uint256(-1));
        IERC20(dai).approve(uniswap, uint256(-1));
        IERC20(dai).approve(sushiswap, uint256(-1));
    }

    function deposit() public {
        uint256 _token = IERC20(token).balanceOf(address(this));
        if (_token > 0) {
            uint256 p = _getPrice();
            uint256 _draw = _token.mul(p).mul(c_base).div(c).div(1e18);
            // approve adapter to use token amount
            require(_checkDebtCeiling(_draw), "debt ceiling is reached!");
            _lockWETHAndDrawDAI(_token, _draw);

            // approve yVaultDAI use DAI
            IVault(yVaultDAI).depositAll();
        }
    }

    function _getPrice() internal view returns (uint256 p) {
        (uint256 _read, ) = OSMedianizer(eth_price_oracle).read();
        (uint256 _foresight, ) = OSMedianizer(eth_price_oracle).foresight();
        p = _foresight < _read ? _foresight : _read;
    }

    function _checkDebtCeiling(uint256 _amt) internal view returns (bool) {
        (, , , uint256 _line, ) = VatLike(vat).ilks(ilk);
        uint256 _debt = getTotalDebtAmount().add(_amt);
        if (_line.div(1e27) < _debt) {
            return false;
        }
        return true;
    }

    function _lockWETHAndDrawDAI(uint256 wad, uint256 wadD) internal {
        address urn = ManagerLike(cdp_manager).urns(cdpId);
        if (wad > 0) {
            GemJoinLike(mcd_join_eth_a).join(urn, wad);
        }
        ManagerLike(cdp_manager).frob(cdpId, toInt(wad), _getDrawDart(urn, wadD));
        ManagerLike(cdp_manager).move(cdpId, address(this), wadD.mul(1e27));
        if (wadD > 0) {
            DaiJoinLike(mcd_join_dai).exit(address(this), wadD);
        }
    }

    function _getDrawDart(address urn, uint256 wad) internal returns (int256 dart) {
        uint256 rate = JugLike(jug).drip(ilk);
        uint256 _dai = VatLike(vat).dai(urn);

        // If there was already enough DAI in the vat balance, just exits it without adding more debt
        if (_dai < wad.mul(1e27)) {
            dart = toInt(wad.mul(1e27).sub(_dai).div(rate));
            dart = uint256(dart).mul(rate) < wad.mul(1e27) ? dart + 1 : dart;
        }
    }

    function toInt(uint256 x) internal pure returns (int256 y) {
        y = int256(x);
        require(y >= 0, "int-overflow");
    }

    // Controller only function for creating additional rewards from dust
    function withdraw(IERC20 _asset) external returns (uint256 balance) {
        require(msg.sender == controller, "!controller");
        require(want != address(_asset), "want");
        require(dai != address(_asset), "dai");
        require(yVaultDAI != address(_asset), "ydai");
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

        uint256 _fee = _amount.mul(withdrawalFee).div(c_base);

        IERC20(want).safeTransfer(IController(controller).rewards(), _fee);
        address _vault = IController(controller).vaults(address(want));
        require(_vault != address(0), "!vault"); // additional protection so we don't burn the funds

        IERC20(want).safeTransfer(_vault, _amount.sub(_fee));
    }

    function _withdrawSome(uint256 _amount) internal returns (uint256) {
        uint256 _wipe = 0;
        if (getTotalDebtAmount() != 0 && getmVaultRatio(_amount) < c_safe.mul(1e2)) {
            uint256 p = _getPrice();
            _wipe = _withdrawDaiLeast(_amount.mul(p).div(1e18));
        }

        _freeWETHandWipeDAI(_amount, _wipe);

        return _amount;
    }

    function _freeWETHandWipeDAI(uint256 wad, uint256 wadD) internal {
        address urn = ManagerLike(cdp_manager).urns(cdpId);
        if (wadD > 0) {
            DaiJoinLike(mcd_join_dai).join(urn, wadD);
        }
        ManagerLike(cdp_manager).frob(cdpId, -toInt(wad), _getWipeDart(VatLike(vat).dai(urn), urn));
        ManagerLike(cdp_manager).flux(cdpId, address(this), wad);
        if (wad > 0) {
            GemJoinLike(mcd_join_eth_a).exit(address(this), wad);
        }
    }

    function _getWipeDart(uint256 _dai, address urn) internal view returns (int256 dart) {
        (, uint256 rate, , , ) = VatLike(vat).ilks(ilk);
        (, uint256 art) = VatLike(vat).urns(ilk, urn);

        dart = toInt(_dai / rate);
        dart = uint256(dart) <= art ? -dart : -toInt(art);
    }

    // Withdraw all funds, normally used when migrating strategies
    function withdrawAll() external returns (uint256 balance) {
        require(msg.sender == controller, "!controller");
        _withdrawAll();

        _swap(IERC20(dai).balanceOf(address(this)));
        balance = IERC20(want).balanceOf(address(this));

        address _vault = IController(controller).vaults(address(want));
        require(_vault != address(0), "!vault"); // additional protection so we don't burn the funds
        IERC20(want).safeTransfer(_vault, balance);
    }

    function _withdrawAll() internal {
        IVault(yVaultDAI).withdrawAll(); // get Dai
        _freeWETHandWipeDAI(balanceOfmVault(), getTotalDebtAmount().add(1)); // in case of edge case
    }

    function balanceOf() public view returns (uint256) {
        return balanceOfWant().add(balanceOfmVault());
    }

    function balanceOfWant() public view returns (uint256) {
        return IERC20(want).balanceOf(address(this));
    }

    function balanceOfmVault() public view returns (uint256) {
        uint256 ink;
        address urnHandler = ManagerLike(cdp_manager).urns(cdpId);
        (ink, ) = VatLike(vat).urns(ilk, urnHandler);
        return ink;
    }

    function harvest() public {
        require(msg.sender == strategist || msg.sender == keeper || msg.sender == governance, "!authorized");

        uint256 v = getUnderlyingDai();
        uint256 d = getTotalDebtAmount();
        require(v > d, "profit is not realized yet!");
        uint256 profit = v.sub(d);

        _withdrawDaiMost(profit);
        _swap(IERC20(dai).balanceOf(address(this)));

        uint256 _want = IERC20(want).balanceOf(address(this));
        if (_want > 0) {
            uint256 _fee = _want.mul(performanceFee).div(c_base);
            uint256 _strategistReward = _want.mul(strategistReward).div(c_base);
            IERC20(want).safeTransfer(strategist, _strategistReward);
            IERC20(want).safeTransfer(IController(controller).rewards(), _fee);
        }

        deposit();
    }

    function shouldDraw() external view returns (bool) {
        // 5% buffer to avoid deposit/rebalance loops
        return (getmVaultRatio(0) > c.mul(1e2).mul(c_base).div((c_base.sub(buffer))));
    }

    function drawAmount() public view returns (uint256) {
        uint256 _safe = c.mul(1e2);
        uint256 _current = getmVaultRatio(0);
        if (_current > c_base.mul(c_safe).mul(1e2)) {
            _current = c_base.mul(c_safe).mul(1e2);
        }
        if (_current > _safe) {
            uint256 d = getTotalDebtAmount();
            uint256 diff = _current.sub(_safe);
            return d.mul(diff).div(_safe);
        }
        return 0;
    }

    function draw() external {
        uint256 _drawD = drawAmount();
        if (_drawD > 0) {
            _lockWETHAndDrawDAI(0, _drawD);
            IVault(yVaultDAI).depositAll();
        }
    }

    function shouldRepay() external view returns (bool) {
        // 5% buffer to avoid deposit/rebalance loops
        return (getmVaultRatio(0) < c.mul(1e2).mul(c_base).div((c_base.add(buffer))));
    }

    function repayAmount() public view returns (uint256) {
        uint256 _safe = c.mul(1e2);
        uint256 _current = getmVaultRatio(0);
        if (_current < _safe) {
            uint256 d = getTotalDebtAmount();
            uint256 diff = _safe.sub(_current);
            return d.mul(diff).div(_safe);
        }
        return 0;
    }

    function repay() external {
        uint256 free = repayAmount();
        if (free > 0) {
            _freeWETHandWipeDAI(0, _withdrawDaiLeast(free));
        }
    }

    function forceRebalance(uint256 _amount) external {
        require(msg.sender == governance || msg.sender == strategist || msg.sender == keeper, "!authorized");
        _freeWETHandWipeDAI(0, _withdrawDaiLeast(_amount));
    }

    function getTotalDebtAmount() public view returns (uint256) {
        uint256 art;
        uint256 rate;
        address urnHandler = ManagerLike(cdp_manager).urns(cdpId);
        (, art) = VatLike(vat).urns(ilk, urnHandler);
        (, rate, , , ) = VatLike(vat).ilks(ilk);
        return art.mul(rate).div(1e27);
    }

    function getmVaultRatio(uint256 amount) public view returns (uint256) {
        uint256 spot; // ray
        uint256 liquidationRatio; // ray
        uint256 denominator = getTotalDebtAmount();

        if (denominator == 0) {
            return uint256(-1);
        }

        (, , spot, , ) = VatLike(vat).ilks(ilk);
        (, liquidationRatio) = SpotLike(mcd_spot).ilks(ilk);
        uint256 delayedCPrice = spot.mul(liquidationRatio).div(1e27); // ray

        uint256 _balance = balanceOfmVault();
        if (_balance < amount) {
            _balance = 0;
        } else {
            _balance = _balance.sub(amount);
        }

        uint256 numerator = _balance.mul(delayedCPrice).div(1e18); // ray
        return numerator.div(denominator).div(1e3);
    }

    function getUnderlyingWithdrawalFee() public view returns (uint256) {
        address _strategy = IController(controller).strategies(dai);
        return IStrategy(_strategy).withdrawalFee();
    }

    function getUnderlyingDai() public view returns (uint256) {
        return IERC20(yVaultDAI).balanceOf(address(this)).mul(IVault(yVaultDAI).getPricePerFullShare()).div(1e18);
    }

    function _withdrawDaiMost(uint256 _amount) internal returns (uint256) {
        uint256 _shares = _amount.mul(1e18).div(IVault(yVaultDAI).getPricePerFullShare());

        if (_shares > IERC20(yVaultDAI).balanceOf(address(this))) {
            _shares = IERC20(yVaultDAI).balanceOf(address(this));
        }

        uint256 _before = IERC20(dai).balanceOf(address(this));
        IVault(yVaultDAI).withdraw(_shares);
        uint256 _after = IERC20(dai).balanceOf(address(this));
        return _after.sub(_before);
    }

    function _withdrawDaiLeast(uint256 _amount) internal returns (uint256) {
        uint256 _shares = _amount.mul(1e18).div(IVault(yVaultDAI).getPricePerFullShare()).mul(c_base).div(
            c_base.sub(getUnderlyingWithdrawalFee())
        );

        if (_shares > IERC20(yVaultDAI).balanceOf(address(this))) {
            _shares = IERC20(yVaultDAI).balanceOf(address(this));
        }

        uint256 _before = IERC20(dai).balanceOf(address(this));
        IVault(yVaultDAI).withdraw(_shares);
        uint256 _after = IERC20(dai).balanceOf(address(this));
        return _after.sub(_before);
    }

    function _swap(uint256 _amountIn) internal {
        address[] memory path = new address[](2);
        path[0] = address(dai);
        path[1] = address(want);

        // approve uniswap to use dai
        Uni(dex).swapExactTokensForTokens(_amountIn, 0, path, address(this), now.add(1 days));
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
