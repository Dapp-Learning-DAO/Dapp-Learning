# COMP token

> COMP is an ERC-20 token that allows the owner to delegate voting rights to any address, including their own address. Changes to the owner’s token balance automatically adjust the voting rights of the delegate.

## ERC20 api

大部分接口实现是标准的 ERC20

### \_transferTokens

由于代币除了本身的 token 属性外，还具有代表投票权的属性，所以转让的方法做了部分修改。在常规的用户余额的增减操作之后，会调用转移投票权的方法 `_moveDelegates()`

```solidity
function _transferTokens(address src, address dst, uint96 amount) internal {
    require(src != address(0), "Comp::_transferTokens: cannot transfer from the zero address");
    require(dst != address(0), "Comp::_transferTokens: cannot transfer to the zero address");

    balances[src] = sub96(balances[src], amount, "Comp::_transferTokens: transfer amount exceeds balance");
    balances[dst] = add96(balances[dst], amount, "Comp::_transferTokens: transfer amount overflows");
    emit Transfer(src, dst, amount);

    _moveDelegates(delegates[src], delegates[dst], amount);
}
```

## governance api

治理投票相关的 api

### delegate

将自己的投票权委托给目标地址（包括自己）

- `delegate()` (msg.sender)直接委托给代理人
- `delegateBySig()` 委托人提供 vrs 签名，其他人代为操作

```solidity
/**
* @notice Delegate votes from `msg.sender` to `delegatee`
* @param delegatee The address to delegate votes to
*/
function delegate(address delegatee) public;

/**
* @notice Delegates votes from signatory to `delegatee`
* @param delegatee The address to delegate votes to
* @param nonce The contract state required to match the signature
* @param expiry The time at which to expire the signature
* @param v The recovery byte of the signature
* @param r Half of the ECDSA signature pair
* @param s Half of the ECDSA signature pair
*/
function delegateBySig(address delegatee, uint nonce, uint expiry, uint8 v, bytes32 r, bytes32 s) public;
```

上述两个方法内部都是调用 `_delegate()`

```solidity
function _delegate(address delegator, address delegatee) internal {
    address currentDelegate = delegates[delegator];
    uint96 delegatorBalance = balances[delegator];
    delegates[delegator] = delegatee;

    emit DelegateChanged(delegator, currentDelegate, delegatee);

    _moveDelegates(currentDelegate, delegatee, delegatorBalance);
}
```

转移投票权的方法:

- 减少用户 srcRep 的投票权，增加用户 dstRep 的投票权
- checkpoints 变量存储了每个用户在投票权发生变化时的投票权数量和区块序号

```solidity
function _moveDelegates(address srcRep, address dstRep, uint96 amount) internal {
    if (srcRep != dstRep && amount > 0) {
        if (srcRep != address(0)) {
            uint32 srcRepNum = numCheckpoints[srcRep];
            uint96 srcRepOld = srcRepNum > 0 ? checkpoints[srcRep][srcRepNum - 1].votes : 0;
            uint96 srcRepNew = sub96(srcRepOld, amount, "Comp::_moveVotes: vote amount underflows");
            _writeCheckpoint(srcRep, srcRepNum, srcRepOld, srcRepNew);
        }

        if (dstRep != address(0)) {
            uint32 dstRepNum = numCheckpoints[dstRep];
            uint96 dstRepOld = dstRepNum > 0 ? checkpoints[dstRep][dstRepNum - 1].votes : 0;
            uint96 dstRepNew = add96(dstRepOld, amount, "Comp::_moveVotes: vote amount overflows");
            _writeCheckpoint(dstRep, dstRepNum, dstRepOld, dstRepNew);
        }
    }
}

/// @notice A checkpoint for marking number of votes from a given block
struct Checkpoint {
    uint32 fromBlock;
    uint96 votes;
}

/// @notice A record of votes checkpoints for each account, by index
/// 每个用户的投票权数量变化的记录，{数量，blockNumber}
mapping (address => mapping (uint32 => Checkpoint)) public checkpoints;
/// @notice The number of checkpoints for each account
/// 每个用户下一个checkpoint的索引值（当前的值+1）
mapping (address => uint32) public numCheckpoints;

function _writeCheckpoint(address delegatee, uint32 nCheckpoints, uint96 oldVotes, uint96 newVotes) internal {
    uint32 blockNumber = safe32(block.number, "Comp::_writeCheckpoint: block number exceeds 32 bits");

    // 如果同一个用户在一个区块内连续更新多次，则覆盖上一次的记录值
    // 注意 nCheckpoints 在之前已经+1，所以这里需要-1
    if (nCheckpoints > 0 && checkpoints[delegatee][nCheckpoints - 1].fromBlock == blockNumber) {
        checkpoints[delegatee][nCheckpoints - 1].votes = newVotes;
    } else {
        // 不是在同一个区块内连续更新
        checkpoints[delegatee][nCheckpoints] = Checkpoint(blockNumber, newVotes);
        numCheckpoints[delegatee] = nCheckpoints + 1;
    }

    emit DelegateVotesChanged(delegatee, oldVotes, newVotes);
}
```

### getPriorVotes

获取目标用户在特定 `blockNumber` 以前的，被委托的投票权数量。

1. 检查目标用户最新的一次数量记录
   - 如果记录时间 < 目标时间，返回数量
2. 检查目标用户第一条记录
   - 记录时间 > 目标时间， 返回 0
3. 1，2 都没有匹配结果，则从用户第一条记录到最后一条记录之间，利用索引值遍历结果

```solidity
/**
    * @notice Determine the prior number of votes for an account as of a block number
    * @dev Block number must be a finalized block or else this function will revert to prevent misinformation.
    * @param account The address of the account to check
    * @param blockNumber The block number to get the vote balance at
    * @return The number of votes the account had as of the given block
    */
function getPriorVotes(address account, uint blockNumber) public view returns (uint96) {
    require(blockNumber < block.number, "Comp::getPriorVotes: not yet determined");

    uint32 nCheckpoints = numCheckpoints[account];
    if (nCheckpoints == 0) {
        return 0;
    }

    // First check most recent balance
    if (checkpoints[account][nCheckpoints - 1].fromBlock <= blockNumber) {
        return checkpoints[account][nCheckpoints - 1].votes;
    }

    // Next check implicit zero balance
    if (checkpoints[account][0].fromBlock > blockNumber) {
        return 0;
    }

    uint32 lower = 0;
    uint32 upper = nCheckpoints - 1;
    while (upper > lower) {
        uint32 center = upper - (upper - lower) / 2; // ceil, avoiding overflow
        Checkpoint memory cp = checkpoints[account][center];
        if (cp.fromBlock == blockNumber) {
            return cp.votes;
        } else if (cp.fromBlock < blockNumber) {
            lower = center;
        } else {
            upper = center - 1;
        }
    }
    return checkpoints[account][lower].votes;
}
```
