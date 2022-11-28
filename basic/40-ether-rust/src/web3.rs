use hex::FromHex;
use secp256k1::SecretKey;
use std::str::FromStr;
use std::time;

use web3::{
    contract::{Contract, Options},
    futures::{future, StreamExt},
    types::{Address, FilterBuilder, TransactionParameters, TransactionRequest, H160, H256, U256},
};

#[macro_use]
extern crate dotenv_codegen;

#[tokio::main]
async fn main() -> web3::contract::Result<()> {
    // Create new HTTP transport connecting to given URL.
    let transport = web3::transports::Http::new(dotenv!("TARGET_NETWORK"))?;

    // Create new Web3 with given transport
    let web3 = web3::Web3::new(transport);

    // Create new Web3 with subscribe
    let web3_ws =
        web3::Web3::new(web3::transports::WebSocket::new(dotenv!("TARGET_WS_NETWORK")).await?);

    // Insert the 20-byte "to" address in hex format (prefix with 0x)
    let to: Address = Address::from_str(dotenv!("TEST_ACCOUNT")).unwrap();

    // Insert the 32-byte private key in hex format (do NOT prefix with 0x)
    let prvk = SecretKey::from_str(dotenv!("TEST_ACCOUNT_PRIVATE_KEY")).unwrap();

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
    println!("current contract addr: {}", dotenv!("CONTRACT_ADDR"));

    let contract_addr: H160 = if addr.len() == 40 {
      H160::from(<[u8; 20]>::from_hex(addr).expect("Decoding failed"))
    }else{
      // Get the contract bytecode for instance from Solidity compiler
      let bytecode = include_str!("../abi/SimpleToken.bin").trim_end();
      // Deploying a contract
      let new_contract = Contract::deploy(web3.eth(), include_bytes!("../abi/SimpleToken.json"))?
          .confirmations(0)
          .execute(
              bytecode,
              (
                  "hello".to_owned(),
                  "Dapp".to_owned(),
                  1u8,
                  U256::from(1_000_000_u64),
              ),
              my_account,
          )
          .await?;

      let contract_addr = new_contract.address();

      println!("contract deploy success, addr: {}", contract_addr);
      contract_addr
    };

    // Filter for Transfer event in our contract
    // Notic: params in topics should be vec of event encode signiture
    let filter = FilterBuilder::default()
        .address(vec![contract_addr])
        .topics(
            Some(vec![H256::from(
                <[u8; 32]>::from_hex(dotenv!("TRANSFER_EVENT_SIGNITURE")).expect("Decoding failed"),
            )]),
            None,
            None,
            None,
        )
        .build();

    // Filter for Approval event in our contract
    let sub_filter = FilterBuilder::default()
        .address(vec![contract_addr])
        .topics(
            Some(vec![H256::from(
                <[u8; 32]>::from_hex(dotenv!("APPROVAL_EVENT_SIGNITURE")).expect("Decoding failed"),
            )]),
            None,
            None,
            None,
        )
        .build();

    let log_filter = web3.eth_filter().create_logs_filter(filter).await?;

    let logs_stream = log_filter.stream(time::Duration::from_secs(1));
    futures::pin_mut!(logs_stream);

    let sub = web3_ws.eth_subscribe().subscribe_logs(sub_filter).await?;

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

    // Approve some tokens to test account
    let approvee_amount = 10000u32;
    let tx = contract
        .call(
            "approve",
            (to, approvee_amount),
            my_account,
            Options::default(),
        )
        .await?;
    println!("TxHash: {}", tx);

    // Check the allowance
    let allowance: U256 = contract
        .query(
            "allowance",
            (my_account, to),
            None,
            Options::default(),
            None,
        )
        .await?;
    println!("My account allowance to {:?} is: {:?}", to, allowance);

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

    // get logs from stream
    let log = logs_stream.next().await.unwrap();
    println!("got log: {:?}", log.is_ok());

    // Build the tx object, send some eths before we do transferFrom
    let tx_object = TransactionRequest {
        from: my_account,
        to: Some(to),
        value: Some(U256::exp10(17)), //0.1 eth
        ..Default::default()
    };

    // Send the tx to localhost
    let result = web3.eth().send_transaction(tx_object).await?;

    println!("Tx succeeded with hash: {}", result);

    /////////////////////
    // Below generates and signs a transaction offline, before transmitting it to a public node (eg Infura)
    // Sign the tx (can be done offline)
    // let signed = web3.accounts().sign_transaction(tx_object, &prvk).await?;

    // Send the tx to infura
    // let result = web3.eth().send_raw_transaction(signed.raw_transaction).await?;
    /////////////////////

    // use test account transfer user token to zero address
    let result3 = contract
        .signed_call(
            "transferFrom",
            (my_account, H160::random(), 10000u32),
            Options::default(),
            &prvk,
        )
        .await?;
    println!("Did transfer action success: {:?}", result3);

    let user_balance: U256 = contract
        .query("balanceOf", (my_account,), None, Options::default(), None)
        .await?;
    println!("After transfer my account balance is: {:?}", user_balance);

    // get logs from subscribed event
    sub.for_each(|log| {
        println!("got sub log: {:?}", log);
        future::ready(())
    })
    .await;

    Ok(())
}
