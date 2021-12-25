# V3 源码编程技巧学习

## MLOAD vs SLOAD

在源码更新头寸（position）函数中，在从 storage 载入合约状态时，有如下额外注释（`// SLOAD for gas optimization`）：

```solidity
function _modifyPosition(ModifyPositionParams memory params) {
  // ...

  Slot0 memory _slot0 = slot0; // SLOAD for gas optimization

  position = _updatePosition(
      params.owner,
      params.tickLower,
      params.tickUpper,
      params.liquidityDelta,
      _slot0.tick // 1
  );

  if (params.liquidityDelta != 0) {
      if (_slot0.tick < params.tickLower) { // 2
          // ...
      } else if (_slot0.tick < params.tickUpper) { // 3
          (slot0.observationIndex, slot0.observationCardinality) = observations.write( // 4
              _slot0.observationIndex,  // 5
              _blockTimestamp(),
              _slot0.tick, // 6
              liquidityBefore,
              _slot0.observationCardinality, // 7
              _slot0.observationCardinalityNext // 8
          );

          amount0 = SqrtPriceMath.getAmount0Delta(
              _slot0.sqrtPriceX96, // 9
              TickMath.getSqrtRatioAtTick(params.tickUpper),
              params.liquidityDelta
          );
          amount1 = SqrtPriceMath.getAmount1Delta(
              TickMath.getSqrtRatioAtTick(params.tickLower),
              _slot0.sqrtPriceX96, // 10
              params.liquidityDelta
          );
          // ...
      } else {
          // ...
      }
  }
}
```

从代码中可见，由于函数内有 10 处需要引用 `slot0` storage 变量内的字段。而访问 storage 变量（SLOAD）的成本是比访问 memory 变量（MLOAD）昂贵不少的。所以源码在函数最上方先使用一次 SLOAD 将变量 `slot0` 载入到内存中，以节省 Gas 开销。我们可以使用如下代码试验一下：

```solidity
contract TestSaveToMem {
  struct Slot {
    uint256 a;
    uint256 b;
  }

  Slot public slot;

  constructor() {
    slot = Slot({ a: 100, b: 200 });
  }

  function notSaveToMem() public returns (uint256 gasUsed) {
    uint256 startGas = gasleft();

    for (int i = 0; i < 10; i++) {
      readProp(slot.a);
      readProp(slot.b);
    }

    gasUsed = startGas - gasleft();
  }

  function saveToMem() public returns (uint256 gasUsed) {
    uint256 startGas = gasleft();

    Slot memory _slot = slot;
    for (int i = 0; i < 10; i++) {
      readProp(_slot.a);
      readProp(_slot.b);
    }

    gasUsed = startGas - gasleft();
  }

  function readProp(uint256 prop) private pure {
    require(prop > 0);
  }
}
```

测试结果为：

```txt
notSaveToMem gasUsed: 18989
    ✓ notSaveToMem
saveToMem gasUsed: 4736
    ✓ saveToMem
```

可见函数如果单纯同样次数读取 storage 内的变量，先存入 memory 的话，开销大约只有 1/4 左右。

## 可预知的合约地址

在源码创建代币交易对池的地方，我们可以看到：

```solidity
function deploy(
    address factory,
    address token0,
    address token1,
    uint24 fee,
    int24 tickSpacing
) internal returns (address pool) {
    // ...
    pool = address(new UniswapV3Pool{salt: keccak256(abi.encode(token0, token1, fee))}());
    // ...
}
```

代码在创建合约时，先将可预知的交易对池的元信息，通过 `abi.encode` 编码后，然后作为 `slat` 参数，在合约的创建中使用。在[官方文档](https://docs.soliditylang.org/en/latest/control-structures.html#salted-contract-creations-create2)的解释中，若合约的创建中，指定了 `salt` 参数，则会使用 `create2` 机制创建合约，即若指定的 `salt` 不变，则创建的合约地址不变，只需使用 `bytes1(0xff)`，工厂合约的地址，`salt`，合约代码的哈希以及初始化参数，就可还原。

官方的例子如下：

```solidity
contract D {
    uint public x;
    constructor(uint a) {
        x = a;
    }
}

contract C {
    function createDSalted(bytes32 salt, uint arg) public {
        address predictedAddress = address(uint160(uint(keccak256(abi.encodePacked(
            bytes1(0xff),
            address(this),
            salt,
            keccak256(abi.encodePacked(
                type(D).creationCode,
                arg
            ))
        )))));

        D d = new D{salt: salt}(arg);
        require(address(d) == predictedAddress);
    }
}
```

Uniswap 源码中，还原地址的逻辑也是类似的：

```solidity
function computeAddress(address factory, PoolKey memory key) internal pure returns (address pool) {
    require(key.token0 < key.token1);
    pool = address(
        uint256(
            keccak256(
                abi.encodePacked(
                    hex'ff',
                    factory,
                    keccak256(abi.encode(key.token0, key.token1, key.fee)),
                    POOL_INIT_CODE_HASH
                )
            )
        )
    );
}
```

如此一来，合约的地址就不需再上链进行抓取，一方面方便了部署，另一方也节省了存储与抓取的 Gas 开销。

## 不一致的 ERC20 接口定义

目前 ERC20 接口，对 transfer 等发送代币的函数的返回值定义会有[两种](https://medium.com/coinmonks/missing-return-value-bug-at-least-130-tokens-affected-d67bf08521ca)情况，一种为若发送失败，则会返回 `false` ，如 [openzeppelin](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#ERC20-transfer-address-uint256-) 就是这么定义的，还有一种为若发送失败，则直接在函数中进行 `revert()` ，函数没有返回值。面对这种同一函数，同样参数，不同返回值的情况，Uniswap V3 源码是这么处理的：

```solidity
function safeTransfer(
    address token,
    address to,
    uint256 value
) internal {
    (bool success, bytes memory data) =
        token.call(abi.encodeWithSelector(IERC20Minimal.transfer.selector, to, value));
    require(success && (data.length == 0 || abi.decode(data, (bool))), 'TF');
}
```

首先，由于 Solidity 的 [Function Selector](https://docs.soliditylang.org/en/latest/abi-spec.html#abi-function-selector) 定义中可知，Function Selector 是函数原型（prototype）哈希的前 4 字节，而函数原型是由函数名和它的所有参数类型决定的。所以 `abi.encodeWithSelector` 可以允许代码在未知函数返回类型的情况下，调用函数。在调用之后，代码通过第二个返回值 `data` 来判断返回布尔版本的 `transfer` 是否调用成功，第一个返回值 `bool success` 来判断 `revert()` 版本的调用成功（若调用成功就无返回值即 `data.length == 0`）与否。

## 预计算"白嫖"算力

由于在 Uniswap V3 中，同一种代币对的交换，可能同时存在许许多多不同价格区间的流动性池，所以，在查询当前给定的 A 代币能交换多少 B 代币（即代币的价格）时，并不能像 V2 那样，抓取一下两边代币在流动性池中的数量（仅需要调用一下 `view` 级别的函数），客户端利用核心公式 `x * y = (x + Δx) * (y − Δy) = k` 一推导，就能够知道。所以在 V3 中，只能像实际交换代币那样，从当前价格开始，一个个头寸池流过去，才能计算出最终可以得到的 B 代币数量。而在 V3 源码种，[交换代币函数](https://github.com/Uniswap/v3-core/blob/main/contracts/UniswapV3Pool.sol#L596)是一个接近 200 行的大函数，且会改变合约的状态，若用户刚想知道一下代币间的汇率，就要支付 Gas 费，也是不合理的。在这种情况下， Uniswap V3 利用了 solidity 中，`revert(string reason)` 函数可以终止当前函数调用，并向调用者退还剩余 Gas 费的机制，做了一个实现，首先我们看一下[交换代币函数](https://github.com/Uniswap/v3-core/blob/main/contracts/UniswapV3Pool.sol#L596)的具体代码：

```solidity
function swap(
      address recipient,
      bool zeroForOne,
      int256 amountSpecified,
      uint160 sqrtPriceLimitX96,
      bytes calldata data
) external override noDelegateCall returns (int256 amount0, int256 amount1) {
  // 计算出可交换出的另一种代币的数量
  // ...

  IUniswapV3SwapCallback(msg.sender).uniswapV3SwapCallback(amount0, amount1, data);

  // ...
}
```

我们可以看到，`swap` 函数会要求请求它的合约，自身实现一个 `IUniswapV3SwapCallback` 的接口。函数在计算出可交换出的另一种代币的数量后，在返回之前，会先调用一下请求合约自身实现的 `IUniswapV3SwapCallback(msg.sender).uniswapV3SwapCallback` 作为回调，并且最终可交换的 B 代币数会作为参数。而在抓取代币价格的合约 `Quoter` 中的具体实现为：

```solidity
function quoteExactInputSingle(
    address tokenIn,
    address tokenOut,
    uint24 fee,
    uint256 amountIn,
    uint160 sqrtPriceLimitX96
) public override returns (uint256 amountOut) {
  // ...

  // 调用 swap 时，使用 try-catch 捕获 revert 信息
  // 并从 parseRevertReason(reason) 中读取 reason 信息
  try
      getPool(tokenIn, tokenOut, fee).swap(
          // ...
      )
  {} catch (bytes memory reason) {
      return parseRevertReason(reason);
  }
}

/// @inheritdoc IUniswapV3SwapCallback
function uniswapV3SwapCallback(
    int256 amount0Delta,
    int256 amount1Delta,
    bytes memory path
) external view override {
    // ...
    // 将结果 amountReceived 存入 0x40 位置，然后作为 revert reason
    assembly {
        let ptr := mload(0x40)
        mstore(ptr, amountReceived)
        revert(ptr, 32)
    }
    // ...
}

function parseRevertReason(bytes memory reason) private pure returns (uint256) {
  // ...
  return abi.decode(reason, (uint256));
}
```

从代码中可见，首先使用了 `try-catch` 捕获 `revert` ，然后使用 `assembly` 读取 free memory pointer ，将汇率信息读出来。具体 `assembly` 的运用，可以参阅[这篇文档](https://medium.com/shyft-network-media/solidity-and-inline-assembly-37871dc582a6)。

所以说，虽然 `quoteExactInputSingle` 是 `public` 修饰的，但是其本质是一个 `view` 。

或许你还会问，虽然 `revert()` 函数的确能取消调用，并且退还 Gas 费，那也只是退还剩余部分，已被计算花销了的 Gas 并不会退还，那客户端不是还是要为了抓取一个汇率而付费吗？其实，在客户端（如 [ethers](https://www.npmjs.com/package/ethers)）中，会使用 `contract.callStatic.quoteExactInputSingle(…)` 的方式，让节点以“假装”不会有状态变化的方式来尝试调用一个 `public` 函数，来达到没有 Gas 花费而又抓取了汇率的效果。

正如 [ehters 的 callStatic 函数文档](https://docs.ethers.io/v5/api/contract/contract/#contract-callStatic) 中所描述的：

```js
// Rather than executing the state-change of a transaction, it is possible to ask a node to
// pretend that a call is not state-changing and return the result.

// This does not actually change any state, but is free. This in some cases can be used
// to determine if a transaction will fail or succeed.
contract.callStatic.METHOD_NAME( ...args [ , overrides ] ) ⇒ Promise< any >
```
