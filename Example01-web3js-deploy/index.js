let Web3 = require('web3');
let solc = require("solc");
let fs   = require('fs');

// 从 sk.txt 中获取账户私钥。 需要手工创建 sk.txt , 并放入账户私钥
const privatekey = fs.readFileSync("./sk.txt").toString().trim()

// 以 utf8 方式加载合约
const source = fs.readFileSync('Incrementer.sol','utf8');

// 编译合约
const input = {
   language: 'Solidity',
   sources: {
      'Incrementer.sol': {
         content: source,
      },
   },
   settings: {
      outputSelection: {
         '*': {
            '*': ['*'],
         },
      },
   },
};

const tempFile = JSON.parse(solc.compile(JSON.stringify(input)));
const contractFile = tempFile.contracts['Incrementer.sol']['Incrementer'];


// 获取 abi 和 bin
const bytecode = contractFile.evm.bytecode.object;
const abi = contractFile.abi;

// 传入 kovan 测试网地址，构造 web3 实例
const web3 = new Web3('https://kovan.infura.io/v3/0aae8358bfe04803b8e75bb4755eaf07'); 

// 根据账户私钥创建账户
const account = web3.eth.accounts.privateKeyToAccount(privatekey);
const account_from = {
	privateKey: privatekey,
	accountAddress: account.address,
 };

/*
   -- 部署合约 --
*/
const Deploy = async () => {

	// 创建合约实例
	const deployContract = new web3.eth.Contract(abi);

	// 构造部署合约的交易
	const deployTx = deployContract.deploy({
	data: bytecode,
	arguments: [5],
	});

	// 使用账户私钥对交易进行签名
	const deployTransaction = await web3.eth.accounts.signTransaction(
	{
		data: deployTx.encodeABI(),
		gas: await deployTx.estimateGas(),
	},
	account_from.privateKey
	);

	// 发送合约部署交易，同时获取交易回执，并打印回执中返回的交易部署成功后的合约地址
	const deployReceipt = await web3.eth.sendSignedTransaction(
		deployTransaction.rawTransaction
	);
	console.log(
	`Contract deployed at address: ${deployReceipt.contractAddress}`
	);
}

Deploy();