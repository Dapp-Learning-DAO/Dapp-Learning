// ETH call examples demonstrating direct contract interaction with REVM

use anyhow::{anyhow, Result};
use ethers::types::H160;
use log::info;
use revm::context::ContextTr;
use revm::Database;
use std::str::FromStr;

use alloy::{
    providers::{DynProvider},
    sol,
    sol_types::{SolCall, SolValue},
};

use crate::constants::SIMULATOR_CODE;
use crate::NewEvm;
use revm::{
    bytecode::Bytecode,
    context::{result::ExecutionResult, tx::TxEnvBuilder},
    primitives::{keccak256, Address, U128, U256},
    state::AccountInfo,
    ExecuteEvm,
};

// Solidity interface for Uniswap V2 swap simulation
sol! {
  function v2SimulateSwap(
      uint256 amountIn,
      address pair,
      address tokenIn,
      address tokenOut
  ) external returns (uint256 amountOut, uint256 gasUsed);
}

/// Simulate Uniswap V2 swap using direct eth_call with state spoofing
/// Demonstrates how to inject custom state for testing specific scenarios
pub async fn eth_call_v2_simulate_swap(
    evm: &mut NewEvm,
    _provider: DynProvider,
    account: H160,
    target_pair: H160,
    input_token: H160,
    output_token: H160,
    input_balance_slot: i32,
) -> Result<(U256, U256)> {
    // Demonstrates state spoofing for testing specific scenarios
    // Note: Only one transaction can be tested at a time with this approach
    let ten_eth = U256::from(10)
        .checked_mul(U256::from(10).pow(U256::from(18)))
        .unwrap();

    // Spoof user balance with 10 ETH for gas fees
    let db = &mut evm.ctx.journal_mut().database;
    let mut call_account = (*db)
        .basic(Address::from_slice(&account.0))
        .unwrap()
        .unwrap();
    call_account.set_balance(ten_eth);
    db.insert_account_info(Address::from_slice(&account.0), call_account);

    // Deploy Simulator contract with bytecode injection
    let simulator_address = H160::from_str("0xF2d01Ee818509a9540d8324a5bA52329af27D19E").unwrap();
    let code_hash = keccak256("");
    let info = AccountInfo {
        balance: U256::from(input_balance_slot),
        nonce: 1, // Nonzero nonce to distinguish EOA from contract
        code_hash,
        code: Some(Bytecode::new_raw((*SIMULATOR_CODE).clone())),
    };
    db.insert_account_info(Address::from_slice(&simulator_address.0), info);

    // Spoof simulator input token balance using storage slot calculation
    let input_balance_slot = keccak256(SolValue::abi_encode(&[
        Address::from_slice(&simulator_address.0),
        Address::from_slice(&H160::from_low_u64_be(input_balance_slot as u64).0),
    ]));

    db.insert_account_storage(
        Address::from_slice(&input_token.0),
        input_balance_slot.into(),
        ten_eth,
    )?;

    let one_eth = ten_eth.checked_div(U256::from(10)).unwrap();

    let calldata = v2SimulateSwapCall {
        amountIn: one_eth,
        pair: Address::from_slice(&target_pair.0),
        tokenIn: Address::from_slice(&input_token.0),
        tokenOut: Address::from_slice(&output_token.0),
    };

    info!("target_pair: {:?}", Address::from_slice(&target_pair.0));
    info!("input_token: {:?}", Address::from_slice(&input_token.0));
    info!("output_token: {:?}", Address::from_slice(&output_token.0));

    let gas_price = U128::from(100)
        .checked_mul(U128::from(10).pow(U128::from(9)))
        .unwrap()
        .to();

    let tx = TxEnvBuilder::default()
        .caller(Address::from_slice(&account.0))
        .to(Address::from_slice(&simulator_address.0))
        .value(U256::ZERO)
        .data(calldata.abi_encode().into())
        .nonce(0)
        .gas_limit(1000000)
        .gas_price(gas_price)
        .chain_id(1.into())
        .build()
        .unwrap();

    let result = evm.transact(tx).unwrap();
    let output = match &result.result {
        ExecutionResult::Success { output, .. } => output,
        ExecutionResult::Revert { output, .. } => {
            info!("Transaction reverted with output: {:?}", output);
            return Err(anyhow!("Transaction reverted"));
        }
        _ => return Err(anyhow!("Transaction failed")),
    };

    // Decode the output using the generated sol! macro
    let decoded = v2SimulateSwapCall::abi_decode_returns(output.data())?;
    let out: (U256, U256) = (decoded.amountOut, decoded.gasUsed);

    info!("v2SimulateSwap eth_call result: {:?}", out);

    Ok(out)
}
