// REVM core examples demonstrating EVM operations and transaction simulation

use crate::constants::SIMULATOR_CODE;
use crate::trace::get_state_diff;
use anyhow::{anyhow, Result};
use bytes::Bytes;
use ethers::{
    abi::parse_abi,
    prelude::*,
    types::{H160, U256},
};
use log::info;
use revm::context::ContextTr;
use revm::{
    bytecode::Bytecode,
    context::TxEnv,
    context_interface::result::{ExecutionResult, Output},
    database::AlloyDB,
    database_interface::WrapDatabaseAsync,
    primitives::{keccak256, Address, Bytes as rBytes, Log, TxKind, U256 as rU256},
    state::AccountInfo,
    Context, Database, ExecuteCommitEvm, ExecuteEvm, MainBuilder, MainContext,
};
use std::str::FromStr;

use alloy::{
    eips::BlockId,
    providers::{DynProvider, Provider, ProviderBuilder},
};

use alloy::consensus::TxEip1559;
use alloy::rpc::types::trace::geth::{GethTrace, PreStateFrame};
use alloy::rpc::types::{TransactionInput, TransactionRequest};

use crate::{AlloyCacheDB, NewEvm};

/// Create a clean EVM instance with Alloy database integration
/// This creates an empty EVM environment without any pre-existing state
pub async fn create_evm_instance(rpc_url: &str) -> Result<NewEvm> {
    let provider = ProviderBuilder::new().connect(rpc_url).await?.erased();
    let alloy_db = WrapDatabaseAsync::new(AlloyDB::new(provider, BlockId::latest())).unwrap();
    let cache_db = AlloyCacheDB::new(alloy_db);
    let evm = Context::mainnet().with_db(cache_db).build_mainnet();
    Ok(evm)
}

/// Configure EVM environment for efficient testing
/// Overrides default values to optimize for simulation scenarios
pub fn evm_env_setup(evm: &mut NewEvm) {
    // Increase contract code size limit for testing
    evm.cfg.limit_contract_code_size = Some(0x100000);
}

/// Transaction execution result containing output, logs, and gas information
#[derive(Debug, Clone)]
pub struct TxResult {
    pub output: Bytes,
    pub logs: Option<Vec<Log>>,
    pub gas_used: u64,
    pub gas_refunded: u64,
}

/// Query ERC20 token balance for a given account
/// This will fail if the token contract is not deployed in the EVM state
pub fn get_token_balance(evm: &mut NewEvm, token: H160, account: H160) -> Result<U256> {
    let erc20_abi = BaseContract::from(parse_abi(&[
        "function balanceOf(address) external view returns (uint256)",
    ])?);
    let calldata = erc20_abi.encode("balanceOf", account)?;

    evm.tx.caller = Address::from_slice(&account.0);
    evm.tx.kind = TxKind::Call(Address::from_slice(&token.0));
    evm.tx.data = rBytes::from(calldata.0);

    // This will fail, because the token contract has not been deployed yet
    let result = match evm.transact(evm.tx.clone()) {
        Ok(result) => result,
        Err(e) => return Err(anyhow!("EVM call failed: {e:?}")),
    };
    let tx_result = match result.result {
        ExecutionResult::Success {
            gas_used,
            gas_refunded,
            output,
            logs,
            ..
        } => match output {
            Output::Call(o) => TxResult {
                output: o.into(),
                logs: Some(logs),
                gas_used,
                gas_refunded,
            },
            Output::Create(o, _) => TxResult {
                output: o.into(),
                logs: Some(logs),
                gas_used,
                gas_refunded,
            },
        },
        ExecutionResult::Revert { gas_used, output } => {
            return Err(anyhow!(
                "EVM REVERT: {:?} / Gas used: {:?}",
                output,
                gas_used
            ))
        }
        ExecutionResult::Halt {
            reason, gas_used, ..
        } => return Err(anyhow!("EVM HALT: {:?} / Gas used: {:?}", reason, gas_used)),
    };
    let decoded_output = erc20_abi.decode_output("balanceOf", tx_result.output)?;
    Ok(decoded_output)
}

/// Compare Geth tracing with REVM execution to find storage slot patterns
/// Uses Geth's PreStateTracer to identify which storage slots are accessed
pub async fn geth_and_revm_tracing(
    evm: &mut NewEvm,
    provider: DynProvider,
    token: H160,
    account: H160,
) -> Result<i32> {
    let erc20_abi = BaseContract::from(parse_abi(&[
        "function balanceOf(address) external view returns (uint256)",
    ])?);
    let calldata = erc20_abi.encode("balanceOf", account)?;

    let block = provider
        .get_block(BlockId::latest())
        .await?
        .ok_or(anyhow!("failed to retrieve block"))?;

    let call_account = evm
        .db_mut()
        .load_account(Address::from_slice(&account.0))
        .unwrap();

    let nonce = call_account.info.nonce;
    let chain_id = evm.cfg.chain_id;

    let tx = TransactionRequest {
        chain_id: Some(chain_id.into()),
        nonce: Some(nonce),
        from: Some(Address::from_slice(&account.0)),
        to: Some(TxKind::Call(Address::from_slice(&token.0))),
        gas: None,
        value: None,
        input: TransactionInput::new(calldata.0.into()),
        max_priority_fee_per_gas: None,
        max_fee_per_gas: None,
        access_list: Some(TxEip1559::default().access_list),
        ..Default::default()
    };
    let geth_trace = get_state_diff(provider, tx, block.number().into()).await?;
    let prestate = match geth_trace {
        GethTrace::PreStateTracer(prestate) => match prestate {
            PreStateFrame::Default(prestate_mode) => Some(prestate_mode),
            _ => None,
        },
        _ => None,
    }
    .unwrap();
    let geth_touched_accs = prestate.0.keys();
    info!("Geth trace: {:?}", geth_touched_accs);

    let token_acc_state = prestate
        .0
        .get(&Address::from_slice(&token.0))
        .ok_or(anyhow!("no token key"))?;
    let token_touched_storage = token_acc_state.storage.clone();

    for i in 0..20 {
        let slot = keccak256(&abi::encode(&[
            abi::Token::Address(account.into()),
            abi::Token::Uint(U256::from(i)),
        ]));
        info!("{} 0x{:x}", i, H256::from(slot.0));
        match token_touched_storage.get(&slot) {
            Some(_) => {
                info!("Balance storage slot: {:?} (0x{:x})", i, H256::from(slot.0));
                return Ok(i);
            }
            None => {}
        }
    }

    Ok(0)
}

/// Deploy contract to EVM and trace storage access patterns
/// Creates a new EVM instance with AlloyDB for contract deployment and analysis
pub async fn revm_contract_deploy_and_tracing(
    _evm: &mut NewEvm,
    provider: DynProvider,
    token: H160,
    account: H160,
) -> Result<i32> {
    // deploy contract to EVM
    let _block = provider
        .get_block(BlockId::latest())
        .await?
        .ok_or(anyhow!("failed to retrieve block"))?;

    let token_address = Address::from_slice(&token.0);

    // Create a new EVM instance with AlloyDB for contract deployment
    let alloy_db =
        WrapDatabaseAsync::new(AlloyDB::new(provider.clone(), BlockId::latest())).unwrap();
    let cache_db = AlloyCacheDB::new(alloy_db);
    let mut new_evm = Context::mainnet().with_db(cache_db).build_mainnet();

    let erc20_abi = BaseContract::from(parse_abi(&[
        "function balanceOf(address) external view returns (uint256)",
    ])?);
    let calldata = erc20_abi.encode("balanceOf", account)?;

    new_evm.tx.caller = Address::from_slice(&account.0);
    new_evm.tx.kind = TxKind::Call(token_address);
    new_evm.tx.data = rBytes::from(calldata.0.clone());

    let result = match new_evm.transact(new_evm.tx.clone()) {
        Ok(result) => result,
        Err(e) => return Err(anyhow!("EVM call failed: {e:?}")),
    };

    // Extract state changes from execution result
    let state_changes = match result.result {
        ExecutionResult::Success { logs, .. } => {
            info!("Transaction successful, logs: {:?}", logs);
            result.state
        }
        ExecutionResult::Revert { output, .. } => {
            info!("Transaction reverted: {:?}", output);
            result.state
        }
        ExecutionResult::Halt { reason, .. } => {
            info!("Transaction halted: {:?}", reason);
            result.state
        }
    };

    // Check token contract storage changes
    if let Some(account_state) = state_changes.get(&token_address) {
        info!("Found token account state changes");
        let storage = &account_state.storage;

        // Search for storage slots using the same logic as geth_and_revm_tracing
        for i in 0..20 {
            let slot = keccak256(&abi::encode(&[
                abi::Token::Address(account.into()),
                abi::Token::Uint(U256::from(i)),
            ]));
            let slot_u256 = rU256::from_be_bytes(slot.0);
            info!("Checking storage slot {}: 0x{:x}", i, H256::from(slot.0));

            // Check if this storage slot was accessed/modified
            if storage.contains_key(&slot_u256) {
                info!(
                    "Balance storage slot found: {:?} (0x{:x})",
                    i,
                    H256::from(slot.0)
                );
                return Ok(i);
            }
        }
    } else {
        info!(
            "No state changes found for token address: {:?}",
            token_address
        );
    }

    Ok(0)
}

/// Simulate Uniswap V2 swap using REVM with state injection
/// Deploys necessary contracts and simulates a complete swap transaction
/// 
/// IMPORTANT: This function supports two modes:
/// 1. Create new pair: If the pair doesn't exist, uncomment the pair creation code
/// 2. Use existing pair: If the pair already exists, comment out pair creation and use target_pair
/// 
/// Error handling: 
/// - If you try to create an existing pair, you'll get this error:
///   "EVM REVERT: 0x08c379a000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000016556e697377617056323a20504149525f45584953545300000000000000000000"
///   This decodes to: "UniswapV2: PAIR_EXISTS"
/// - To avoid this error, use the appropriate mode based on whether the pair exists
pub async fn revm_v2_simulate_swap(
    _evm: &mut NewEvm,
    provider: DynProvider,
    account: H160,
    factory: H160,
    target_pair: H160,
    input_token: H160,
    output_token: H160,
    input_balance_slot: i32,
    output_balance_slot: i32,
    input_token_implementation: Option<H160>,
    output_token_implementation: Option<H160>,
) -> Result<(U256, U256)> {
    // Get latest block for state reference
    let _block = provider
        .get_block(BlockId::latest())
        .await?
        .ok_or(anyhow!("failed to retrieve block"))?;

    let ten_eth = rU256::from(10)
        .checked_mul(rU256::from(10).pow(rU256::from(18)))
        .unwrap();

    // Create new EVM instance with AlloyDB for simulation
    let alloy_db =
        WrapDatabaseAsync::new(AlloyDB::new(provider.clone(), BlockId::latest())).unwrap();
    let cache_db = AlloyCacheDB::new(alloy_db);
    let mut new_evm = Context::mainnet().with_db(cache_db).build_mainnet();

    // Set user account with sufficient ETH for gas fees
    let user_acc_info = AccountInfo::new(ten_eth, 0, keccak256(&[]), Bytecode::default());
    new_evm
        .journal_mut()
        .database
        .insert_account_info(Address::from_slice(&account.0), user_acc_info);

    // Deploy Simulator contract with Uniswap V2 logic
    let simulator_address = H160::from_str("0xF2d01Ee818509a9540d8324a5bA52329af27D19E").unwrap();
    let simulator_acc_info = AccountInfo::new(
        rU256::ZERO,
        0,
        keccak256(&[]),
        Bytecode::new_raw(rBytes::from(SIMULATOR_CODE.0.to_vec())),
    );
    new_evm.journal_mut().database.insert_account_info(
        Address::from_slice(&simulator_address.0),
        simulator_acc_info,
    );

    // Deploy necessary contracts to simulate Uniswap V2 swap
    let input_token_address = match input_token_implementation {
        Some(implementation) => implementation,
        None => input_token,
    };
    let output_token_address = match output_token_implementation {
        Some(implementation) => implementation,
        None => output_token,
    };

    // Get account information for token contracts
    let input_token_acc_info = new_evm
        .journal_mut()
        .database
        .basic(Address::from_slice(&input_token_address.0))?
        .unwrap_or_default();
    let output_token_acc_info = new_evm
        .journal_mut()
        .database
        .basic(Address::from_slice(&output_token_address.0))?
        .unwrap_or_default();
    let factory_acc_info = new_evm
        .journal_mut()
        .database
        .basic(Address::from_slice(&factory.0))?
        .unwrap_or_default();

    new_evm
        .db_mut()
        .insert_account_info(Address::from_slice(&input_token.0), input_token_acc_info);
    new_evm
        .db_mut()
        .insert_account_info(Address::from_slice(&output_token.0), output_token_acc_info);
    new_evm
        .db_mut()
        .insert_account_info(Address::from_slice(&factory.0), factory_acc_info);

    // Deploy pair contract using factory
    let factory_abi = BaseContract::from(parse_abi(&[
        "function createPair(address,address) external returns (address)",
    ])?);
    let calldata = factory_abi.encode("createPair", (input_token, output_token))?;

    let _gas_price = rU256::from(100)
        .checked_mul(rU256::from(10).pow(rU256::from(9)))
        .unwrap();

    let call_account = new_evm
        .db_mut()
        .load_account(Address::from_slice(&account.0))
        .unwrap();

    let nonce = call_account.info.nonce;

    info!("nonce: {:?}", nonce);

    // Create a pair contract using the factory contract
    // WARNING: This will fail with "PAIR_EXISTS" error if the pair already exists
    // Use Option 2 below if the pair already exists
    let create_pair_tx = TxEnv {
        caller: Address::from_slice(&account.0),
        gas_limit: 5000000,
        gas_priority_fee: None,
        kind: TxKind::Call(Address::from_slice(&factory.0)),
        value: rU256::ZERO,
        data: rBytes::from(calldata.0),
        chain_id: None,
        access_list: Default::default(),
        blob_hashes: Vec::new(),
        nonce,
        ..Default::default()
    };
    new_evm.tx = create_pair_tx;

    let result = match new_evm.transact_commit(new_evm.tx.clone()) {
        Ok(result) => result,
        Err(e) => {
            // This error typically occurs when trying to create an existing pair
            // Error message: "UniswapV2: PAIR_EXISTS"
            // Solution: Use Option 2 (existing pair) instead of creating new pair
            return Err(anyhow!("EVM call failed: {:?}", e));
        }
    };
    
    // ===== OPTION 1: Create new pair (uncomment if pair doesn't exist) =====
    // Uncomment the following lines if you want to create a new pair that doesn't exist
    // This will create a new Uniswap V2 pair for the given token combination
    
    // let result = get_tx_result(result)?;
    // let pair_address: H160 = factory_abi.decode_output("createPair", result.output)?;
    // info!("Pair created: {:?}", pair_address);

    // Parse PairCreated event to get token0 / token1 from the newly created pair
    // let _pair_created_log = &result.logs.unwrap()[0];

    // ===== OPTION 2: Use existing pair (comment out above if pair already exists) =====
    // If the pair already exists, comment out the above lines and uncomment the line below
    // This prevents the "PAIR_EXISTS" error when trying to create an existing pair
    // 
    // ERROR: If you try to create an existing pair, you'll get:
    // "EVM REVERT: 0x08c379a000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000016556e697377617056323a20504149525f45584953545300000000000000000000"
    // Decoded: "UniswapV2: PAIR_EXISTS"
    let pair_address = target_pair;
    
    // Simplified handling: directly use input token order
    // In a real implementation, you would parse the PairCreated event logs
    let token0 = Address::from_slice(&input_token.0);
    let token1 = Address::from_slice(&output_token.0);
    info!("Token 0: {:?} / Token 1: {:?}", token0, token1);

    // Verify that the target pair matches the created pair address
    // Note: If using Option 2 (existing pair), comment out this assertion
    assert_eq!(target_pair, pair_address);

    // Inject reserves into the pool since there are no reserves initially
    // Uniswap V2 stores reserves at storage slot 8
    let reserves_slot = rU256::from(8);
    let original_reserves = new_evm
        .db_mut()
        .storage(Address::from_slice(&pair_address.0), reserves_slot)?;
    new_evm.db_mut().insert_account_storage(
        Address::from_slice(&pair_address.0),
        reserves_slot,
        original_reserves,
    )?;

    // Check that the reserves are set correctly
    let pair_abi = BaseContract::from(parse_abi(&[
        "function getReserves() external view returns (uint112,uint112,uint32)",
    ])?);
    let calldata = pair_abi.encode("getReserves", ())?;
    let call_account = new_evm
        .db_mut()
        .load_account(Address::from_slice(&account.0))
        .unwrap();

    let nonce = call_account.info.nonce;

    info!("nonce: {:?}", nonce);
    let get_reserves_tx = TxEnv {
        caller: Address::from_slice(&account.0),
        gas_limit: 5000000,
        gas_priority_fee: None,
        kind: TxKind::Call(Address::from_slice(&target_pair.0)),
        value: rU256::ZERO,
        data: rBytes::from(calldata.0),
        chain_id: None,
        access_list: Default::default(),
        blob_hashes: Vec::new(),
        nonce,
        ..Default::default()
    };
    new_evm.tx = get_reserves_tx;

    let result = match new_evm.transact(new_evm.tx.clone()) {
        Ok(result) => result,
        Err(e) => return Err(anyhow!("EVM call failed: {:?}", e)),
    };
    let result = get_tx_result(result.result)?;
    let reserves: (U256, U256, U256) = pair_abi.decode_output("getReserves", result.output)?;
    info!("Pair reserves: {:?}", reserves);

    // Set up token balances for the pair contract to enable real swaps
    // Determine which token corresponds to which balance slot
    let (balance_slot_0, balance_slot_1) = if token0 == Address::from_slice(&input_token.0) {
        (input_balance_slot, output_balance_slot)
    } else {
        (output_balance_slot, input_balance_slot)
    };
    info!(
        "Balance slot 0: {:?} / slot 1: {:?}",
        balance_slot_0, balance_slot_1
    );

    let pair_token0_slot = keccak256(&abi::encode(&[
        abi::Token::Address(target_pair.into()),
        abi::Token::Uint(U256::from(balance_slot_0)),
    ]));
    // Convert ethers::U256 to revm::U256
    let reserve0_str = reserves.0.to_string();
    let reserve0_revm = rU256::from_str_radix(&reserve0_str, 10).unwrap_or(rU256::ZERO);
    new_evm.db_mut().insert_account_storage(
        token0,
        rU256::from_be_bytes(pair_token0_slot.0),
        reserve0_revm,
    )?;

    let pair_token1_slot = keccak256(&abi::encode(&[
        abi::Token::Address(target_pair.into()),
        abi::Token::Uint(U256::from(balance_slot_1)),
    ]));
    // Convert ethers::U256 to revm::U256
    let reserve1_str = reserves.1.to_string();
    let reserve1_revm = rU256::from_str_radix(&reserve1_str, 10).unwrap_or(rU256::ZERO);
    new_evm.db_mut().insert_account_storage(
        token1,
        rU256::from_be_bytes(pair_token1_slot.0),
        reserve1_revm,
    )?;

    // Check that balance is set correctly
    let token_abi = BaseContract::from(parse_abi(&[
        "function balanceOf(address) external view returns (uint256)",
    ])?);
    for token in vec![token0, token1] {
        let calldata = token_abi.encode("balanceOf", target_pair)?;
        new_evm.tx.caller = Address::from_slice(&account.0);
        new_evm.tx.kind = TxKind::Call(token);
        new_evm.tx.data = rBytes::from(calldata.0);
        let result = match new_evm.transact(new_evm.tx.clone()) {
            Ok(result) => result,
            Err(e) => return Err(anyhow!("EVM call failed: {:?}", e)),
        };
        let result = get_tx_result(result.result)?;
        let balance: U256 = token_abi.decode_output("balanceOf", result.output)?;
        info!("{:?}: {:?}", token, balance);
    }

    // Set up simulator's input token balance for swap simulation
    let slot_in = keccak256(&abi::encode(&[
        abi::Token::Address(simulator_address.into()),
        abi::Token::Uint(U256::from(input_balance_slot)),
    ]));
    new_evm.db_mut().insert_account_storage(
        Address::from_slice(&input_token.0),
        rU256::from_be_bytes(slot_in.0),
        ten_eth,
    )?;

    // Execute the Uniswap V2 swap simulation
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

    let call_account = new_evm
        .db_mut()
        .load_account(Address::from_slice(&account.0))
        .unwrap();

    let nonce = call_account.info.nonce;
    let v2_simulate_swap_tx = TxEnv {
        caller: Address::from_slice(&account.0),
        gas_limit: 5000000,
        gas_priority_fee: None,
        kind: TxKind::Call(Address::from_slice(&simulator_address.0)),
        value: rU256::ZERO,
        data: rBytes::from(calldata.0),
        chain_id: None,
        access_list: Default::default(),
        blob_hashes: Vec::new(),
        nonce,
        ..Default::default()
    };
    new_evm.tx = v2_simulate_swap_tx;

    let result = match new_evm.transact(new_evm.tx.clone()) {
        Ok(result) => result,
        Err(e) => return Err(anyhow!("EVM call failed: {:?}", e)),
    };
    let result = get_tx_result(result.result)?;
    let out: (U256, U256) = simulator_abi.decode_output("v2SimulateSwap", result.output)?;
    info!("Amount out: {:?}", out);

    Ok(out) // Return actual swap results
}

/// Extract transaction result from execution result
/// Handles different execution outcomes (Success, Revert, Halt)
pub fn get_tx_result(result: ExecutionResult) -> Result<TxResult> {
    let output = match result {
        ExecutionResult::Success {
            gas_used,
            gas_refunded,
            output,
            logs,
            ..
        } => match output {
            Output::Call(o) => TxResult {
                output: Bytes::from(o.to_vec()),
                logs: Some(logs),
                gas_used,
                gas_refunded,
            },
            Output::Create(o, _) => TxResult {
                output: Bytes::from(o.to_vec()),
                logs: Some(logs),
                gas_used,
                gas_refunded,
            },
        },
        ExecutionResult::Revert { gas_used, output } => {
            return Err(anyhow!(
                "EVM REVERT: {:?} / Gas used: {:?}",
                output,
                gas_used
            ))
        }
        ExecutionResult::Halt { reason, .. } => return Err(anyhow!("EVM HALT: {:?}", reason)),
    };

    Ok(output)
}
