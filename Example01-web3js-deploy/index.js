let Web3 = require('web3');
let solc = require("solc");
let fs   = require('fs');
let Tx = require('ethereumjs-tx').Transaction
if(typeof web3 != 'undefined'){
	web3=new Web3(web3.currentProvider);
}else{
	web3 = new Web3('http://localhost:8545');
}
let source=fs.readFileSync("./demo.sol","utf8");
let cacl=solc.compile(source,1);

let abi= JSON.parse(cacl.contracts[':Calc'].interface);
let bytecode=cacl.contracts[':Calc'].bytecode;


web3.eth.getAccounts().then(data=>{
	web3.eth.personal.unlockAccount(data[0]).then(openAccountState=>{
		if(openAccountState){
			console.log("开户状态:"+openAccountState);
			var rsContract=new web3.eth.Contract(abi).deploy({
				data:'0x'+bytecode,
				arguments:[],	//传递构造函数的参数
			}).send({
				from:data[0],
				gas:1500000,
				gasPrice:'30000000000000'
			},function(error,transactionHash){
				console.log("send回调");
				console.log("error:"+error);
				console.log("send transactionHash:"+transactionHash);
			})
			.on('error', function(error){ console.error(error) })
			// .on('transactionHash', function(transactionHash){ console.log("hash:",transactionHash)})
			// .on('receipt', function(receipt){
			//    console.log(receipt.contractAddress) // contains the new contract address
			// })
			//.on('confirmation', function(confirmationNumber, receipt){console.log("receipt,",receipt)})
			.then(function(newContractInstance){
				var newContractAddress=newContractInstance.options.address
				console.log("新合约地址:"+newContractAddress);

				// jsonrpc
				//delloy
				web3.eth.getBlockNumber().then(blockNum=>{
					console.log("当前块号："+blockNum);
					web3.eth.getBlock(blockNum).then(data=>{
						console.log("当前块信息：");
						console.log(data);
					})
				});
				var MyContract = new web3.eth.Contract(abi,newContractAddress);
					MyContract.methods.add(1,3).call().then(console.log);
 
			});
			
		}
	});
});
