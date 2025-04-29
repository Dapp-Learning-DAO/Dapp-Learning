use std::env;
use alloy::{providers::ProviderBuilder, sol};
use alloy::network::EthereumWallet;
// use alloy::primitives::{U256, address, utils::{format_ether, Unit}};
use bigdecimal::{
    num_bigint::{BigInt, Sign},
    BigDecimal,
};

use alloy::{
    primitives::{
        address,
        utils::{format_ether, Unit},
        U256,
    },
    rpc::types::TransactionRequest
};

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

    let rpc_url = env::var("RPC_LOCAL").unwrap();
    let private_key = env::var("DEV_PRIVATE_KEY")?;

    let signer: PrivateKeySigner = private_key.parse().expect("Failed to parse private key");
    let address = signer.address();
    info!("Using address: {}", address);
    let provider =
        ProviderBuilder::new().wallet(signer).connect(rpc_url.as_str()).await?;


    let chain_id = provider.get_chain_id().await?;
    info!("Connected to chain {}", chain_id);

    // let erc20_contract = SimpleToken::new("0xapple".parse()?, provider);
    let erc20_contract = SimpleToken::deploy(provider.clone()).await?;



    let amount = U256::from(100u64);
    let receipt = erc20_contract.transfer(address, amount).send().await?.get_receipt().await?;

    assert!(receipt.status());
    info!("Transfer successful");

    let balance = erc20_contract.balanceOf(address).call().await?;

    
    // println!("Balance: {:.3}", format_ether(balance));
    println!("Balance: {:?}", balance);


    // send ether

    let alice = address!("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
    let value = Unit::ETHER.wei().saturating_mul(U256::from(100));
    let tx = TransactionRequest::default().to(alice).value(value);

    let pending_tx = provider.clone().send_transaction(tx).await?;
    println!("Pending transaction... {}", pending_tx.tx_hash());
 
    // Wait for the transaction to be included and get the receipt.
    let receipt = pending_tx.get_receipt().await?;
    println!(
        "Transaction included in block {}",
        receipt.block_number.expect("Failed to get block number")
    );
 
    println!("Transferred {:.5} ETH to {alice}", format_ether(value));

    Ok(())
}



// pub fn get_balance(amount: U256) -> BigDecimal {
//     BigDecimal::from((
//         BigInt::from_bytes_be(Sign::Plus, &amount.to_be_bytes::<{ U256::BYTES }>()),
//         18,
//     ))
// }