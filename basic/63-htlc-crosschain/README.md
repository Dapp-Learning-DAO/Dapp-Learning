## HTLC 介绍

哈希锁定, 全称为哈希时间锁定合约, 英文为 HTLC（Hash TimeLock Contract）, 是解决跨链的一种技术方案. 指在智能合约的基础上, 让双方先锁定资产, 如果都在规定的时间内输入正确哈希值的原值, 即可完成交易.  
哈希锁定的实现的两个条件, 一个是哈希锁, 一个是时间锁, 必须同时满足这两个条件, 才能完成交易, 如果不能满足条件, 代币会自动返回, 不收手续费.

## 原理介绍

小白生成随机数, 并发送 Hash 给小黑, 同时小白在它链 A 上锁定币, 设定交易的时间, 小黑收到 Hash 后, 在它链 B 上锁定币, 也设置时间限制.
小白看到小黑的锁定后, 在规定时间内, 发送包含之前的随机数的认领协议给小黑, 小黑收到后在规定时间内给出哈希值后, 锁定的数字货币立即释放, 完成交易.

## 哈希锁定有什么优缺点

哈希锁定的优点: 实现了跨链资产的交换, 可以不用公证人.
哈希锁定的缺点: 没有实现跨链资产的转移, 更不能实现跨链合约的执行.

## 合约主要功能解析

### HashedTimelock

- newContract  
  开启一个 Hash 时间锁, 同时存入 ETH, 付款人各自在不同的链上调用, \_receiver 需要传入收款人的地址.

```solidity
 /**
     * @dev Sender sets up a new hash time lock contract depositing the ETH and
     * providing the reciever lock terms.
     *
     * @param _receiver Receiver of the ETH.
     * @param _hashlock A sha-2 sha256 hash hashlock.
     * @param _timelock UNIX epoch seconds time that the lock expires at.
     *                  Refunds can be made after this time.
     * @return contractId Id of the new HTLC. This is needed for subsequent
     *                    calls.
     */
function newContract(address payable _receiver, bytes32 _hashlock, uint _timelock)
        external
        payable
        fundsSent
        futureTimelock(_timelock)
        returns (bytes32 contractId)
    {
        contractId = sha256(
            abi.encodePacked(
                msg.sender,
                _receiver,
                msg.value,
                _hashlock,
                _timelock
            )
        );

        // Reject if a contract already exists with the same parameters. The
        // sender must change one of these parameters to create a new distinct
        // contract.
        if (haveContract(contractId))
            revert("Contract already exists");

        contracts[contractId] = LockContract(
            msg.sender,
            _receiver,
            msg.value,
            _hashlock,
            _timelock,
            false,
            false,
            0x0
        );

        emit LogHTLCNew(
            contractId,
            msg.sender,
            _receiver,
            msg.value,
            _hashlock,
            _timelock
        );
    }
```

- withdraw  
  收款人调用. 传入 contractID 和 Hash 对应的原始值后面, 收款人就可以收到对应的款项.

```solidity
/**
     * @dev Called by the receiver once they know the preimage of the hashlock.
     * This will transfer the locked funds to their address.
     *
     * @param _contractId Id of the HTLC.
     * @param _preimage sha256(_preimage) should equal the contract hashlock.
     * @return bool true on success
     */
function withdraw(bytes32 _contractId, bytes32 _preimage)
        external
        contractExists(_contractId)
        hashlockMatches(_contractId, _preimage)
        withdrawable(_contractId)
        returns (bool)
    {
        LockContract storage c = contracts[_contractId];
        c.preimage = _preimage;
        c.withdrawn = true;
        c.receiver.transfer(c.amount);
        emit LogHTLCWithdraw(_contractId);
        return true;
    }
```

- refund  
  付款人调用. 当收款人在规定的时间内没有调用 withdraw 提取款项时, 收款人可以调用这个 refund 方法把款项取回.

```solidity
/**
     * @dev Called by the sender if there was no withdraw AND the time lock has
     * expired. This will refund the contract amount.
     *
     * @param _contractId Id of HTLC to refund from.
     * @return bool true on success
     */
    function refund(bytes32 _contractId)
        external
        contractExists(_contractId)
        refundable(_contractId)
        returns (bool)
    {
        LockContract storage c = contracts[_contractId];
        c.refunded = true;
        c.sender.transfer(c.amount);
        emit LogHTLCRefund(_contractId);
        return true;
    }
```

### HashedTimelockERC20 和 HashedTimelockERC721

这两个合约功能和 HashedTimelock 功能相同, 区别在于 HashedTimelock 存入的是 ETH, HashedTimelockERC20 和 HashedTimelockERC721 存入是 ERC20 和 ERC721, 同时在存入前需要预先授权 approve 给 HashedTimelockERC20 和 HashedTimelockERC721 合约.

## 测试步骤

- 安装依赖

```bash
yarn
```

- 测试 HashedTimelock

```bash
npx hardhat test/HashedTimelock.js
```

## 参考文档

- 哈希时间锁详解: <https://yuanxuxu.com/2020/08/05/%E5%8C%BA%E5%9D%97%E9%93%BE%E8%B7%A8%E9%93%BE%E6%8A%80%E6%9C%AF%E4%B9%8B%E5%93%88%E5%B8%8C%E6%97%B6%E9%97%B4%E9%94%81/>
- 哈希时间锁原理: <https://learnblockchain.cn/article/2152>
- 哈希时间锁代码样例: <https://github.com/chatch/hashed-timelock-contract-ethereum/blob/master/test/htlcERC20.js>
