use revm::{
  bytecode::Bytecode,
  context::{BlockEnv, CfgEnv, Evm, TxEnv},
  context_interface::result::{ExecutionResult, Output},
  database::{AlloyDB, CacheDB, EmptyDB, InMemoryDB},
  database_interface::WrapDatabaseAsync,
  primitives::{keccak256, Address, Bytes as rBytes, Log, TxKind, U256 as rU256},
  state::AccountInfo,
  Context, Database, ExecuteCommitEvm, ExecuteEvm, MainBuilder, MainContext, MainnetEvm,
};
use alloy::{
  eips::BlockId,
  network::Ethereum,
  providers::{DynProvider, Provider, ProviderBuilder},
};

pub mod revm_examples;
pub mod constants;
pub mod utils;
pub mod trace;
pub mod tokens;
// pub mod foundry_examples; 
pub mod eth_call_examples;

pub type AlloyCacheDB = CacheDB<WrapDatabaseAsync<AlloyDB<Ethereum, DynProvider>>>;
pub type AlloyEvm = InMemoryDB;
pub type NewEvm = MainnetEvm<revm::Context<BlockEnv, TxEnv, CfgEnv, AlloyCacheDB>, ()>;