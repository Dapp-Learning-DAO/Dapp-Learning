
# 前提知识
需要了解几个常用的rpc：
- eth_getTransactionReceipt：获取交易的执行结果，包括成功与否，gas开销，事件信息等。
- eth_call:执行一个合约函数。它不会生成交易，仅仅是单纯的调用，而且你可以设置from，to，当前块高等环境信息来执行查看执行的结果。


# 什么是evm traces
eth_getTransactionReceipt无法看到内部细节，包括内部产生了哪些内部的跨合约调用，内部修改了哪些状态等。而使用EVM的trace，则可以提供到精确到opcode级别的追踪信息。

# 应用
- transaction tracers：例如etherscan，它的internal transactions功能，就无法用getTransactionReceipt来做。
- debug交易：可以通过trace，追踪到报错的那个opcode，并且把相关的环境信息都提供出来。
- 存储分析：可以分析出哪些存储被使用了。例如EIP-4337中bundler组件，能检测出一个erc20合约是否使用了指定地址无关的存储。
- gas优化：可以追踪很详细的gas开销，从而找到优化瓶颈。
- ...

# API
目前市面上有两套api，姑且称为trace api和debug api。
- trace_api为OpenEthereum/Erigon提供的接口。
- debug_api为Geth提供的接口。
- 它们的功能相近。
- alchemy这样的服务，通常会支持两套接口，内部会进行路由处理。

这里面，debug族的api，有两个比较重要的：
- debug_traceCall：执行一个合约函数，但不生成交易。同时，根据传入的tracer，返回追踪结果。相当于给eth_call增加了trace功能。
- debug_traceTransaction：传入交易hash和tracer，该rpc会重放这个交易，并将执行结果返回。

在[目录](./demo/src/main.js)中，提供了这两个rpc的使用例子。下面例子中，使用debug_transaction，重放一笔交易，并且给出哪个地址的哪些存储槽位被使用了:

```
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_POINT);
    const tx = "0x867967c8a883daa070fdeafebc571b756bb60b45561962438026124bbd8920bf";
    const resp = await provider.send("debug_traceTransaction",[
        tx,
        {tracer: "prestateTracer"}
    ])
    console.log(resp);
```

# 支持debug接口的节点
目前市面上，像alchemy，chainstack这些平台提供的接入节点，并不会开放trace接口，如果想使用trace功能，收费相当昂贵。大家也可以去以太坊网络上找寻各个全节点碰碰运气，找到免费且开放的debug rpc节点。

# tracer
根据tracer的类型，可以分为两种：内置tracer和自定义tracer。

内置tracer，比较常见的包括：
- callTracer：获取调用树，它们会追踪call，create等指令。
- prestateTracer：获取被修改的内存。

自定义tracer用于提供自定义的trace逻辑。用户既可以用go开发，也可以用javascript开发。

以用javascript开发为例，需要实现如下几个比较重要的接口：
- step：每一个opcode的执行时被触发
- result：返回trace的结果
- enter：进入call、create、selfdestruct
- exit：离开call、create、selfdestruct
- fault：opcode报错时被触发

这些接口还有对应的参数，包括了当前执行的环境，还有提供访问账户信息的能力。其中比较重要的参数：
- log:包括执行环境。
    - log.op: 当前的opcode
    - log.contract：当前的contract
    - log.memory：当前的内存
    - log.slack：当前的栈
- db:用于获取状态数据。
    - getBalance(address): 获取余额
    - getNonce(address)：获取账户nonce值
    - ...

具体的定义可以参考[Custom Tracers](https://geth.ethereum.org/docs/developers/evm-tracing/custom-tracer)。

实现后，需要把tracer的代码文本塞入到debugXXX api中的tracer字段，传入到以太坊节点，

在[示例](./demo/src/my_tracer.js)中，实现了一个简单的tracer，它追踪sstore指令的调用次数，并在[目录](./demo/src/main.js)的traceTransactionCustomTx函数被接入。


# 参考资料
- [EVM Traces Introduction](https://docs.alchemy.com/reference/what-are-evm-traces)
- [Trace_call vs Debug_tracecall](https://docs.alchemy.com/reference/trace_call-vs-debug_tracecall)
- [Built-in Tracers](https://geth.ethereum.org/docs/developers/evm-tracing/built-in-tracers)
- [Custom Tracers](https://geth.ethereum.org/docs/developers/evm-tracing/custom-tracer)
- [Geth Js Tracers](https://github.com/ethereum/go-ethereum/tree/master/eth/tracers/js/internal/tracers)
