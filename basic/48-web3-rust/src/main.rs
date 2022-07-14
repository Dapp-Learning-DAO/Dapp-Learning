use hex::FromHex;
use std::str::FromStr;
use web3::{
    contract::{Contract, Options},
    types::{Address, H160, U256},
};

#[macro_use]
extern crate dotenv_codegen;

#[tokio::main]
async fn main() -> web3::contract::Result<()> {
    // Create new HTTP transport connecting to given URL.
    let transport = web3::transports::Http::new(dotenv!("TARGET_NETWORK"))?;

    // Insert the 20-byte "to" address in hex format (prefix with 0x)
    let to: Address = Address::from_str(dotenv!("TEST_ACCOUNT")).unwrap();

    // Create new Web3 with given transport
    let web3 = web3::Web3::new(transport);

    // Get accounts in current network
    println!("Calling accounts.");
    let mut accounts = web3.eth().accounts().await?;
    println!("Accounts: {:?}", accounts);

    // Get first account as my account, you can also just use env param "MY_ACCOUNT" as well:
    // let my_account: Address = Address::from_str(dotenv!("MY_ACCOUNT")).unwrap();
    let my_account: Address = if accounts.len() >= 1 {
        accounts[0]
    } else {
        Address::from_str(dotenv!("MY_ACCOUNT")).unwrap()
    };

    // Push a new account into this
    accounts.push(to);

    // // Getting the balances of these accounts
    // println!("Calling balance.");
    // for account in accounts {
    //     let balance = web3.eth().balance(account, None).await?;
    //     println!("Balance of {:?}: {}", account, balance);
    // }

    // Given contract address, we need this to generate Contract instance
    let addr = dotenv!("CONTRACT_ADDR").replace("0x", "");
    println!("current account: {}", dotenv!("CONTRACT_ADDR"));
    let contract_addr: H160 = H160::from(<[u8; 20]>::from_hex(addr).expect("Decoding failed"));

    // Creates new Contract Interface given blockchain address and JSON containing ABI
    let contract = Contract::from_json(
        web3.eth(),
        contract_addr,
        include_bytes!("../abi/SimpleToken.json"),
    )?;

    // One way to call constant function
    let result = contract.query("balanceOf", (my_account,), None, Options::default(), None);
    // Make sure to specify the expected return type, to prevent ambiguous compiler
    // errors about `Detokenize` missing for `()`.
    let balance_of: U256 = result.await?;

    println!("The account {} balance is: {:?}", my_account, balance_of);

    // Change state of the contract
    let tx = contract
        .call("transfer", (to, 42_u32), my_account, Options::default())
        .await?;
    println!("TxHash: {}", tx);

    // Another way to call constant function, this will be more clear
    let result1: U256 = contract
        .query("balanceOf", (my_account,), None, Options::default(), None)
        .await?;
    println!("My account balance is: {:?}", result1);

    let result2: U256 = contract
        .query("balanceOf", (to,), None, Options::default(), None)
        .await?;
    println!("The accept account balance is: {:?}", result2);

    Ok(())
}
