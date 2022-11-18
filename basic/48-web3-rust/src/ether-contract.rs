
use ethers::contract::Contract;
use ethers::abi::Abi;
use ethers::prelude::{*};
use ethers::utils::Ganache;  
use ethers::utils::Anvil;  
use ethers_solc::{CompilerInput, Solc};
use eyre::{ContextCompat, Result,eyre};
use hex::ToHex;
use std::{convert::TryFrom, sync::Arc, time::Duration, path::Path};
use std::fs::File;
use std::path::PathBuf;
// use std::time::Duration;
pub type SignerDeployedContract<T> = Contract<SignerMiddleware<Provider<T>, LocalWallet>>;


#[tokio::main]
async fn main() -> Result<()> {
        
        // set the path to the contract, `CARGO_MANIFEST_DIR` points to the directory containing the
        // manifest of `ethers`. which will be `../` relative to this file
        // let source = Path::new(&env!("CARGO_MANIFEST_DIR")).join("examples/SimpleToken.sol");
        // let compiled = Solc::default().compile_source(source).expect("Could not compile contracts");
        // let (abi, bytecode, _runtime_bytecode) =
        //     compiled.find("SimpleToken").expect("could not find contract").into_parts_or_default();
        // println!("abi: {}", abi);


        // let file = File::open("examples/SimpleToken.json")
        //     .expect("file should open read only");
        // let json = serde_json::from_reader(file)
        //     .expect("file should be proper JSON");
        // let abiString = json.get("abi")
        //     .expect("file should have abi key");

        // let abi: Abi = serde_json::from_str(abiString);  
        //  println!("abi: {}", abi);
        //  let bin = json.get("bytecode")
        //     .expect("file should have bin key");

      
        let compiled = Solc::default().compile_source("../examples/Greeter.sol").unwrap();
        
        let contract = compiled
                    .get("../examples/Greeter.sol", "Greeter").expect("could not find contract");

      
       
     
        // //1.connect to the network
        // let provider = Provider::<Http>::try_from("https://goerli.infura.io/v3/783ca8c8e70b45e2b2819860560b8683")?.interval(Duration::from_millis(10u64));
    
        // //2. instantiate our wallet
        // let wallet = "1c0eb5244c165957525ef389fc14fac4424feaaefabf87c7e4e15bcc7b425e15".parse::<LocalWallet>()?; 
   
        // let wallet_address: String = wallet.address().encode_hex();
        // println!("Default wallet address: {}", wallet_address);

        // //3. get chainID
        // let chain_id = provider.get_chainid().await.unwrap().as_u64();
        // println!("chain_id: {}", chain_id);

        // // 4. instantiate the client with the wallet
        // let client = SignerMiddleware::new(provider, wallet.with_chain_id(chain_id));
        // let client = Arc::new(client);

    
        // 5. create a factory which will be used to deploy instances of the contract
      // let factory = ContractFactory::new(contract.abi.unwrap().clone(), contract.bytecode().unwrap().clone(), client.clone());

        // let deployer = factory.deploy( 
        // "hello".to_owned(),
        // "Dapp".to_owned(),
        // 1u8,
        // U256::from(1_000_000_u64))?.send().await?;

        // let deployed_contract = deployer.clone().legacy().send().await?;

        // // 7. get the contract's address
        // let addr = deployed_contract.address();

        // println!("addr: {}", addr);

        // 8. instantiate the contract
        // let contract = SimpleContract::new(addr, client.clone());

        // // 9. call the `setValue` method
        // // (first `await` returns a PendingTransaction, second one waits for it to be mined)
        // let _receipt = contract.set_value("hi".to_owned()).send().await?.await?;

        // // 10. get all events
        // let logs = contract.value_changed_filter().from_block(0u64).query().await?;

        // // 11. get the new value
        // let value = contract.get_value().call().await?;

        // println!("Value: {value}. Logs: {}", serde_json::to_string(&logs)?);

    Ok(())

}




