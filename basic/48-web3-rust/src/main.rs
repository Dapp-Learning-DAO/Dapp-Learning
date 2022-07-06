use hex_literal::hex;
use web3::{
    contract::{Contract, Options},
    types::H160,
};

#[macro_use]
extern crate dotenv_codegen;

#[tokio::main]
async fn main() -> web3::contract::Result<()> {
    // Create new HTTP transport connecting to given URL.
    let transport = web3::transports::Http::new(dotenv!("TARGET_NETWORK"))?;

    // Create new Web3 with given transport
    let web3 = web3::Web3::new(transport);
    let my_account: H160 = hex!("70997970C51812dc3A010C7d01b50e0d17dc79C8").into();

    // Get accounts in current network
    println!("Calling accounts.");
    let mut accounts = web3.eth().accounts().await?;
    println!("Accounts: {:?}", accounts);

    // Push a new account into this
    accounts.push("d028d24f16a8893bd078259d413372ac01580769".parse().unwrap());

    // Getting the balances of these accounts
    println!("Calling balance.");
    for account in accounts {
        let balance = web3.eth().balance(account, None).await?;
        println!("Balance of {:?}: {}", account, balance);
    }

    // Given contract address, we need this to generate Contract instance
    let contract_addr: H160 = hex!("5FbDB2315678afecb367f032d93F642f64180aa3").into();

    // Creates new Contract Interface given blockchain address and JSON containing ABI
    let contract = Contract::from_json(
        web3.eth(),
        contract_addr,
        include_bytes!("../abi/Greeter.json"),
    )?;

    // One way to call constant function
    let result = contract.query("greet", (), my_account, Options::default(), None);
    // Make sure to specify the expected return type, to prevent ambiguous compiler
    // errors about `Detokenize` missing for `()`.
    let greet_info: String = result.await?;

    println!("The greet info is: {:?}", greet_info);

    // Change state of the contract
    let tx = contract
        .call(
            "setGreeting",
            "Hola, mundo!".to_string(),
            my_account,
            Options::default(),
        )
        .await?;
    println!("TxHash: {}", tx);

    // Another way to call constant function, this will be more clear
    let result1: String = contract
        .query("greet", (), my_account, Options::default(), None)
        .await?;
    println!("The new greet info is: {:?}", result1);

    Ok(())
}
