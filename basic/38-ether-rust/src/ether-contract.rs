use ethers::contract::Contract;
use ethers::utils::Ganache;
use ethers::{prelude::*, utils::Anvil};
// use ethers_solc::{CompilerInput, Solc};
use eyre::{eyre, ContextCompat, Result};
use hex::ToHex;
use std::fs::File;
use std::path::PathBuf;
use std::{convert::TryFrom, path::Path, sync::Arc, time::Duration};
// use std::time::Duration;
pub type SignerDeployedContract<T> = Contract<SignerMiddleware<Provider<T>, LocalWallet>>;

#[macro_use]
extern crate dotenv_codegen;

// Generate the type-safe contract bindings by providing the ABI
// definition
abigen!(
    SimpleContract,
    "./examples/Greeter.json",
    event_derives(serde::Deserialize, serde::Serialize)
);

#[tokio::main]
async fn main() -> Result<()> {
    // set the path to the contract, `CARGO_MANIFEST_DIR` points to the directory containing the
    // manifest of `ethers`. which will be `../` relative to this file
    // let source = Path::new(&env!("CARGO_MANIFEST_DIR")).join("examples/SimpleToken.sol");
    // let compiled = Solc::default().compile_source(source).expect("Could not compile contracts");
    // let (abi, bytecode, _runtime_bytecode) =
    //     compiled.find("SimpleToken").expect("could not find contract").into_parts_or_default();
    // println!("abi: {}", abi);


    let source = Path::new(&env!("CARGO_MANIFEST_DIR")).join("examples/Greeter.sol");
   // println!("source {}", source.display());
    let compiled = Solc::default()
        .compile_source(source)
        .expect("Could not compile contracts");
    // println!("compiled: {:?}", compiled);
    
    let (abi, bytecode, _runtime_bytecode) = compiled
        .find("Greeter")
        .expect("could not find contract")
        .into_parts_or_default();

    // 1. compile the contract (note this requires that you are inside the `examples` directory) and
    // launch anvil
    let anvil = Anvil::new().spawn();

    // 2. instantiate our wallet
    let wallet: LocalWallet = anvil.keys()[0].clone().into();

    let wallet_address: String = wallet.address().encode_hex();
    println!("Default wallet address: {}", wallet_address);

    // 3. connect to the network
    let provider =
        Provider::<Http>::try_from(anvil.endpoint())?.interval(Duration::from_millis(10u64));

    // 4. instantiate the client with the wallet
    let client = SignerMiddleware::new(provider, wallet.with_chain_id(anvil.chain_id()));
    let client = Arc::new(client);

    // 5. create a factory which will be used to deploy instances of the contract
    let factory = ContractFactory::new(abi, bytecode, client.clone());

    // 6. deploy it with the constructor arguments
    let deployer = factory.deploy("hello solidity".to_string())?.send().await?;

    // 7. get the contract's address
    let addr = deployer.address();

    println!("addr: {}", addr);

    // 8. instantiate the contract
    let contract = SimpleContract::new(addr, client.clone());

    // 9. call the `setValue` method
    // (first `await` returns a PendingTransaction, second one waits for it to be mined)
    let _receipt = contract.set_greeting("hi dapp_learning".to_owned()).send().await?.await?;

    // 10. get all events
    let logs = contract
        .value_changed_filter()
        .from_block(0u64)
        .query()
        .await?;

    // 11. get the new value
    let value = contract.greet().call().await?;

    println!("Value: {value}.  \n\nLogs: {}", serde_json::to_string(&logs)?);

    Ok(())
}
