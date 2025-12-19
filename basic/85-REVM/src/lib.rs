// REVM library module definitions and type aliases

use alloy::{network::Ethereum, providers::DynProvider};
use revm::{
    context::{BlockEnv, CfgEnv, TxEnv},
    database::{AlloyDB, CacheDB, InMemoryDB},
    database_interface::WrapDatabaseAsync,
    MainnetEvm,
};

// Module exports
pub mod constants;
pub mod eth_call_examples;
pub mod revm_examples;
pub mod tokens;
pub mod trace;
pub mod utils;

// Type aliases for common EVM configurations
/// Cached database with Alloy provider for efficient state management
pub type AlloyCacheDB = CacheDB<WrapDatabaseAsync<AlloyDB<Ethereum, DynProvider>>>;
/// In-memory database for fast testing and simulation
pub type AlloyEvm = InMemoryDB;
/// Main EVM instance with Alloy database integration
pub type NewEvm = MainnetEvm<revm::Context<BlockEnv, TxEnv, CfgEnv, AlloyCacheDB>, ()>;
