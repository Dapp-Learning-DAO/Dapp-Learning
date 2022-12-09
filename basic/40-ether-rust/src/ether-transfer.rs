use ethers::prelude::*;
use eyre::{ContextCompat, Result};
use hex::ToHex;
use std::{convert::TryFrom, time::Duration};

#[macro_use]
extern crate dotenv_codegen;

// Generate the type-safe contract bindings by providing the json artifact
// *Note*: this requires a `bytecode` and `abi` object in the `greeter.json` artifact:
// `{"abi": [..], "bin": "..."}`  or `{"abi": [..], "bytecode": {"object": "..."}}`
// this will embedd the bytecode in a variable `GREETER_BYTECODE`
// abigen!(Greeter, "ethers-contract/tests/solidity-contracts/greeter.json",);

#[tokio::main]
async fn main() -> Result<()> {
    let to_readable_num =
        |balance: U256| -> f64 { (balance.as_u64() as f64 / 10_f64.powf(18_f64)) as f64 };

    // connect to the network
    let provider = Provider::<Http>::try_from(dotenv!("TARGET_NETWORK"))?
        .interval(Duration::from_millis(10u64));
    // let provider1 = Provider::<Http>::try_from("https://goerli.infura.io/v3/783ca8c8e70b45e2b2819860560b8683")?.interval(Duration::from_millis(10u64));

    // A provider is an Ethereum JsonRPC client
    // let provider = Provider::try_from(ganache.endpoint())?.interval(Duration::from_millis(10));

    // Generate a wallet of random numbers
    //let wallet = LocalWallet::new(&mut thread_rng());

    let wallet = dotenv!("WALLET").parse::<LocalWallet>()?;

    let wallet1 = dotenv!("WALLET1").parse::<LocalWallet>()?;
    // let wallet: LocalWallet = anvil.keys()[0].clone().into();
    // let wallet1: LocalWallet = anvil.keys()[0].clone().into();

    let wallet_address: String = wallet.address().encode_hex();
    println!("Default wallet address: {}", wallet_address);

    // notice!!!
    let chain_id = provider.get_chainid().await.unwrap().as_u64();
    println!("chain_id: {}", chain_id);
    let signer = wallet1.with_chain_id(chain_id);

    let client = SignerMiddleware::new(provider.clone(), signer);
    let signature = client
        .sign(b"hello world".to_vec(), &client.address())
        .await?;
    println!("Produced signature {}", signature);

    // Query the balance of our account
    let first_balance = provider.get_balance(wallet.address(), None).await?;
    println!(
        "Wallet first address balance: {} eth",
        to_readable_num(first_balance)
    );

    // Query the blance of some random account
    let other_address_hex = dotenv!("QUERY_ADDR");
    let other_address = other_address_hex.parse::<Address>()?;
    let other_balance = provider.get_balance(other_address, None).await?;
    println!(
        "Balance for address {}: {} eth",
        other_address_hex,
        to_readable_num(other_balance)
    );

    // Create a transaction to transfer 1000 wei to `other_address`
    let tx = TransactionRequest::pay(other_address, U256::from(1000u64)).from(wallet.address());
    //  Send the transaction and wait for receipt
    let receipt = client
        .send_transaction(tx, None)
        .await?
        .log_msg("Pending transfer")
        .confirmations(1) // number of confirmations required
        .await?
        .context("Missing receipt")?;

    println!(
        "TX mined in block {}",
        receipt.block_number.context("Can not get block number")?
    );
    println!(
        "Balance of {} {} eth",
        other_address_hex,
        to_readable_num(provider.get_balance(other_address, None).await?)
    );

    Ok(())
}
