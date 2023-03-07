# Optimism Bedrock

> by @paco0x

## Addresses

### Goerli

| Name                         | Type      | Address                                                                             |
| ---------------------------- | --------- | ----------------------------------------------------------------------------------- |
| Batcher Submitter            | EOA       | https://goerli.etherscan.io/address/0x7431310e026b69bfc676c0013e12a1a11411eec9      |
| BatchInbox                   | EOA       | https://goerli.etherscan.io/address/0xff00000000000000000000000000000000000420      |
| Proposer                     | EOA       | https://goerli.etherscan.io/address/0x02b1786A85Ec3f71fBbBa46507780dB7cF9014f6      |
| Challenger                   | Multi-sig | https://goerli.etherscan.io/address/0xBc1233d0C3e6B5d53Ab455cF65A6623F6dCd7e4f      |
| L2OutputOracle               | Contract  | https://goerli.etherscan.io/address/0xE6Dfba0953616Bacab0c9A8ecb3a9BBa77FC15c0      |
| OptimismPortal               | Contract  | https://goerli.etherscan.io/address/0x5b47E1A08Ea6d985D6649300584e6722Ec4B1383      |
| L1CrossDomainMessenger       | Contract  | https://goerli.etherscan.io/address/0x5086d1eef304eb5284a0f6720f79403b4e9be294      |
| L1StandardBridge             | Contract  | https://goerli.etherscan.io/address/0x636af16bf2f682dd3109e60102b8e1a089fedaa8#code |
| L1ERC721Bridge               | Contract  | https://goerli.etherscan.io/address/0x8DD330DdE8D9898d43b4dc840Da27A07dF91b3c9      |
| OptimismMintableERC20Factory | Contract  | https://goerli.etherscan.io/address/0x883dcF8B05364083D849D8bD226bC8Cb4c42F9C5      |
| SystemConfig                 | Contract  | https://goerli.etherscan.io/address/0xAe851f927Ee40dE99aaBb7461C00f9622ab91d60      |
| SystemDictator               | Contract  | https://goerli.etherscan.io/address/0x1f0613A44c9a8ECE7B3A2e0CdBdF0F5B47A50971#code |
| SystemDictator Owner         | Multi-sig | https://goerli.etherscan.io/address/0xBc1233d0C3e6B5d53Ab455cF65A6623F6dCd7e4f      |

### OP Bedrock on Goerli

| Name                          | Type       | Address                                                                                 |
| ----------------------------- | ---------- | --------------------------------------------------------------------------------------- |
| L1 Attribute Depositor        | EOA        | https://goerli-optimism.etherscan.io/address/0xdeaddeaddeaddeaddeaddeaddeaddeaddead0001 |
| L1Block                       | Pre-deploy | https://goerli-optimism.etherscan.io/address/0x4200000000000000000000000000000000000015 |
| L2ToL1MessagePasser           | Pre-deploy | https://goerli-optimism.etherscan.io/address/0x4200000000000000000000000000000000000016 |
| L2CrossDomainMessenger        | Pre-deploy | https://goerli-optimism.etherscan.io/address/0x4200000000000000000000000000000000000007 |
| L2StandardBridge              | Pre-deploy | https://goerli-optimism.etherscan.io/address/0x4200000000000000000000000000000000000010 |
| L2ERC721Bridge                | Pre-deploy | https://goerli-optimism.etherscan.io/address/0x4200000000000000000000000000000000000014 |
| OptimismMintableERC20Factory  | Pre-deploy | https://goerli-optimism.etherscan.io/address/0x4200000000000000000000000000000000000012 |
| OptimismMintableERC721Factory | Pre-deploy | https://goerli-optimism.etherscan.io/address/0x4200000000000000000000000000000000000017 |

Pre-deployed contracts are deployed in genesis block by directly setting the state DB: [https://github.com/ethereum-optimism/optimism/blob/c21476c1874702da8c0817d5c7c9de5b8066eb4b/op-chain-ops/genesis/setters.go#L226](https://github.com/ethereum-optimism/optimism/blob/c21476c1874702da8c0817d5c7c9de5b8066eb4b/op-chain-ops/genesis/setters.go#L226)

## Component

- **op-geth** is a slightly modified version of **geth**, the Execution Engine in Optimism Bedrock, used to produce L2 blocks. You can find all the changes at [https://op-geth.optimism.io/](https://op-geth.optimism.io/).
- **op-node** is the rollup node, which is a standalone stateless binary.
  - It receives L2 user transactions and converts the deposit data into payload attributes for the Engine API.
  - It submits the payload attributes to the Engine API, where they are converted into blocks and added to the canonical chain.
  - It can also derive the L2 chain from L1 deposits & batchInbox.
  - It generates L2 outputRoots for submission or verification.
- **op-batcher** submits the L2 transactions to DA (currently, L1 calldata) through batcher transactions.
- **op-proposer** periodically submits the L2 state root to the L1 contract for verification and withdrawal proving.

## L2 Blocks

Before Bedrock, the blockchain had a variable block time and one transaction per block.

With Bedrock, the block time is fixed at 2 seconds and can contain multiple transactions.

Advantages of this change include:

- Consistency with the Ethereum mainnet after POS.
- Convenience for contracts that use block numbers rather than timestamps to keep track of time; for example, the `MasterChef` contract. Block numbers are harder to manipulate than block timestamps.
- Reduced overhead for storing the blockchain.
- No need to update the state trie root after each transaction.

#### Epochs and the Sequencing Window

The rollup chain is subdivided into epochs. There is a 1:1 correspondence between L1 block numbers and epoch numbers.

L2 block timestamp can be 10 minutes (**sequencer drift parameter**) ahead of L1. This parameter is meant to ensure liveness of the L2 chain during temporary loss of connection to L1.

## Transaction Types

On L2, Optimism adds a new type of transaction in op-geth called deposit transaction.

There are 2 types of deposit transactions:

- System transactions, the first transaction of every L2 block, setting the attributes from L1
- Deposit transactions, transactions sent by users on L1 to L2

Other transactions are sent by users on L2 directly

## Deposit

- Call `OptimismPortal.depositTransaction(to, value, gasLimit, isCreation, data)` on L1.
- Emit the `TransactionDeposited(from, to, version, opaqueData)` event in the contract.
  - If `from` is a contract, address aliasing will be performed. For more information, see the [address aliasing documentation](https://community.optimism.io/docs/developers/build/differences/#using-eth-in-contracts).
- The sequencer uses these events to generate deposited transactions on L2 and build the block.
- Deposit transactions are not retryable.
- It's invalid to have an L2 block without including the deposits of its L1 origin. (anti censorship)

The L2 execution gas is paid by the user on L1.

## Withdrawal

- Call `L2ToL1MessagePasser.initiateWithdrawal(target, gasLimit, data)` on L2.
- Set the contract storage for `sentMessages[withdrawalHash]` to `true`.
- The proposer should set the L2 state root and storage root of `L2ToL1MessagePasser` on L1 (`L2OutputOracle`).
- Prove the state on L1 by calling `OptimismPortal.proveWithdrawalTransaction()`.
  - Prove the `withdrawalHash -> true` key pair exists in the contract’s storage(**_Merkle Patricia Trie_**)
- Wait for the finalization period.
- Finalize the withdrawal transaction by calling `OptimismPortal.finalizeWithdrawalTransaction()`.
- Withdrawal transactions are not retryable.

They use `Safecall.call()` to ignore the return data to avoid the potential return data bomb.

[https://www.notonlyowner.com/research/message-traps-in-the-arbitrum-bridge](https://www.notonlyowner.com/research/message-traps-in-the-arbitrum-bridge)

## Message Passing

Optimism constructed a pair of messaging contracts for message passing by utilizing the low-level deposit and withdraw transactions. The contracts used for message passing are `L1CrossDomainMessenger.sol` and `L2CrossDomainMessenger.sol`.

The messages are retryable, unlike the raw deposits/withdrawals. Developers should use messenger contracts instead of low-level deposits/withdrawals.

- To pass a message to the other chain, users need to call `CrossDomainMessenger.sendMessage(target, message, minGasLimit)`.
- To obtain the caller on the other chain, users can use `CrossDomainMessenger.xDomainMsgSender()`.
  - If it is an L1 → L2 message, remember to undo the address alias.

### L1 → L2 message

#### on L1

- user call `L1CrossDomainMessenger.sendMessage()`
- gas is charged and computed on L1
  - gas usage: `gasLimit = minGasLimit * 1.016 + _message.length * 16 + 200,000`
- call `OptimismPortal.depositTransaction()`

```solidity
portal.depositTransaction{value: msg.value}(
	L2CrossDomainMessenger,  // The pre-deplyed CrossDomainMessenger on L2
	msg.value,
	gasLimit,
	false,
	abi.encodeWithSelector(
	  this.relayMessage.selector,
    messageNonce(),
    msg.sender,
    _target,
    msg.value,
    _minGasLimit,
    _message
	)
)

```

- emit the `TransactionDeposited()` event in the `OptimismPortal` contract on L1

#### on L2

- op-node generate a deposit transaction by reading the `TransactionDeposited` events
- the deposited transaction calls the `L2CrossDomainMessager.relayMessage()` on L2
- call the target address in `L2CrossDomainMessager.relayMessage()` and record the result
- call the target address with the message
- If the replay transaction failed, user can replay it manually

### L2 → L1 message

#### on L2

- user call `L2CrossDomainMessenger.sendMessage()`
- call `L2ToL1MessagePasser.intializeWithdraw()`
- set `sentMessages[withdrawalHash] = true;` in the `L2ToL1MessagePasser`

#### on L1

- wait for the proposer submit the state root on L1 `L2OutputOracle`
- prove the tx hash is already written to `L2ToL1MessagePasser` on L2
- wait for the finalization period
- finalize the withdrawal transaction by calling `OptimismPortal.finalizeWithdrawalTransaction()`
- call `L1CrossDomainMessenger.relayMessage()`
- call the target address with the message

## Bridges

Optimism built the following bridges for ERC20 and ERC721

- `L1StandardBridge` & `L2StandardBridge`
- `L1ERC721Bridge` & `L2ERC721Bridge`

Under the hood, Optimism uses the message-passing mechanism provided by `CrossDomainMessenger` contracts.

### Bridging from L1 to L2

Before bridging from L1 to L2, users need to create a remote ERC20 contract on L2 by using the `OptimismMintableERC20Factory` contract.

#### On L1

- Lock the token/ETH and record the amount on L1's `L1StandardBridge`.
- Send a message to L2's `L2StandardBridge`.

#### On L2

- Receive the message call in `L2StandardBridge`.
- Mint the remote token with the specified amount.

### Bridging from L2 to L1

The process is very similar to the above.

## L2OutputOracle

### State Verification

`L2OutputOracle` is a contract on L1 that saves the L2 state roots for verification. Verifiers can challenge the result through a disputing system.

Currently, only an EOA address operated by Optimism can write to this contract.

The challenger address is set to a multi-sig wallet controlled by Optimism.

### Withdrawal proving

`L2OutputOracle` also saves the storage root of the `L2ToL1MessagePasser` contract on L2 for proving the withdrawal transactions on L1.

## Batcher

**op-batcher** submits the L2 data as calldata to `BatchInbox` address.

- op-node can read these calldata to rebuild the entire L2 chain.
- Verifiers can use these data to verify the state root in `L2OutputOracle` contract.

### Data format

**Batches**, \***\*a batch \*\***contains all the txs of an L2 block

**Channels**, Batches are aggregated into **channel**

**Channel Frames**, channels are compressed and split into **channel frames**

Batcher submits those frames in the [batcher transactions](https://github.com/ethereum-optimism/optimism/blob/f30376825c82f62b846590487fe46b7435213d37/specs/glossary.md#batcher-transaction).

## Proposer

**op-proposer** submits the L2 state root and the storage trie root hash of the `L2ToL1MessagePasser` contract on L2 to L1 `L2OutputOracle`.

Proposer queries these data through op-node’s `optimism_outputAtBlock` RPC API. Inside `optimism_outputAtBlock`:

- fetch the L2 block header through `eth_getBlockByNumber` RPC in op-geth
- fetch the storage root of `L2ToL1MessagePasser` contract through `eth_getProof` RPC in op-geth
- return the state root of the L2 block and the storage root of `L2ToL1MessagePasser` contract
  - before returning, verify the storage root is contained in the state trie

Test account:

- Address: `0x3bb843cf8e26FF1Fdbdb6B2eC1B0dD5B37082B64`
- Private Key: `0x8567689e64d90470cf9e30ed5d59d495e7a27de4fbe964620e45ecbe050018d7`

## Reference

- <https://paco0x.notion.site/Optimism-Bedrock-a546537289864e2dad5eca77e7386b96>
- <https://community.optimism.io/docs/developers/bedrock/how-is-bedrock-different/>
