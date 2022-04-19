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
contract CloneRewarderTime is IRewarder,  BoringOwnable{
    using BoringMath for uint256;
    using BoringMath128 for uint128;
    using BoringERC20 for IERC20;

    IERC20 public rewardToken;

    /// @notice Info of each Rewarder user.
    /// `amount` LP token amount the user has provided.
    /// `rewardDebt` The amount of Reward Token entitled to the user.
    struct UserInfo {
        uint256 amount;
        uint256 rewardDebt;
        uint256 unpaidRewards;
    }

    /// @notice Info of the rewarder pool
    struct PoolInfo {
        uint128 accToken1PerShare;
        uint64 lastRewardTime;
    }

    /// @notice Mapping to track the rewarder pool.
    mapping (uint256 => PoolInfo) public poolInfo;


    /// @notice Info of each user that stakes LP tokens.
    mapping (uint256 => mapping (address => UserInfo)) public userInfo;

    uint256 public rewardPerSecond;
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

    event LogOnReward(address indexed user, uint256 indexed pid, uint256 amount, address indexed to);
    event LogUpdatePool(uint256 indexed pid, uint64 lastRewardTime, uint256 lpSupply, uint256 accToken1PerShare);
    event LogRewardPerSecond(uint256 rewardPerSecond);
    event LogInit(IERC20 indexed rewardToken, address owner, uint256 rewardPerSecond, IERC20 indexed masterLpToken);

    constructor (address _MASTERCHEF_V2) public {
        MASTERCHEF_V2 = _MASTERCHEF_V2;
    }

    /// @notice Serves as the constructor for clones, as clones can't have a regular constructor
    /// @dev `data` is abi encoded in the format: (IERC20 collateral, IERC20 asset, IOracle oracle, bytes oracleData)
    function init(bytes calldata data) public payable {
        require(rewardToken == IERC20(0), "Rewarder: already initialized");
        (rewardToken, owner, rewardPerSecond, masterLpToken) = abi.decode(data, (IERC20, address, uint256, IERC20));
        require(rewardToken != IERC20(0), "Rewarder: bad token");
        unlocked = 1;
        emit LogInit(rewardToken, owner, rewardPerSecond, masterLpToken);
    }

    function onSushiReward (uint256 pid, address _user, address to, uint256, uint256 lpTokenAmount) onlyMCV2 lock override external {
        require(IMasterChefV2(MASTERCHEF_V2).lpToken(pid) == masterLpToken);

        PoolInfo memory pool = updatePool(pid);
        UserInfo storage user = userInfo[pid][_user];
        uint256 pending;
        if (user.amount > 0) {
            pending =
                (user.amount.mul(pool.accToken1PerShare) / ACC_TOKEN_PRECISION).sub(
                    user.rewardDebt
                ).add(user.unpaidRewards);
            uint256 balance = rewardToken.balanceOf(address(this));
            if (pending > balance) {
                rewardToken.safeTransfer(to, balance);
                user.unpaidRewards = pending - balance;
            } else {
                rewardToken.safeTransfer(to, pending);
                user.unpaidRewards = 0;
            }
        }
        user.amount = lpTokenAmount;
        user.rewardDebt = lpTokenAmount.mul(pool.accToken1PerShare) / ACC_TOKEN_PRECISION;
        emit LogOnReward(_user, pid, pending - user.unpaidRewards, to);
    }

    function pendingTokens(uint256 pid, address user, uint256) override external view returns (IERC20[] memory rewardTokens, uint256[] memory rewardAmounts) {
        IERC20[] memory _rewardTokens = new IERC20[](1);
        _rewardTokens[0] = (rewardToken);
        uint256[] memory _rewardAmounts = new uint256[](1);
        _rewardAmounts[0] = pendingToken(pid, user);
        return (_rewardTokens, _rewardAmounts);
    }

    function rewardRates() external view returns (uint256[] memory) {
        uint256[] memory _rewardRates = new uint256[](1);
        _rewardRates[0] = rewardPerSecond;
        return (_rewardRates);
    }

    /// @notice Sets the sushi per second to be distributed. Can only be called by the owner.
    /// @param _rewardPerSecond The amount of Sushi to be distributed per second.
    function setRewardPerSecond(uint256 _rewardPerSecond) public onlyOwner {
        rewardPerSecond = _rewardPerSecond;
        emit LogRewardPerSecond(_rewardPerSecond);
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
    /// @return pending SUSHI reward for a given user.
    function pendingToken(uint256 _pid, address _user) public view returns (uint256 pending) {
        PoolInfo memory pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accToken1PerShare = pool.accToken1PerShare;
        uint256 lpSupply = IMasterChefV2(MASTERCHEF_V2).lpToken(_pid).balanceOf(MASTERCHEF_V2);
        if (block.timestamp > pool.lastRewardTime && lpSupply != 0) {
            uint256 time = block.timestamp.sub(pool.lastRewardTime);
            uint256 sushiReward = time.mul(rewardPerSecond);
            accToken1PerShare = accToken1PerShare.add(sushiReward.mul(ACC_TOKEN_PRECISION) / lpSupply);
        }
        pending = (user.amount.mul(accToken1PerShare) / ACC_TOKEN_PRECISION).sub(user.rewardDebt).add(user.unpaidRewards);
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
                uint256 sushiReward = time.mul(rewardPerSecond);
                pool.accToken1PerShare = pool.accToken1PerShare.add((sushiReward.mul(ACC_TOKEN_PRECISION) / lpSupply).to128());
            }
            pool.lastRewardTime = block.timestamp.to64();
            poolInfo[pid] = pool;
            emit LogUpdatePool(pid, pool.lastRewardTime, lpSupply, pool.accToken1PerShare);
        }
    }
}
