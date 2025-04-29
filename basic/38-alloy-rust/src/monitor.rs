use alloy::{
    primitives::{address, utils::{format_ether, Unit}, U256, Address },
    providers::{Provider, ProviderBuilder, WsConnect},
    signers::local::PrivateKeySigner,
    sol
};
use std::error::Error;
use futures::StreamExt;
use dotenv::dotenv;

use std::env;

// Generate bindings for the WETH9 contract
sol! {
    #[sol(rpc)]
    contract WETH9 {
        function deposit() public payable;
        function balanceOf(address) public view returns (uint256);
        function withdraw(uint amount) public;
    }
}
 

 
#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {

    dotenv().ok();
    // Connect to an Ethereum node via WebSocket
    let provider = ProviderBuilder::new()
        .connect_ws(WsConnect::new("wss://eth.drpc.org"))
        .await?;
 
    // Uniswap V3 ETH-USDC Pool address
    let uniswap_pool = "0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8".parse::<Address>()?;
 
    // Subscribe to new blocks
    let mut block_stream = provider.subscribe_blocks().await?.into_stream();
    println!("🔄 Monitoring for new blocks...");



    // weth load
    let private_key = env::var("DEV_PRIVATE_KEY")?;
    let signer: PrivateKeySigner = private_key.parse().expect("Failed to parse private key");
    let weth_address = address!("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2");
    let weth = WETH9::new(weth_address, provider.clone());

    let erc20_contract = WETH9::new("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2".parse()?, provider);
 
    // Process each new block as it arrives
    while let Some(block) = block_stream.next().await {
        println!("🧱 Block #{}: {}", block.number, block.hash);
 
        // Get contract balance at this block
        // let balance = provider
        //     .get_balance(uniswap_pool)
        //     .block_id(block.number.into())
        //     .await?;
 
        let balance = erc20_contract.balanceOf(uniswap_pool).call().await?;
        // Format the balance in ETH
        println!("💰 Uniswap V3 ETH-USDC Pool balance: {} ETH", format_ether(balance));
    }
 
    Ok(())
}