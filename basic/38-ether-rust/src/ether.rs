use ethers::{prelude::*, utils::Anvil};
use eyre::{ContextCompat, Result};
use std::path::Path;
use std::{convert::TryFrom, sync::Arc, time::Duration};

extern crate dotenv_codegen;

// Generate the type-safe contract bindings by providing the json artifact
// *Note*: this requires a `bytecode` and `abi` object in the `greeter.json` artifact:
// `{"abi": [..], "bin": "..."}`  or `{"abi": [..], "bytecode": {"object": "..."}}`
// this will embedd the bytecode in a variable `GREETER_BYTECODE`
// abigen!(Greeter, "ethers-contract/tests/solidity-contracts/greeter.json",);
abigen!(
    SimpleToken,
    "./examples/SimpleToken.json",
    event_derives(serde::Deserialize, serde::Serialize)
);

abigen!(
    ERC20,
    r#"[
      event  Transfer(address indexed src, address indexed dst, uint wad)
  ]"#,
);

#[tokio::main]
async fn main() -> Result<()> {
    let to_readable_num =
        |balance: U256| -> f64 { (balance.as_u128() as f64 / 10_f64.powf(18_f64)) as f64 };
    // Spawn a ganache instance
    // let mnemonic = "gas monster ski craft below illegal discover limit dog bundle bus artefact";
    // let ganache = Ganache::new().mnemonic(mnemonic).spawn();
    let source = Path::new(&env!("CARGO_MANIFEST_DIR")).join("examples/SimpleToken.sol");
    // println!("source {}", source.display());
    let compiled = Solc::default()
        .compile_source(source)
        .expect("Could not compile contracts");
    // println!("compiled: {:?}", compiled);

    let (abi, bytecode, _runtime_bytecode) = compiled
        .find("SimpleToken")
        .expect("could not find contract")
        .into_parts_or_default();

    let anvil = Anvil::new().spawn();

    // connect to the network
    let provider =
        Provider::<Http>::try_from(anvil.endpoint())?.interval(Duration::from_millis(10u64));

    // A provider is an Ethereum JsonRPC client
    // let provider = Provider::try_from(ganache.endpoint())?.interval(Duration::from_millis(10));
    //    let provider = Provider::<Http>::try_from(
    //     "https://goerli.infura.io/v3/783ca8c8e70b45e2b2819860560b8683").expect("could not instantiate HTTP Provider");
    //     let provider = Provider::try_from(ganache.endpoint())?.interval(Duration::from_millis(10));

    // Generate a wallet of random numbers
    //let wallet = LocalWallet::new(&mut thread_rng());
    let wallet: LocalWallet = anvil.keys()[0].clone().into();
    let wallet_address = wallet.address();
    let wallet1: LocalWallet = anvil.keys()[1].clone().into();
    let wallet1_address = wallet1.address();

    // for n in anvil.keys() {
    //     println!("wallets : {:?}", LocalWallet::from(n.clone()).address());
    // }

    println!("Default wallet address: 0x{}", wallet_address);
    println!("Default wallet1 address: 0x{}", wallet1_address);

    // instantiate the client with the wallet
    let client = SignerMiddleware::new(
        provider.clone(),
        wallet.clone().with_chain_id(anvil.chain_id()),
    );
    let client = Arc::new(client);

    // create a factory which will be used to deploy instances of the contract
    let factory = ContractFactory::new(abi, bytecode, client.clone());

    // deploy it with the constructor arguments
    let deployer = factory
        .deploy((
            "DAPPLEARNING".to_string(),
            "DAPP".to_string(),
            1u8,
            U256::from(1_000_000_u64),
        ))?
        .send()
        .await?;

    // get the contract's address
    let addr = deployer.address();

    println!("deployed address: {}", addr);

    // instantiate the contract
    let contract = SimpleToken::new(addr, client.clone());

    let first_wallet_token = contract.balance_of(wallet_address).call().await?;

    println!("first_wallet_token: {}", first_wallet_token);

    let second_wallet_token = contract.balance_of(wallet1_address).call().await?;

    println!("second_wallet_token: {}", second_wallet_token);

    // Query the balance of our account
    let first_balance: U256 = provider.get_balance(wallet.address(), None).await?;

    println!("Wallet balance: {} eth", to_readable_num(first_balance));

    let second_balance: U256 = provider.get_balance(wallet1.address(), None).await?;

    println!("Wallet1 balance: {} eth", to_readable_num(second_balance));

    // Create a transaction to transfer 1000 wei to `wallet1_address`
    let tx = TransactionRequest::pay(wallet1_address, U256::from(10_u128.pow(20)))
        .from(wallet.address());

    //  Send the transaction and wait for receipt
    let _receipt = provider
        .send_transaction(tx, None)
        .await?
        .log_msg("Pending transfer")
        .confirmations(1) // number of confirmations required
        .await?
        .context("Missing receipt")?;

    println!(
        "Balance of wallet1 {}: {} eth",
        wallet1_address,
        to_readable_num(provider.get_balance(wallet1.address(), None).await?)
    );

    // transfer DAPPLEARNING token from wallet to wallet1
    let approvee_amount: U256 = U256::from(10000);
    
    contract
        .approve(wallet.address(), approvee_amount)
        .call()
        .await?;

    contract
        .transfer(wallet1.address(), approvee_amount)
        .send()
        .await?
        .await?;

    println!(
        "Wallet balance: {} eth",
        contract.balance_of(wallet_address).call().await?
    );

    println!(
        "Wallet1 balance: {} eth",
        contract.balance_of(wallet1_address).call().await?
    );

    let logs = contract.transfer_filter().from_block(0u64).query().await?;

    println!("Logs: {}", serde_json::to_string(&logs)?);

    // // Subscribe Transfer events
    // let dapp_learning_token = ERC20::new(contract.address(), client.clone());
    // let events = dapp_learning_token.events();
    // let mut stream = events.stream().await?;

    // while let Some(Ok(event)) = stream.next().await {
    //     println!(
    //         "src: {:?}, dst: {:?}, wad: {:?}",
    //         event.src, event.dst, event.wad
    //     );
    // }

    Ok(())
}
