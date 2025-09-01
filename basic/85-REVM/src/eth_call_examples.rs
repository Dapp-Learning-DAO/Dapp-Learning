use anyhow::{anyhow, Result};
use ethers::types::H160;
use log::info;
use revm::context::ContextTr;
use revm::Database;
use std::{str::FromStr, sync::Arc};

use alloy::rpc::types::{TransactionInput, TransactionRequest};
use alloy::{
    eips::BlockId,
    network::{Ethereum, TransactionBuilder},
    providers::{ext::AnvilApi, DynProvider, Provider, ProviderBuilder},
    sol,
    sol_types::{SolCall, SolStruct, SolValue},
};

use crate::constants::SIMULATOR_CODE;
use crate::{AlloyCacheDB, NewEvm};
use revm::{
    bytecode::Bytecode,
    context::{result::ExecutionResult, tx::TxEnvBuilder, BlockEnv, CfgEnv, Evm, TxEnv},
    primitives::{address, keccak256, Address, Bytes, Log, TxKind, U128, U256},
    state::AccountInfo,
    ExecuteEvm, MainContext, MainnetEvm,
};

use std::ops::DerefMut;

sol! {
  function v2SimulateSwap(
      uint256 amountIn,
      address pair,
      address tokenIn,
      address tokenOut
  ) external returns (uint256 amountOut, uint256 gasUsed);
}

pub async fn eth_call_v2_simulate_swap(
    evm: &mut NewEvm,
    provider: DynProvider,
    account: H160,
    target_pair: H160,
    input_token: H160,
    output_token: H160,
    input_balance_slot: i32,
) -> Result<(U256, U256)> {
    // Shows how you can spoof multiple storage slots
    // but also shows that you can only test one transaction at a time
    let block = provider
        .get_block(BlockId::latest())
        .await?
        .ok_or(anyhow!("failed to retrieve block"))?;

    let ten_eth = U256::from(10)
        .checked_mul(U256::from(10).pow(U256::from(18)))
        .unwrap();

    // Spoof user balance with 10 ETH (for gas fees)
    // let mut state = spoof::state();
    // let mut state = evm.ctx.journaled_state;
    // state
    //     .account(Address::from_slice(&account.0))
    //     .balance(ten_eth)
    //     .nonce(0.into());
    // let evm_account = evm
    //     .ctx
    //     .journaled_state
    //     .account(Address::from_slice(&account.0));
    // evm_account.info.balance = ten_eth;

    let db = &mut evm.ctx.journal_mut().database;
    let mut call_account = (*db)
        .basic(Address::from_slice(&account.0))
        .unwrap()
        .unwrap();
    call_account.set_balance(ten_eth);
    db.insert_account_info(Address::from_slice(&account.0), call_account);

    // provider
    //     .anvil_set_balance(Address::from_slice(&account.0), ten_eth)
    //     .await?;
    // .database
    // .insert_account_info(Address::from_slice(&account.0), user_acc_info);

    // Create Simulator contract with bytecode injection
    let simulator_address = H160::from_str("0xF2d01Ee818509a9540d8324a5bA52329af27D19E").unwrap();
    let code_hash = keccak256("");
    let info = AccountInfo {
        balance: U256::from(input_balance_slot),
        nonce: 1, // nonzero nonce so EOA vs contract heuristics are fine
        code_hash,
        code: Some(Bytecode::new_raw((*SIMULATOR_CODE).clone())),
    };
    db.insert_account_info(Address::from_slice(&simulator_address.0), info);

    // state
    //     .account(simulator_address)
    //     .code((*SIMULATOR_CODE).clone());

    // Spoof simulator input token balance
    let input_balance_slot = keccak256(SolValue::abi_encode(&[
        Address::from_slice(&simulator_address.0),
        Address::from_slice(&H160::from_low_u64_be(input_balance_slot as u64).0), // H160::from_low_u64_be(input_balance_slot as u64),
    ]));

    db.insert_account_storage(
        Address::from_slice(&input_token.0),
        input_balance_slot.into(),
        ten_eth,
    )?;

    // state.account(input_token).store(
    //     input_balance_slot.into(),
    //     H256::from_low_u64_be(ten_eth.as_u64()),
    // );

    let one_eth = ten_eth.checked_div(U256::from(10)).unwrap();
    // let simulator_abi = BaseContract::from(
    //     parse_abi(&[
    //         "function v2SimulateSwap(uint256,address,address,address) external returns (uint256, uint256)",
    //     ])?
    // );
    // let calldata = simulator_abi.encode(
    //     "v2SimulateSwap",
    //     (one_eth, target_pair, input_token, output_token),
    // )?;

    let calldata = v2SimulateSwapCall {
        amountIn: one_eth,
        pair: Address::from_slice(&target_pair.0),
        tokenIn: Address::from_slice(&input_token.0),
        tokenOut: Address::from_slice(&output_token.0),
    };

    // info!("calldata: {:?}", calldata.abi_encode().into());
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

    // tx.set_chain_id(1.into());

    // let tx = TxEnv {
    //   caller: Address::from_slice(&account.0),
    //   gas_limit: 5_000_000,
    //   gas_price,
    //   gas_priority_fee: None,
    //   transact_to: Address::from_slice(&simulator_address.0),
    //   value: U256::ZERO,
    //   data: calldata,
    //   chain_id: None,    // 可选: 有需要可以填 Some(chain_id.into())
    //   nonce: Some(0),    // REVM 支持 Option<u64>
    //   ..Default::default()
    // }

    // let result = provider.call(&tx).block(block.number().into()).await?;
    // let out: (U256, U256) = simulator_abi.decode_output("v2SimulateSwap", result)?;
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
