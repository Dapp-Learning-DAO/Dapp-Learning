use anyhow::Result;

use alloy::providers::ext::DebugApi;
use alloy::rpc::types::trace::geth::{
    GethDebugBuiltInTracerType, GethDebugTracerType, GethDebugTracingCallOptions,
    GethDebugTracingOptions, GethTrace,
};
use alloy::rpc::types::TransactionRequest;
use alloy::{eips::BlockId, providers::DynProvider};

pub async fn get_state_diff(
    provider: DynProvider,
    tx: TransactionRequest,
    block_number: BlockId,
) -> Result<GethTrace> {
    let trace = provider
        .debug_trace_call(
            tx,
            block_number,
            GethDebugTracingCallOptions {
                tracing_options: GethDebugTracingOptions {
                    tracer: Some(GethDebugTracerType::BuiltInTracer(
                        GethDebugBuiltInTracerType::PreStateTracer,
                    )),
                    timeout: None,
                    ..Default::default()
                },
                state_overrides: None,
                block_overrides: None,
            },
        )
        .await?;

    Ok(trace)
}
