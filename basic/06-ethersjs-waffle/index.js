const fs = require("fs");
const SimpleToken = require('./build/SimpleToken.json');

const { ethers } = require("ethers");

    const privateKey = fs.readFileSync("./sk.txt").toString().trim()


    // const web3 = new Web3.providers.HttpProvider('https://kovan.infura.io/v3/0aae8358bfe04803b8e75bb4755eaf07');
    //  let web3Provider = new ethers.providers.Web3Provider(web3)

    const web3Provider = new ethers.providers.InfuraProvider(  "kovan","0aae8358bfe04803b8e75bb4755eaf07"  )

    const wallet = new ethers.Wallet(privateKey,web3Provider);

    let address = "0x54A65DB20D7653CE509d3ee42656a8F138037d51";

    let bal;

    async function checkBalance() {
    bal = await web3Provider.getBalance(address).then((balance) => {

        // balance is a BigNumber (in wei); format is as a sting (in ether)
        let etherString = ethers.utils.formatEther(balance);
        return etherString;
    });
        console.log("balance: ", bal);
    }

checkBalance()

    let token;
    async function deploy() {

        // 常见合约工厂实例
           const simpletoken = new ethers.ContractFactory(SimpleToken.abi, SimpleToken.bytecode, wallet);
           token = await simpletoken.deploy("HEHE", "HH", 1, 100000000);
        console.log(token.address);

        console.log(token.deployTransaction.hash);

        await token.deployed()

        let bal =  await token.balanceOf(wallet.address);
        console.log( bal);

    };

deploy();






