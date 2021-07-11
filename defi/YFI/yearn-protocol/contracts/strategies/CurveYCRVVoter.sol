// SPDX-License-Identifier: MIT

pragma solidity ^0.5.17;

import "@openzeppelinV2/contracts/token/ERC20/IERC20.sol";
import "@openzeppelinV2/contracts/math/SafeMath.sol";
import "@openzeppelinV2/contracts/utils/Address.sol";
import "@openzeppelinV2/contracts/token/ERC20/SafeERC20.sol";

import "../../interfaces/curve/Curve.sol";
import "../../interfaces/curve/Gauge.sol";
import "../../interfaces/curve/Mintr.sol";
import "../../interfaces/curve/VoteEscrow.sol";
import "../../interfaces/uniswap/Uni.sol";
import "../../interfaces/yearn/IToken.sol";

contract CurveYCRVVoter {
    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;

    address public constant want = address(0xdF5e0e81Dff6FAF3A7e52BA697820c5e32D806A8);
    address public constant pool = address(0xFA712EE4788C042e2B7BB55E6cb8ec569C4530c1);
    address public constant mintr = address(0xd061D61a4d941c39E5453435B6345Dc261C2fcE0);
    address public constant crv = address(0xD533a949740bb3306d119CC777fa900bA034cd52);

    address public constant escrow = address(0x5f3b5DfEb7B28CDbD7FAba78963EE202a494e2A2);

    address public governance;
    address public strategy;

    constructor() public {
        governance = msg.sender;
    }

    function getName() external pure returns (string memory) {
        return "CurveYCRVVoter";
    }

    function setStrategy(address _strategy) external {
        require(msg.sender == governance, "!governance");
        strategy = _strategy;
    }

    function deposit() public {
        uint256 _want = IERC20(want).balanceOf(address(this));
        if (_want > 0) {
            IERC20(want).safeApprove(pool, 0);
            IERC20(want).safeApprove(pool, _want);
            Gauge(pool).deposit(_want);
        }
    }

    // Controller only function for creating additional rewards from dust
    function withdraw(IERC20 _asset) external returns (uint256 balance) {
        require(msg.sender == strategy, "!controller");
        balance = _asset.balanceOf(address(this));
        _asset.safeTransfer(strategy, balance);
    }

    // Withdraw partial funds, normally used with a vault withdrawal
    function withdraw(uint256 _amount) external {
        require(msg.sender == strategy, "!controller");
        uint256 _balance = IERC20(want).balanceOf(address(this));
        if (_balance < _amount) {
            _amount = _withdrawSome(_amount.sub(_balance));
            _amount = _amount.add(_balance);
        }
        IERC20(want).safeTransfer(strategy, _amount);
    }

    // Withdraw all funds, normally used when migrating strategies
    function withdrawAll() external returns (uint256 balance) {
        require(msg.sender == strategy, "!controller");
        _withdrawAll();

        balance = IERC20(want).balanceOf(address(this));
        IERC20(want).safeTransfer(strategy, balance);
    }

    function _withdrawAll() internal {
        Gauge(pool).withdraw(Gauge(pool).balanceOf(address(this)));
    }

    function createLock(uint256 _value, uint256 _unlockTime) external {
        require(msg.sender == strategy || msg.sender == governance, "!authorized");
        IERC20(crv).safeApprove(escrow, 0);
        IERC20(crv).safeApprove(escrow, _value);
        VoteEscrow(escrow).create_lock(_value, _unlockTime);
    }

    function increaseAmount(uint256 _value) external {
        require(msg.sender == strategy || msg.sender == governance, "!authorized");
        IERC20(crv).safeApprove(escrow, 0);
        IERC20(crv).safeApprove(escrow, _value);
        VoteEscrow(escrow).increase_amount(_value);
    }

    function release() external {
        require(msg.sender == strategy || msg.sender == governance, "!authorized");
        VoteEscrow(escrow).withdraw();
    }

    function _withdrawSome(uint256 _amount) internal returns (uint256) {
        Gauge(pool).withdraw(_amount);
        return _amount;
    }

    function balanceOfWant() public view returns (uint256) {
        return IERC20(want).balanceOf(address(this));
    }

    function balanceOfPool() public view returns (uint256) {
        return Gauge(pool).balanceOf(address(this));
    }

    function balanceOf() public view returns (uint256) {
        return balanceOfWant().add(balanceOfPool());
    }

    function setGovernance(address _governance) external {
        require(msg.sender == governance, "!governance");
        governance = _governance;
    }

    function execute(
        address to,
        uint256 value,
        bytes calldata data
    ) external returns (bool, bytes memory) {
        require(msg.sender == strategy || msg.sender == governance, "!governance");
        (bool success, bytes memory result) = to.call.value(value)(data);

        return (success, result);
    }
}
