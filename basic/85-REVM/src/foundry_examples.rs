use anyhow::{anyhow, Result};
use ethers::{
    abi::{self, parse_abi},
    prelude::*,
    providers::Middleware,
    types::{BlockNumber, H160, U256},
};
use foundry::{
    executor::{
        fork::{BlockchainDb, BlockchainDbMeta, SharedBackend},
        Bytecode, TransactTo, TxEnv,
    },
    revm::{
        db::CacheDB,
        primitives::{keccak256, AccountInfo, U256 as rU256},
        EVM,
    },
};
use log::info;
use std::{collections::BTreeSet, str::FromStr, sync::Arc};

use crate::constants::SIMULATOR_CODE;
use crate::revm_examples::get_tx_result;

pub async fn foundry_v2_simulate_swap<M: Middleware + 'static>(
    provider: Arc<M>,
    account: H160,
    target_pair: H160,
    input_token: H160,
    output_token: H160,
    input_balance_slot: i32,
) -> Result<(U256, U256)> {
  let block = provider
  .get_block(BlockNumber::Latest)
  .await?
  .ok_or(anyhow!("failed to retrieve block"))?;

let shared_backend = SharedBackend::spawn_backend_thread(
  provider.clone(),
  BlockchainDb::new(
      BlockchainDbMeta {
          cfg_env: Default::default(),
          block_env: Default::default(),
          hosts: BTreeSet::from(["".to_string()]),
      },
      None,
  ),
  Some(block.number.unwrap().into()),
);
let db = CacheDB::new(shared_backend);

let mut evm = EVM::new();
evm.database(db);

evm.env.cfg.limit_contract_code_size = Some(0x100000);
evm.env.cfg.disable_block_gas_limit = true;
evm.env.cfg.disable_base_fee = true;

evm.env.block.number = rU256::from(block.number.unwrap().as_u64() + 1);

let fork_db = evm.db.as_mut().unwrap();

let ten_eth = rU256::from(10)
  .checked_mul(rU256::from(10).pow(rU256::from(18)))
  .unwrap();

// Set user: give the user enough ETH to pay for gas
let user_acc_info = AccountInfo::new(ten_eth, 0, Bytecode::default());
fork_db.insert_account_info(account.into(), user_acc_info);

// Deploy Simulator contract
let simulator_address = H160::from_str("0xF2d01Ee818509a9540d8324a5bA52329af27D19E").unwrap();
let simulator_acc_info = AccountInfo::new(
  rU256::ZERO,
  0,
  Bytecode::new_raw((*SIMULATOR_CODE.0).into()),
);
fork_db.insert_account_info(simulator_address.into(), simulator_acc_info);

let balance_slot = keccak256(&abi::encode(&[
  abi::Token::Address(simulator_address.into()),
  abi::Token::Uint(U256::from(input_balance_slot)),
]));
fork_db.insert_account_storage(input_token.into(), balance_slot.into(), ten_eth)?;

// run v2SimulateSwap
let amount_in = U256::from(1)
  .checked_mul(U256::from(10).pow(U256::from(18)))
  .unwrap();
let simulator_abi = BaseContract::from(
  parse_abi(&[
      "function v2SimulateSwap(uint256,address,address,address) external returns (uint256, uint256)",
  ])?
);
let calldata = simulator_abi.encode(
  "v2SimulateSwap",
  (amount_in, target_pair, input_token, output_token),
)?;

let gas_price = rU256::from(100)
  .checked_mul(rU256::from(10).pow(rU256::from(9)))
  .unwrap();
let v2_simulate_swap_tx = TxEnv {
  caller: account.into(),
  gas_limit: 5000000,
  gas_price: gas_price,
  gas_priority_fee: None,
  transact_to: TransactTo::Call(simulator_address.into()),
  value: rU256::ZERO,
  data: calldata.0,
  chain_id: None,
  nonce: None,
  access_list: Default::default(),
};
evm.env.tx = v2_simulate_swap_tx;

let result = match evm.transact_commit() {
  Ok(result) => result,
  Err(e) => return Err(anyhow!("EVM call failed: {:?}", e)),
};
let result = get_tx_result(result)?;
let out: (U256, U256) = simulator_abi.decode_output("v2SimulateSwap", result.output)?;
info!("Amount out: {:?}", out);

Ok(out)
}