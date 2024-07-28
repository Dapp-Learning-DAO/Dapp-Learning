use std::env;
use alloy::{providers::ProviderBuilder, sol};
use alloy::network::{EthereumWallet, NetworkWallet};
use alloy::primitives::{U256};
use alloy::providers::Provider;
use alloy::signers::local::{PrivateKeySigner};
use dotenv::dotenv;
use eyre::Result;
use log::info;

sol!(
    #[allow(missing_docs)]
    #[sol(rpc)]
    SimpleToken,
    "src/abi/SimpleToken.json"
);

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    env_logger::init();

    let rpc_url = env::var("RPC_LOCAL")?.parse()?;
    let private_key = env::var("DEV_PRIVATE_KEY")?;

    let signer: PrivateKeySigner = private_key.parse().expect("Failed to parse private key");
    let address = signer.address();
    let wallet = EthereumWallet::from(signer);
    let provider =
        ProviderBuilder::new().with_recommended_fillers().wallet(wallet).on_http(rpc_url);

    let chain_id = provider.get_chain_id().await?;
    info!("Connected to chain {}", chain_id);

    // let erc20_contract = SimpleToken::new("0xapple".parse()?, provider);
    let erc20_contract = SimpleToken::deploy(provider).await?;

    let amount = U256::from(100u64);
    let receipt = erc20_contract.transfer(address, amount).send().await?.get_receipt().await?;

    assert_eq!(receipt.status(), true);
    info!("Transfer successful");

    Ok(())
}