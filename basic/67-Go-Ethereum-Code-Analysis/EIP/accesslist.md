## 1.涉及的EIP

https://eips.ethereum.org/EIPS/eip-2930

https://eips.ethereum.org/EIPS/eip-2929

在EIP2930中这么写到：

一种新的[EIP-2718](https://eips.ethereum.org/EIPS/eip-2718)事务类型，格式为0x01 || rlp([chainId, nonce, gasPrice, gasLimit, to, value, data, accessList, signatureYParity, signatureR, signatureS]).

在EIP2930中定义了它的格式为

此交易的[EIP-2718](https://eips.ethereum.org/EIPS/eip-2718) TransactionPayload是rlp([chainId, nonce, gasPrice, gasLimit, to, value, data, accessList, signatureYParity, signatureR, signatureS]).

此交易的signatureYParity, signatureR, signatureS元素代表 secp256k1 签名keccak256(0x01 || rlp([chainId, nonce, gasPrice, gasLimit, to, value, data, accessList]))。

此交易的[EIP-2718](https://eips.ethereum.org/EIPS/eip-2718) ReceiptPayload是rlp([status, cumulativeGasUsed, logsBloom, logs]).



## 2.使用AccessList的动机

1. Generally, the main function of gas costs of opcodes is to be an estimate of the time needed to process that opcode, the goal being for the gas limit to correspond to a limit on the time needed to process a block. However, storage-accessing opcodes (SLOAD, as well as the *CALL, BALANCE and EXT* opcodes) have historically been underpriced. In the 2016 Shanghai DoS attacks, once the most serious client bugs were fixed, one of the more durably successful strategies used by the attacker was to simply send transactions that access or call a large number of accounts.
2. EXTCODESIZE 需要强制客户端去磁盘中查询到对应的contract .因此会导致在我们在磁盘上重新执行以太坊交易的时，恶意交易需要20～80s,而普通交易仅仅需要几毫秒

1. 因此在需要提高访问磁盘的操作码的gas费用，但是当同一个操作码第二次访问同一个位置的数据时，则在第二次收取极低的gas费用；为了记录哪些磁盘数据已经被访问过，所以用accessList进行存储



## 3.Specification

### Parameters

| Constant                 | Value |
| ------------------------ | ----- |
| FORK_BLOCK               | TBD   |
| COLD_SLOAD_COST          | 2100  |
| COLD_ACCOUNT_ACCESS_COST | 2600  |
| WARM_STORAGE_READ_COST   | 100   |

For blocks where block.number >= FORK_BLOCK, the following changes apply.

When executing a transaction, maintain a set accessed_addresses: Set[Address] and accessed_storage_keys: Set[Tuple[Address, Bytes32]] .

The sets are transaction-context-wide, implemented identically to other transaction-scoped constructs such as the self-destruct-list and global refund counter. In particular, if a scope reverts, the access lists should be in the state they were in before that scope was entered.

When a transaction execution begins,

- accessed_storage_keys is initialized to empty, and
- accessed_addresses is initialized to include

- - the tx.sender, tx.to (or the address being created if it is a contract creation transaction)
  - and the set of all precompiles.



## 4.AccessList在源码中的实现

这种新的transaction类型在go-ethereum中被定义为:`AccessListTx`

然后在TxData中增加了一个接口函数:`accessList()`用于 访问交易中提前声明的`AccessList`

```go
// AccessListTx is the data of EIP-2930 access list transactions.
type AccessListTx struct {
	ChainID    *big.Int        // destination chain ID
	Nonce      uint64          // nonce of sender account
	GasPrice   *big.Int        // wei per gas
	Gas        uint64          // gas limit
	To         *common.Address `rlp:"nil"` // nil means contract creation
	Value      *big.Int        // wei amount
	Data       []byte          // contract invocation input data
	AccessList AccessList      // EIP-2930 access list
	V, R, S    *big.Int        // signature values
}

func (tx *AccessListTx) accessList() AccessList { return tx.AccessList }
```



### 4.1在EVM.StateDB

在/core/vm/interface.go中：

有一个StateDB的接口，EVM通过实现这个接口的数据库与以太坊的World State Trie进行交互；为了支持AccessList，这个接口新增了以下几个方法:

- `StateDB.PrepareAccessList`：用于将precompile contracts和我们自己构造交易中的AccessList加入到StateDB中,实际上还是调用`StateDB.AddAddressToAccessList()` 和
- `StateDB.AddAddressToAccessList(addr common.Address)` :将addr插入`StateDB.accessList`

- `StateDB.AddSlotToAccessList(addr common.Address, slot common.Hash)`:将`(address,slot)`插入到`StateDB.accessList`
- `StateDb.AddressInAccessList(addr common.Address) bool`:判断该addr是否存在`StateDB.accessList`中

- `SlotInAccessList(addr common.Address, slot common.Hash) (addressOk bool, slotOk bool)`

判断该`(addr,slot)`是否存在于`StateDB.accessList`中

```go
// StateDB is an EVM database for full state querying.
type StateDB interface {
    // 用于将
    PrepareAccessList(sender common.Address, dest *common.Address, precompiles []common.Address, txAccesses types.AccessList)
	AddressInAccessList(addr common.Address) bool
	SlotInAccessList(addr common.Address, slot common.Hash) (addressOk bool, slotOk bool)
	// AddAddressToAccessList adds the given address to the access list. This operation is safe to perform
	// even if the feature/fork is not active yet
	AddAddressToAccessList(addr common.Address)
	// AddSlotToAccessList adds the given (address,slot) to the access list. This operation is safe to perform
	// even if the feature/fork is not active yet
	AddSlotToAccessList(addr common.Address, slot common.Hash)
}
```

#### StateDB具体实现：

在在`/core/state/statedb.go`中实现了上述的StateDB接口：

```go
// StateDB structs within the ethereum protocol are used to store anything
// within the merkle trie. StateDBs take care of caching and storing
// nested states. It's the general query interface to retrieve:
// * Contracts
// * Accounts
type StateDB struct {
    ...
   // Per-transaction access list
	accessList *accessList
    
    ...
}

// PrepareAccessList handles the preparatory steps for executing a state transition with
// regards to both EIP-2929 and EIP-2930:
//
// - Add sender to access list (2929)
// - Add destination to access list (2929)
// - Add precompiles to access list (2929)
// - Add the contents of the optional tx access list (2930)
//
// This method should only be called if Berlin/2929+2930 is applicable at the current number.
func (s *StateDB) PrepareAccessList(sender common.Address, dst *common.Address, precompiles []common.Address, list types.AccessList) {
	s.AddAddressToAccessList(sender)
	if dst != nil {
		s.AddAddressToAccessList(*dst)
		// If it's a create-tx, the destination will be added inside evm.create
	}
	for _, addr := range precompiles {
		s.AddAddressToAccessList(addr)
	}
	for _, el := range list {
		s.AddAddressToAccessList(el.Address)
		for _, key := range el.StorageKeys {
			s.AddSlotToAccessList(el.Address, key)
		}
	}
}

// AddAddressToAccessList adds the given address to the access list
func (s *StateDB) AddAddressToAccessList(addr common.Address) {
	if s.accessList.AddAddress(addr) {
		s.journal.append(accessListAddAccountChange{&addr})
	}
}

// AddSlotToAccessList adds the given (address, slot)-tuple to the access list
func (s *StateDB) AddSlotToAccessList(addr common.Address, slot common.Hash) {
	addrMod, slotMod := s.accessList.AddSlot(addr, slot)
	if addrMod {
		// In practice, this should not happen, since there is no way to enter the
		// scope of 'address' without having the 'address' become already added
		// to the access list (via call-variant, create, etc).
		// Better safe than sorry, though
		s.journal.append(accessListAddAccountChange{&addr})
	}
	if slotMod {
		s.journal.append(accessListAddSlotChange{
			address: &addr,
			slot:    &slot,
		})
	}
}

// AddressInAccessList returns true if the given address is in the access list.
func (s *StateDB) AddressInAccessList(addr common.Address) bool {
	return s.accessList.ContainsAddress(addr)
}

// SlotInAccessList returns true if the given (address, slot)-tuple is in the access list.
func (s *StateDB) SlotInAccessList(addr common.Address, slot common.Hash) (addressPresent bool, slotPresent bool) {
	return s.accessList.Contains(addr, slot)
}
```

#### accessList结构体

```go
type accessList struct {
	addresses map[common.Address]int
	slots     []map[common.Hash]struct{}
}
```

### 4.2准备进入到EVM时，针对AccessList的特殊处理

首先EVM的进入函数在` /core/state_transaction.go` 中`StateTransition.TransitionDb()`函数

EVM的可以不熟悉的可以查看:https://github.com/cyl19970726/EVM.git

在该函数中：

1. 计算accessList所需要额外消耗的gas; 一个address是2400gas,一个slot是1900gas。
2. 通过`st.state.PrepareAccessList(msg.From(), msg.To(), vm.ActivePrecompiles(rules), msg.AccessList()`将我们构造的交易中的`AccessList`和`precompile contracts`加入到`StateDB.的accessList`中

```go
// IntrinsicGas computes the 'intrinsic gas' for a message with the given data.
func IntrinsicGas(data []byte, accessList types.AccessList, isContractCreation bool, isHomestead, isEIP2028 bool) (uint64, error) {

    ...
    ...
    //计算accessList所需要额外消耗的gas; 一个address是2400gas,一个slot是1900gas
	if accessList != nil {
		gas += uint64(len(accessList)) * params.TxAccessListAddressGas             // 加载一个账户收取2400 gas
		gas += uint64(accessList.StorageKeys()) * params.TxAccessListStorageKeyGas //一共有多少个 slot
	}
	return gas, nil
}

func (st *StateTransition) TransitionDb() (*ExecutionResult, error) {
    ...	
    // Check clauses 4-5, subtract intrinsic gas if everything is correct
	gas, err := IntrinsicGas(st.data, st.msg.AccessList(), contractCreation, homestead, istanbul)
	if err != nil {
		return nil, err
	}
	if st.gas < gas {
		return nil, fmt.Errorf("%w: have %d, want %d", ErrIntrinsicGas, st.gas, gas)
	}
	st.gas -= gas
    ...
    
    // Set up the initial access list.
	if rules := st.evm.ChainConfig().Rules(st.evm.Context.BlockNumber); rules.IsBerlin {
		st.state.PrepareAccessList(msg.From(), msg.To(), vm.ActivePrecompiles(rules), msg.AccessList())
	}
    ...
    ...
}
```



### 4.3EVM.Create

/core/vm/evm.go

```go
// create creates a new contract using code as deployment code.
func (evm *EVM) create(caller ContractRef, codeAndHash *codeAndHash, gas uint64, value *big.Int, address common.Address, typ OpCode) ([]byte, common.Address, uint64, error) {
	// Depth check execution. Fail if we're trying to execute above the
	// limit.
	if evm.depth > int(params.CallCreateDepth) {
		return nil, common.Address{}, gas, ErrDepth
	}
	if !evm.Context.CanTransfer(evm.StateDB, caller.Address(), value) {
		return nil, common.Address{}, gas, ErrInsufficientBalance
	}
	nonce := evm.StateDB.GetNonce(caller.Address())
	if nonce+1 < nonce {
		return nil, common.Address{}, gas, ErrNonceUintOverflow
	}
	evm.StateDB.SetNonce(caller.Address(), nonce+1)
	// We add this to the access list _before_ taking a snapshot. Even if the creation fails,
	// the access-list change should not be rolled back
	if evm.chainRules.IsBerlin {
		evm.StateDB.AddAddressToAccessList(address)
	}
 	....   
}
```



### 4.4 Opcode

```
/core/vm/jumpTable.go`中定义了这个每个opcode的struct `operation
type operation struct {
	// execute is the operation function
	execute     executionFunc
	constantGas uint64
	dynamicGas  gasFunc
	// minStack tells how many stack items are required
	minStack int
	// maxStack specifies the max length the stack can have for this operation
	// to not overflow the stack.
	maxStack int

	// memorySize returns the memory size required for the operation
	memorySize memorySizeFunc
}
```

在接下去之前，我们先要了解每个Opcode执行的时的流程:

- operation := in.cfg.JumpTable[op]
- cost = operation.constantGas 

- operation.dynamicGas
- operation.execute()

翻译过来就是:

- 先根据当前的opcode读取到对应的operation
- 计算并减去该操作码规定的固定gas

- 计算并减去该操作码规定的动态gas
- 执行该operation

#### SStore

SStore这个操作码在JumpTable中的定义如下:

```
*SSTORE*: {   execute:    opSstore,   dynamicGas: gasSStoreEIP2929,   minStack:   minStack(2, 0),   maxStack:   maxStack(2, 0),},
```



按照上文提到的operation的执行逻辑：

1. 会先执行makeGasSStoreFunc()

1. 1. 在makeGasSStoreFunc中我们可以发现它执行了`evm.StateDB.AddSlotToAccessList(contract.Address(), slot)`将SStore要存储到State trie中的(address,slot)加载到StateDB.accessList中 

1. Sstore.Execute就是执行opSstore,会执行`interpreter.evm.StateDB.SetState(scope.Contract.Address(),loc.Bytes32(), val.Bytes32()`它会将`(addr,slot)=value `设置到state trie中

```go
func opSstore(pc *uint64, interpreter *EVMInterpreter, scope *ScopeContext) ([]byte, error) {
	if interpreter.readOnly {
		return nil, ErrWriteProtection
	}
	loc := scope.Stack.pop()
	val := scope.Stack.pop()
	interpreter.evm.StateDB.SetState(scope.Contract.Address(),
		loc.Bytes32(), val.Bytes32())
	return nil, nil
}

gasSStoreEIP2929 = makeGasSStoreFunc(params.SstoreClearsScheduleRefundEIP2200)
func makeGasSStoreFunc(clearingRefund uint64) gasFunc {
	return func(evm *EVM, contract *Contract, stack *Stack, mem *Memory, memorySize uint64) (uint64, error) {
		// If we fail the minimum gas availability invariant, fail (0)
		if contract.Gas <= params.SstoreSentryGasEIP2200 {
			return 0, errors.New("not enough gas for reentrancy sentry")
		}
		// Gas sentry honoured, do the actual gas calculation based on the stored value
		var (
			// y次栈顶元素 val
			// x栈顶元素  loc
			y, x    = stack.Back(1), stack.peek()
			slot    = common.Hash(x.Bytes32())
			current = evm.StateDB.GetState(contract.Address(), slot)
			cost    = uint64(0)
		)
		// Check slot presence in the access list
		if addrPresent, slotPresent := evm.StateDB.SlotInAccessList(contract.Address(), slot); !slotPresent {
			cost = params.ColdSloadCostEIP2929
			// If the caller cannot afford the cost, this change will be rolled back
			evm.StateDB.AddSlotToAccessList(contract.Address(), slot)
			if !addrPresent {
				// Once we're done with YOLOv2 and schedule this for mainnet, might
				// be good to remove this panic here, which is just really a
				// canary to have during testing
				panic("impossible case: address was not present in access list during sstore op")
			}
		}
		value := common.Hash(y.Bytes32())

		if current == value { // noop (1)
			// EIP 2200 original clause:
			//		return params.SloadGasEIP2200, nil
			return cost + params.WarmStorageReadCostEIP2929, nil // SLOAD_GAS
		}
		original := evm.StateDB.GetCommittedState(contract.Address(), x.Bytes32())
		if original == current {
			if original == (common.Hash{}) { // create slot (2.1.1)
				return cost + params.SstoreSetGasEIP2200, nil
			}
			if value == (common.Hash{}) { // delete slot (2.1.2b)
				evm.StateDB.AddRefund(clearingRefund)
			}
			// EIP-2200 original clause:
			//		return params.SstoreResetGasEIP2200, nil // write existing slot (2.1.2)
			return cost + (params.SstoreResetGasEIP2200 - params.ColdSloadCostEIP2929), nil // write existing slot (2.1.2)
		}
		if original != (common.Hash{}) {
			if current == (common.Hash{}) { // recreate slot (2.2.1.1)
				evm.StateDB.SubRefund(clearingRefund)
			} else if value == (common.Hash{}) { // delete slot (2.2.1.2)
				evm.StateDB.AddRefund(clearingRefund)
			}
		}
		if original == value {
			if original == (common.Hash{}) { // reset to original inexistent slot (2.2.2.1)
				// EIP 2200 Original clause:
				//evm.StateDB.AddRefund(params.SstoreSetGasEIP2200 - params.SloadGasEIP2200)
				evm.StateDB.AddRefund(params.SstoreSetGasEIP2200 - params.WarmStorageReadCostEIP2929)
			} else { // reset to original existing slot (2.2.2.2)
				// EIP 2200 Original clause:
				//	evm.StateDB.AddRefund(params.SstoreResetGasEIP2200 - params.SloadGasEIP2200)
				// - SSTORE_RESET_GAS redefined as (5000 - COLD_SLOAD_COST)
				// - SLOAD_GAS redefined as WARM_STORAGE_READ_COST
				// Final: (5000 - COLD_SLOAD_COST) - WARM_STORAGE_READ_COST
				evm.StateDB.AddRefund((params.SstoreResetGasEIP2200 - params.ColdSloadCostEIP2929) - params.WarmStorageReadCostEIP2929)
			}
		}
		// EIP-2200 original clause:
		//return params.SloadGasEIP2200, nil // dirty update (2.2)
		return cost + params.WarmStorageReadCostEIP2929, nil // dirty update (2.2)
	}
}
```





#### sload

sload这个操作码在Jump_table的定义如下(EIP2929之后):

```
*SLOAD*: {   execute:     opSload,   constantGas: 0,		                                                  dynamicGas:gasSloadEIP2929,   minStack:    minStack(1, 1),         maxStack:    maxStack(1, 1),},
```

- **在gasLoadEIP2929中的执行逻辑如下:**
  判断该(addr,slot)是否存在于StateDB.accessList中

- - 如果存在则只需要花费100gas(*WarmStorageReadCostEIP2929*)

- - 如果没存在，则需要调用evm.StateDB.AddSlotToAccessList(contract.Address(), slot)将其加入到accessList中，需要花费的gas为2100(params.ColdSloadCostEIP2929)

```go
// gasSLoadEIP2929 calculates dynamic gas for SLOAD according to EIP-2929
// For SLOAD, if the (address, storage_key) pair (where address is the address of the contract
// whose storage is being read) is not yet in accessed_storage_keys,
// charge 2100 gas and add the pair to accessed_storage_keys.
// If the pair is already in accessed_storage_keys, charge 100 gas.
func gasSLoadEIP2929(evm *EVM, contract *Contract, stack *Stack, mem *Memory, memorySize uint64) (uint64, error) {
	loc := stack.peek()
	slot := common.Hash(loc.Bytes32())
	// Check slot presence in the access list
	if _, slotPresent := evm.StateDB.SlotInAccessList(contract.Address(), slot); !slotPresent {
		// If the caller cannot afford the cost, this change will be rolled back
		// If he does afford it, we can skip checking the same thing later on, during execution
		evm.StateDB.AddSlotToAccessList(contract.Address(), slot)
		return params.ColdSloadCostEIP2929, nil
	}
	return params.WarmStorageReadCostEIP2929, nil
}


func opSload(pc *uint64, interpreter *EVMInterpreter, scope *ScopeContext) ([]byte, error) {
	loc := scope.Stack.peek()
	hash := common.Hash(loc.Bytes32())
	val := interpreter.evm.StateDB.GetState(scope.Contract.Address(), hash)
	loc.SetBytes(val.Bytes())
	return nil, nil
}
```



#### ext*

也会涉及到accessList，具体代码如下

```go
// gasEip2929AccountCheck checks whether the first stack item (as address) is present in the access list.
// If it is, this method returns '0', otherwise 'cold-warm' gas, presuming that the opcode using it
// is also using 'warm' as constant factor.
// This method is used by:
// - extcodehash,
// - extcodesize,
// - (ext) balance
func gasEip2929AccountCheck(evm *EVM, contract *Contract, stack *Stack, mem *Memory, memorySize uint64) (uint64, error) {
	addr := common.Address(stack.peek().Bytes20())
	// Check slot presence in the access list
	if !evm.StateDB.AddressInAccessList(addr) {
		// If the caller cannot afford the cost, this change will be rolled back
		evm.StateDB.AddAddressToAccessList(addr)
		// The warm storage read cost is already charged as constantGas
		return params.ColdAccountAccessCostEIP2929 - params.WarmStorageReadCostEIP2929, nil
	}
	return 0, nil
}



func opExtCodeSize(pc *uint64, interpreter *EVMInterpreter, scope *ScopeContext) ([]byte, error) {
	slot := scope.Stack.peek() // contract address
	slot.SetUint64(uint64(interpreter.evm.StateDB.GetCodeSize(slot.Bytes20())))
	return nil, nil
}
```

## 5.实例测试