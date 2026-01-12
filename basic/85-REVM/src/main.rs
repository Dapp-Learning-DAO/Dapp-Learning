// Main entry point demonstrating REVM capabilities with various examples

use anyhow::Result;
use ethers::types::H160;
use log::info;
use std::str::FromStr;

use revm_is_all_you_need::constants::Env;
use revm_is_all_you_need::tokens::get_implementation;
use revm_is_all_you_need::utils::setup_logger;

use revm_is_all_you_need::revm_examples::{
    create_evm_instance, evm_env_setup, get_token_balance, geth_and_revm_tracing,
    revm_contract_deploy_and_tracing, revm_v2_simulate_swap,
};

use alloy::providers::{Provider, ProviderBuilder};

use revm_is_all_you_need::eth_call_examples::eth_call_v2_simulate_swap;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize environment and logging
    dotenv::dotenv().ok();
    setup_logger()?;

    // Setup environment configuration
    let env = Env::new();
    info!("Attempting to connect to: {}", env.wss_url);

    // Create EVM instance and configure environment
    let mut evm = create_evm_instance(&env.wss_url).await?;
    evm_env_setup(&mut evm);

    // Define token addresses for testing
    let user = H160::from_str("0xE2b5A9c1e325511a227EF527af38c3A7B65AFA1d").unwrap();
    let weth = H160::from_str("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2").unwrap();
    let usdt = H160::from_str("0xdAC17F958D2ee523a2206206994597C13D831ec7").unwrap();
    let _usdc = H160::from_str("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48").unwrap();
    let _dai = H160::from_str("0x6B175474E89094C44Da98b954EedeAC495271d0F").unwrap();

    // Test token balance query (will fail in empty EVM)
    let weth_balance = get_token_balance(&mut evm, weth, user);
    match weth_balance {
        Ok(balance) => info!("WETH balance: {}", balance),
        Err(e) => info!("WETH balance query failed (expected in empty EVM): {}", e),
    }

    // Create provider for blockchain interaction
    let provider = ProviderBuilder::new().connect(&env.wss_url).await?.erased();

    // Demonstrate Geth tracing capabilities
    match geth_and_revm_tracing(&mut evm, provider.clone(), weth, user).await {
        Ok(_) => info!("Tracing completed successfully"),
        Err(e) => info!("Tracing error: {e:?}"),
    }
    
    // Demonstrate contract deployment and tracing
    match revm_contract_deploy_and_tracing(&mut evm, provider.clone(), weth, user).await {
        Ok(_) => {}
        Err(e) => info!("Tracing error: {e:?}"),
    }

    // Define Uniswap V2 addresses for swap simulation
    let uniswap_v2_factory = H160::from_str("0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f").unwrap();
    let weth_usdt_pair = H160::from_str("0x0d4a11d5EEaaC28EC3F61d100daF4d40471f1852").unwrap();

    let weth_balance_slot =
        revm_contract_deploy_and_tracing(&mut evm, provider.clone(), weth, user)
            .await
            .unwrap();
    let usdt_balance_slot =
        revm_contract_deploy_and_tracing(&mut evm, provider.clone(), usdt, user)
            .await
            .unwrap();

    let weth_implementation = get_implementation(provider.clone(), weth).await.unwrap();
    let usdt_implementation = get_implementation(provider.clone(), usdt).await.unwrap();

    info!("WETH proxy: {:?}", weth_implementation);
    info!("USDT proxy: {:?}", usdt_implementation);

    match revm_v2_simulate_swap(
        &mut evm,
        provider.clone(),
        user,
        uniswap_v2_factory,
        weth_usdt_pair,
        weth,
        usdt,
        weth_balance_slot,
        usdt_balance_slot,
        weth_implementation,
        usdt_implementation,
    )
    .await
    {
        Ok(_) => info!("v2SimulateSwap revm completed successfully"),
        Err(e) => info!("v2SimulateSwap revm failed: {e:?}"),
    }

    match eth_call_v2_simulate_swap(
        &mut evm,
        provider,
        user,
        weth_usdt_pair,
        weth,
        usdt,
        weth_balance_slot,
    )
    .await
    {
        Ok(_) => info!("v2SimulateSwap eth_call completed successfully"),
        Err(e) => info!("v2SimulateSwap eth_call failed: {e:?}"),
    }

    Ok(())
}
