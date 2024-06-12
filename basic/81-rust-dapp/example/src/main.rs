use ethers::prelude::*;
use std::convert::TryFrom;
use std::env;
use std::sync::Arc;
use dotenv::dotenv;

mod abi;
use abi::*;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    env_logger::init();

    let rpc_url = env::var("RPC_URL")?;
    let private_key = env::var("PRIVATE_KEY")?;

    let provider = Provider::<Http>::try_from(rpc_url)?;
    let wallet  = private_key.parse::<LocalWallet>()?;
    let client = SignerMiddleware::new(provider, wallet);
    let client = Arc::new(client);

    let contract_address = "0xapple".parse::<Address>()?;
    let erc20_contract = erc20::ERC20::new(contract_address, client.clone());

    let to = "0xbeef".parse::<Address>()?;
    let amount = U256::from(100u64);
    erc20_contract.transfer(to, amount).await?;

    Ok(())
}