// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;
import "../interfaces/IRewarder.sol";
import "@boringcrypto/boring-solidity/contracts/libraries/BoringERC20.sol";
import "@boringcrypto/boring-solidity/contracts/libraries/BoringMath.sol";
import "@boringcrypto/boring-solidity/contracts/BoringOwnable.sol";

interface IMasterChefV2 {
    function lpToken(uint256 pid) external view returns (IERC20 _lpToken);
}

/// @author @0xKeno
contract CloneRewarderTimeDual is IRewarder,  BoringOwnable{
    using BoringMath for uint256;
    using BoringMath128 for uint128;
    using BoringERC20 for IERC20;

    IERC20 public rewardToken1;
    IERC20 public rewardToken2;

    /// @notice Info of each Rewarder user.
    /// `amount` LP token amount the user has provided.
    /// `rewardDebt1` The amount of reward token 1 entitled to the user.
    /// `rewardDebt2` The amount of reward token 2 entitled to the user.
    struct UserInfo {
        uint256 amount;
        uint256 rewardDebt1;
        uint256 rewardDebt2;
        uint256 unpaidRewards1;
        uint256 unpaidRewards2;
    }

    /// @notice Info of the rewarder pool.
    struct PoolInfo {
        uint128 accToken1PerShare;
        uint128 accToken2PerShare;
        uint64 lastRewardTime;
    }

    /// @notice Info of each pool.
    mapping (uint256 => PoolInfo) public poolInfo;


    /// @notice Info of each user that stakes LP tokens.
    mapping (uint256 => mapping (address => UserInfo)) public userInfo;

    uint128 public rewardPerSecond1;
    uint128 public rewardPerSecond2;
    IERC20 public masterLpToken;
    uint256 private constant ACC_TOKEN_PRECISION = 1e12;

    address public immutable MASTERCHEF_V2;

    uint256 internal unlocked;
    modifier lock() {
        require(unlocked == 1, "LOCKED");
        unlocked = 2;
        _;
        unlocked = 1;
    }

    event LogOnReward(address indexed user, uint256 indexed pid, uint256 amount1, uint256 amount2, address indexed to);
    event LogUpdatePool(uint256 indexed pid, uint64 lastRewardTime, uint256 lpSupply, uint256 accToken1PerShare, uint256 accToken2PerShare);
    event LogRewardPerSecond(uint256 rewardPerSecond1, uint256 rewardPerSecond2);
    event LogInit(IERC20 rewardToken1, IERC20 rewardToken2, address owner, uint256 rewardPerSecond1, uint256 rewardPerSecond2, IERC20 indexed masterLpToken);

    constructor (address _MASTERCHEF_V2) public {
        MASTERCHEF_V2 = _MASTERCHEF_V2;
    }

    /// @notice Serves as the constructor for clones, as clones can't have a regular constructor
    /// @dev `data` is abi encoded in the format: (IERC20 collateral, IERC20 asset, IOracle oracle, bytes oracleData)
    function init(bytes calldata data) public payable {
        require(rewardToken1 == IERC20(0), "Rewarder: already initialized");
        (rewardToken1, rewardToken2, owner, rewardPerSecond1, rewardPerSecond2, masterLpToken) = abi.decode(data, (IERC20, IERC20, address, uint128, uint128, IERC20));
        require(rewardToken1 != IERC20(0), "Rewarder: bad token");
        unlocked = 1;
        emit LogInit(rewardToken1, rewardToken2, owner, rewardPerSecond1, rewardPerSecond2, masterLpToken);
    }

    function onSushiReward (uint256 pid, address _user, address to, uint256, uint256 lpTokenAmount) onlyMCV2 lock override external {
        require(IMasterChefV2(MASTERCHEF_V2).lpToken(pid) == masterLpToken);

        PoolInfo memory pool = updatePool(pid);
        UserInfo memory _userInfo = userInfo[pid][_user];
        uint256 pending1;
        uint256 pending2;
        if (_userInfo.amount > 0) {
            pending1 =
                (_userInfo.amount.mul(pool.accToken1PerShare) / ACC_TOKEN_PRECISION).sub(
                    _userInfo.rewardDebt1
                ).add(_userInfo.unpaidRewards1);
            pending2 =
                (_userInfo.amount.mul(pool.accToken2PerShare) / ACC_TOKEN_PRECISION).sub(
                    _userInfo.rewardDebt2
                ).add(_userInfo.unpaidRewards2);

            uint256 balance1 = rewardToken1.balanceOf(address(this));
            uint256 balance2 = rewardToken2.balanceOf(address(this));

            if (pending1 > balance1) {
                rewardToken1.safeTransfer(to, balance1);
                _userInfo.unpaidRewards1 = pending1 - balance1;
            } else {
                rewardToken1.safeTransfer(to, pending1);
                _userInfo.unpaidRewards1 = 0;
            }

            if (pending2 > balance2) {
                rewardToken2.safeTransfer(to, balance2);
                _userInfo.unpaidRewards2 = pending2 - balance2;
            } else {
                rewardToken2.safeTransfer(to, pending2);
                _userInfo.unpaidRewards2 = 0;
            }
        }
        _userInfo.amount = lpTokenAmount;
        _userInfo.rewardDebt1 = lpTokenAmount.mul(pool.accToken1PerShare) / ACC_TOKEN_PRECISION;
        _userInfo.rewardDebt2 = lpTokenAmount.mul(pool.accToken2PerShare) / ACC_TOKEN_PRECISION;

        userInfo[pid][_user] = _userInfo;

        emit LogOnReward(_user, pid, pending1 - _userInfo.unpaidRewards1, pending2 - _userInfo.unpaidRewards2, to);
    }

    function pendingTokens(uint256 pid, address user, uint256) override external view returns (IERC20[] memory rewardTokens, uint256[] memory rewardAmounts) {
        IERC20[] memory _rewardTokens = new IERC20[](2);
        _rewardTokens[0] = rewardToken1;
        _rewardTokens[1] = rewardToken2;
        uint256[] memory _rewardAmounts = new uint256[](2);
        (uint256 reward1, uint256 reward2) = pendingToken(pid, user);
        _rewardAmounts[0] = reward1;
        _rewardAmounts[1] = reward2;
        return (_rewardTokens, _rewardAmounts);
    }

    function rewardRates() external view returns (uint256[] memory) {
        uint256[] memory _rewardRates = new uint256[](2);
        _rewardRates[0] = rewardPerSecond1;
        _rewardRates[1] = rewardPerSecond2;
        return (_rewardRates);
    }

    /// @notice Sets the sushi per second to be distributed. Can only be called by the owner.
    /// @param _rewardPerSecond1 The amount of reward token 1 to be distributed per second.
    /// @param _rewardPerSecond2 The amount of reward token 2 to be distributed per second.
    function setRewardPerSecond(uint128 _rewardPerSecond1, uint128 _rewardPerSecond2) public onlyOwner {
        rewardPerSecond1 = _rewardPerSecond1;
        rewardPerSecond2 = _rewardPerSecond2;
        emit LogRewardPerSecond(_rewardPerSecond1, _rewardPerSecond2);
    }

    /// @notice Allows owner to reclaim/withdraw any tokens (including reward tokens) held by this contract
    /// @param token Token to reclaim, use 0x00 for Ethereum
    /// @param amount Amount of tokens to reclaim
    /// @param to Receiver of the tokens, first of his name, rightful heir to the lost tokens,
    /// reightful owner of the extra tokens, and ether, protector of mistaken transfers, mother of token reclaimers,
    /// the Khaleesi of the Great Token Sea, the Unburnt, the Breaker of blockchains.
    function reclaimTokens(address token, uint256 amount, address payable to) public onlyOwner {
        if (token == address(0)) {
            to.transfer(amount);
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    modifier onlyMCV2 {
        require(
            msg.sender == MASTERCHEF_V2,
            "Only MCV2 can call this function."
        );
        _;
    }

    /// @notice View function to see pending Token
    /// @param _pid The index of the pool. See `poolInfo`.
    /// @param _user Address of user.
    function pendingToken(uint256 _pid, address _user) public view returns (uint256 reward1, uint256 reward2) {
        PoolInfo memory pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accToken1PerShare = pool.accToken1PerShare;
        uint256 accToken2PerShare = pool.accToken2PerShare;
        uint256 lpSupply = IMasterChefV2(MASTERCHEF_V2).lpToken(_pid).balanceOf(MASTERCHEF_V2);
        if (block.timestamp > pool.lastRewardTime && lpSupply != 0) {
            uint256 time = block.timestamp.sub(pool.lastRewardTime);
            uint256 pending1 = time.mul(rewardPerSecond1);
            uint256 pending2 = time.mul(rewardPerSecond2);
            accToken1PerShare = accToken1PerShare.add(pending1.mul(ACC_TOKEN_PRECISION) / lpSupply);
            accToken2PerShare = accToken2PerShare.add(pending2.mul(ACC_TOKEN_PRECISION) / lpSupply);
        }
        reward1 = (user.amount.mul(accToken1PerShare) / ACC_TOKEN_PRECISION).sub(user.rewardDebt1).add(user.unpaidRewards1);
        reward2 = (user.amount.mul(accToken2PerShare) / ACC_TOKEN_PRECISION).sub(user.rewardDebt2).add(user.unpaidRewards2);
    }

    /// @notice Update reward variables of the given pool.
    /// @param pid The index of the pool. See `poolInfo`.
    /// @return pool Returns the pool that was updated.
    function updatePool(uint256 pid) public returns (PoolInfo memory pool) {
        pool = poolInfo[pid];
        if (block.timestamp > pool.lastRewardTime) {
            uint256 lpSupply = IMasterChefV2(MASTERCHEF_V2).lpToken(pid).balanceOf(MASTERCHEF_V2);

            if (lpSupply > 0) {
                uint256 time = block.timestamp.sub(pool.lastRewardTime);
                uint256 pending1 = time.mul(rewardPerSecond1);
                uint256 pending2 = time.mul(rewardPerSecond2);
                pool.accToken1PerShare = pool.accToken1PerShare.add((pending1.mul(ACC_TOKEN_PRECISION) / lpSupply).to128());
                pool.accToken2PerShare = pool.accToken2PerShare.add((pending2.mul(ACC_TOKEN_PRECISION) / lpSupply).to128());
            }
            pool.lastRewardTime = block.timestamp.to64();
            poolInfo[pid] = pool;
            emit LogUpdatePool(pid, pool.lastRewardTime, lpSupply, pool.accToken1PerShare, pool.accToken2PerShare);
        }
    }
}
