const fs = require("fs");
const SimpleToken = require('./build/SimpleToken.json');

const { ethers } = require("ethers");
const Web3 = require('web3');


    const privateKey = fs.readFileSync("./sk.txt").toString().trim()
    let wallet = new ethers.Wallet(privateKey);

    const web3 = new Web3.providers.HttpProvider('https://kovan.infura.io/v3/0aae8358bfe04803b8e75bb4755eaf07');

    let web3Provider = new ethers.providers.Web3Provider(web3)

 //   provider = new ethers.providers.InfuraProvider(  "kovan","0aae8358bfe04803b8e75bb4755eaf07"  )

    let address = "0x54A65DB20D7653CE509d3ee42656a8F138037d51";

    let walletTo = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

    web3Provider.getBalance(address).then((balance) => {

        // balance is a BigNumber (in wei); format is as a sting (in ether)
        let etherString = ethers.utils.formatEther(balance);

        console.log("Balance: " + etherString);
    });

    let token;

    (async function() {

        // 常见合约工厂实例
        const simpletoken = new ethers.ContractFactory(SimpleToken.abi, SimpleToken.bytecode, wallet);
        token =  await simpletoken.deploy( "HEHE", "HH", 1, 100000000);

        // 部署交易有一旦挖出，合约地址就可用
        console.log(token.address);

       // console.log(token.deployTransaction.hash);

        await token.deployed()
        console.log( token.balanceOf(wallet.address));

    })();



const incrementer = new ethers.ContractFactory(abi, bytecode, wallet);

const deploy = async () => {
    console.log(`Attempting to deploy from account: ${wallet.address}`);

    // Send Tx (Initial Value set to 5) and Wait for Receipt
    const contract = await incrementer.deploy([5]);
    await contract.deployed();

    console.log(`Contract deployed at address: ${contract.address}`);
};

deploy();





