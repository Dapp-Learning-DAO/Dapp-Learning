const fs = require("fs");
const SimpleToken = require("./build/SimpleToken.json");

const { ethers } = require("ethers");

require("dotenv").config();
const privateKey = process.env.PRIVATE_KEY;

// const web3 = new Web3.providers.HttpProvider(`https://sepolia.infura.io/v3${process.env.INFURA_ID}`);
//  let web3Provider = new ethers.providers.Web3Provider(web3)

const web3Provider = new ethers.InfuraProvider(
  "sepolia",
  process.env.INFURA_ID
);

// or
// const web3Provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/' + process.env.INFURA_ID,
// 'sepolia'
// );

const wallet = new ethers.Wallet(privateKey, web3Provider);

let address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

let bal;

// support eip1559
async function getGasPrice () {
  return await web3Provider.getFeeData().then(async function (res) {
    let maxFeePerGas = res.maxFeePerGas;
    let maxPriorityFeePerGas = res.maxPriorityFeePerGas;
    console.log("maxFeePerGas: ", maxFeePerGas.toString());
    console.log("maxPriorityFeePerGas:", maxPriorityFeePerGas.toString());

    return {
      maxFeePerGas: maxFeePerGas,
      maxPriorityFeePerGas: maxPriorityFeePerGas,
    };
  });
}

async function checkBalance () {
  bal = await web3Provider.getBalance(address).then((balance) => {
    // balance is a BigNumber (in wei); format is as a sting (in ether)
    let etherString = ethers.formatEther(balance);
    return etherString;
  });
  console.log("balance: ", bal);
}

checkBalance();

let token;
async function deploy () {
  let option = await getGasPrice();
  // 常见合约工厂实例
  const simpletoken = new ethers.ContractFactory(
    SimpleToken.abi,
    SimpleToken.bytecode,
    wallet
  );
  console.log('start deploy')
  token = await simpletoken.deploy("HEHE", "HH", 1, 100000000);

  console.log(token.target);

  await token.waitForDeployment();
  console.log('deployed')
  tx = await token.transfer(
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    ethers.parseEther("0.00000000001"),
    option
  );
  console.log('hash', tx.hash);
  let bal = await token.balanceOf(wallet.address);
  console.log(bal.toString());
}

deploy();
