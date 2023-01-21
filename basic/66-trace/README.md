
debug_traceCall是geth客户端提供的一个rpc，用于模拟执行一个交易，并给出详细的执行结果。

# 什么是evm traces
解决的问题：transactionReceipt无法看到内部细节。EVM traces可以提供精确到每一步的执行细节，包括：
- 什么数据被修改了？
- 出现了哪些外部调用？

应用：
- transaction tracers，例如etherscan
- debug交易
- 性能分析
- 其他分析，例如EIP-4337中bundler组件使用trace验证交易是否使用了非法字节码，非法存储，非法外部调用等


# 如何解读evm traces

# 如何获取evm traces

几个api。
trace_call：模拟执行一个交易，仅用于OpenEthereum和Erigon客户端
debug_traceCall：模拟执行一个交易，仅用于Geth。

gettracebyhash：



# 参考资料

[trace_call vs debug_tracecall](https://docs.alchemy.com/reference/trace_call-vs-debug_tracecall)
[EVM Traces](https://docs.alchemy.com/reference/what-are-evm-traces)
