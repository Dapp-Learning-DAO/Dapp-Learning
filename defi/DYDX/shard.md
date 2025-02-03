# SHARP（Shared Prover）技术概述

SHARP 是 StarkWare 开发的一种共享证明服务，旨在为多个应用生成有效性证明。它基于 STARK（Scalable Transparent Argument of Knowledge）技术，提供高效、安全的零矩矢证明。

## **工作原理**

SHARP 的主要功能是接收来自不同应用的证明请求，并生成相应的 STARK 证明。其工作流程如下：

1. **接收请求**：应用程序将交易数据和执行结果发送至 SHARP。
2. **生成证明**：SHARP 使用 Cairo 语言编写的程序，对数据进行处理，生成 STARK 证明。
3. **提交证明**：将生成的证明提交到以太坊主网，由链上合约验证其有效性。

## **技术细节**

### **Cairo 语言**
SHARP 使用 Cairo 编写验证逻辑。Cairo 是一种图灵完备的编程语言，专为生成高效的 STARK 证明而设计。它允许开发者定义复杂的业务逻辑，同时保持高效的证明生成能力。

### **STARK 证明**
- **高扩展性**：支持批量处理大量交易，显著提升吞吐量。
- **透明性**：不需要可信设置，任何人都可以验证其有效性。
- **量子安全**：对抗量子计算攻击提供更高的安全保障。

## **优势**

- **共享性**：SHARP 可同时为多个应用生成证明，提高计算资源利用率。
- **高效性**：通过批量处理交易，显著降低单个应用的计算成本。
- **安全性**：利用 STARK 技术，确保交易数据的隐私和完整性。

## **应用场景**

SHARP 广泛应用于高扩展性和高安全性需求的场景，包括：
- 去中心化交易所
- 支付系统
- 区块链游戏

## **参考资料**

- [解析StarkWare的架构与生态：估值80亿美元的扩展潜力](https://zhuanlan.zhihu.com/p/530091142)
- [万字拆解 StarkWare：80 亿美元的「以太坊扩展最佳团队」是否高估？](https://web3caff.com/zh/archives/18842)

---

## **Cairo 示例代码**

### 验证单个计算加密逻辑

以下是一个简单的 Cairo 程序，用于验证输入是否是某个数的平方。

```cairo
%builtins output

func main{output_ptr : felt*}():
    let x = 3
    let y = 9
    assert x * x = y  # 验证 y 是否为 x 的平方
    return ()
end
```

### **代码解释**：
- **%builtins output**: 声明 Cairo 程序所需的内容构件。
- **assert 语句**: 验证 `x` 的平方是否等于 `y`。

---

### 批量验证逻辑

以下展示了一个批量处理交易验证的 Cairo 示例：

```cairo
%builtins range_check

from starkware.cairo.common.serialize import serialize_word

func validate_transactions{range_check_ptr}(transactions: felt*, n: felt) -> (result: felt):
    alloc_locals
    local sum = 0
    for i in range(n):
        let transaction = [transactions + i]
        assert transaction > 0  # 确保交易金额为正
        let sum = sum + transaction
    end
    return (sum)
end

func main{range_check_ptr}():
    let (result) = validate_transactions([5, 10, 15], 3)
    serialize_word(result)  # 输出验证结果
    return ()
end
```

### **代码解释**：
- **validate_transactions**：验证多个交易并计算总和。
- **assert 语句**：确保每笔交易的金额为正。
- **serialize_word**：序列化输出验证结果。


### 批量验证并生成响应的加密哈希

以下示例显示如何为批量处理交易生成加密哈希：

```cairo
%builtins range_check pedersen

from starkware.cairo.common.pedersen_hash import pedersen

func hash_transactions{range_check_ptr, pedersen_ptr}(transactions: felt*, n: felt) -> (hash: felt):
    alloc_locals
    local hash = 0
    for i in range(n):
        let transaction = [transactions + i]
        assert transaction > 0
        let hash = pedersen(hash, transaction)  # 将交易金额加入哈希
    end
    return (hash)
end

func main{range_check_ptr, pedersen_ptr}():
    let transactions = [5, 10, 15]
    let n = 3
    let (result) = hash_transactions(transactions, n)
    return ()
end
```


## **Solidity 合约示例**

以下是与 StarkEx 系统交互的 Solidity 合约，用于验证 STARK 证明。

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IStarkVerifier {
    function verifyProof(bytes calldata proof, uint256[] calldata publicInputs) external returns (bool);
}

contract StarkProofVerifier {
    IStarkVerifier public starkVerifier;

    constructor(address _verifier) {
        starkVerifier = IStarkVerifier(_verifier);
    }

    function verifyTransactionProof(bytes memory proof, uint256[] memory inputs) public view returns (bool) {
        return starkVerifier.verifyProof(proof, inputs);
    }
}

### **批量验证交易的 Solidity 合约**

以下扩展了批量验证功能，允许验证多个 STARK 证明：

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IStarkVerifier {
    function verifyProof(bytes calldata proof, uint256[] calldata publicInputs) external returns (bool);
}

contract BatchStarkProofVerifier {
    IStarkVerifier public starkVerifier;

    constructor(address _verifier) {
        starkVerifier = IStarkVerifier(_verifier);
    }

    function verifyBatchProofs(bytes[] memory proofs, uint256[][] memory inputs) public view returns (bool[] memory) {
        require(proofs.length == inputs.length, "Mismatched inputs and proofs length");

        bool[] memory results = new bool[](proofs.length);
        for (uint256 i = 0; i < proofs.length; i++) {
            results[i] = starkVerifier.verifyProof(proofs[i], inputs[i]);
        }
        return results;
    }
}
```

### **代码解释**：
- **批量验证方法**：`verifyBatchProofs` 接收多个证明和输入数组，依次验证每个证明。
- **输入长度验证**：确保证明和输入的数组长度一致。
- **返回值**：返回一个布尔数组，每个布尔值对应一个证明的验证结果。

---

## **链下与链上交互示例**

以下展示了如何将链下生成的 STARK 证明提交至链上验证。

### **链下 Python 示例**：

```python
from starkware.crypto.signature.fast_pedersen_hash import pedersen_hash
from starkware.starknet.services.api.gateway.transaction import InvokeFunction

def generate_proof_and_inputs(transactions):
    # 计算交易的哈希值
    hash_value = 0
    for tx in transactions:
        assert tx > 0  # 验证交易金额
        hash_value = pedersen_hash(hash_value, tx)

    # 模拟生成 STARK 证明（伪代码）
    proof = "mock_proof_data"
    public_inputs = [hash_value]
    return proof, public_inputs

# 示例交易数据
transactions = [5, 10, 15]
proof, public_inputs = generate_proof_and_inputs(transactions)

# 提交到链上的交易示例
invoke_tx = InvokeFunction(
    contract_address="0xVerifierContractAddress",
    entry_point_selector="verifyTransactionProof",
    calldata=[proof, *public_inputs]
)
```

### **链上 Solidity 合约交互**：

```solidity
// 提交验证交易
contractAddress.verifyTransactionProof(proof, publicInputs);
```

