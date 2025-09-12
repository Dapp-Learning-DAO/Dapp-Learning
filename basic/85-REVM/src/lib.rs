use alloy::{network::Ethereum, providers::DynProvider};
use revm::{
    context::{BlockEnv, CfgEnv, TxEnv},
    database::{AlloyDB, CacheDB, InMemoryDB},
    database_interface::WrapDatabaseAsync,
    MainnetEvm,
};

pub mod constants;
pub mod eth_call_examples;
pub mod revm_examples;
pub mod tokens;
pub mod trace;
pub mod utils;

pub type AlloyCacheDB = CacheDB<WrapDatabaseAsync<AlloyDB<Ethereum, DynProvider>>>;
pub type AlloyEvm = InMemoryDB;
pub type NewEvm = MainnetEvm<revm::Context<BlockEnv, TxEnv, CfgEnv, AlloyCacheDB>, ()>;
