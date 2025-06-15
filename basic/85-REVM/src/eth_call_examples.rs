use anyhow::{anyhow, Result};
use ethers::{
    abi::{self, parse_abi},
    core::utils::keccak256,
    prelude::*,
    providers::{call_raw::RawCall, Provider, Ws},
    types::{spoof, TransactionRequest, H160, U256},
};
use log::info;
use std::{str::FromStr, sync::Arc};

use crate::constants::SIMULATOR_CODE;

pub async fn eth_call_v2_simulate_swap(
    provider: Arc<Provider<Ws>>,
    account: H160,
    target_pair: H160,
    input_token: H160,
    output_token: H160,
    input_balance_slot: i32,
) -> Result<(U256, U256)> {
    // Shows how you can spoof multiple storage slots
    // but also shows that you can only test one transaction at a time
    let block = provider
        .get_block(BlockNumber::Latest)
        .await?
        .ok_or(anyhow!("failed to retrieve block"))?;

    let ten_eth = U256::from(10)
        .checked_mul(U256::from(10).pow(U256::from(18)))
        .unwrap();

    // Spoof user balance with 10 ETH (for gas fees)
    let mut state = spoof::state();
    state.account(account).balance(ten_eth).nonce(0.into());

    // Create Simulator contract with bytecode injection
    let simulator_address = H160::from_str("0xF2d01Ee818509a9540d8324a5bA52329af27D19E").unwrap();
    state
        .account(simulator_address)
        .code((*SIMULATOR_CODE).clone());

    // Spoof simulator input token balance
    let input_balance_slot = keccak256(&abi::encode(&[
        abi::Token::Address(simulator_address),
        abi::Token::Uint(U256::from(input_balance_slot)),
    ]));
    state.account(input_token).store(
        input_balance_slot.into(),
        H256::from_low_u64_be(ten_eth.as_u64()),
    );

    let one_eth = ten_eth.checked_div(U256::from(10)).unwrap();
    let simulator_abi = BaseContract::from(
        parse_abi(&[
            "function v2SimulateSwap(uint256,address,address,address) external returns (uint256, uint256)",
        ])?
    );
    let calldata = simulator_abi.encode(
        "v2SimulateSwap",
        (one_eth, target_pair, input_token, output_token),
    )?;

    let gas_price = U256::from(100)
        .checked_mul(U256::from(10).pow(U256::from(9)))
        .unwrap();
    let tx = TransactionRequest::default()
        .from(account)
        .to(simulator_address)
        .value(U256::zero())
        .data(calldata.0)
        .nonce(U256::zero())
        .gas(5000000)
        .gas_price(gas_price)
        .chain_id(1)
        .into();
    let result = provider
        .call_raw(&tx)
        .state(&state)
        .block(block.number.unwrap().into())
        .await?;
    let out: (U256, U256) = simulator_abi.decode_output("v2SimulateSwap", result)?;
    info!("v2SimulateSwap eth_call result: {:?}", out);

    Ok(out)
}