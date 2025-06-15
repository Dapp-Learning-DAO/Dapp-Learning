use anyhow::Result;
use ethers::prelude::*;
use ethers_providers::Middleware;
use std::sync::Arc;

pub async fn get_state_diff<M: Middleware + 'static>(
    provider: Arc<M>,
    tx: Eip1559TransactionRequest,
    block_number: U64,
) -> Result<GethTrace> {
    let trace = provider
        .debug_trace_call(
            tx,
            Some(block_number.into()),
            GethDebugTracingCallOptions {
                tracing_options: GethDebugTracingOptions {
                    disable_storage: None,
                    disable_stack: None,
                    enable_memory: None,
                    enable_return_data: None,
                    tracer: Some(GethDebugTracerType::BuiltInTracer(
                        GethDebugBuiltInTracerType::PreStateTracer,
                    )),
                    tracer_config: None,
                    timeout: None,
                },
                state_overrides: None,
                block_overrides: None,
            },
        )
        .await?;

    Ok(trace)
}