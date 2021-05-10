let Web3 = require('web3');
let solc = require("solc");
let fs   = require('fs');
let Tx = require('ethereumjs-tx').Transaction

let web3 = new Web3('http://localhost:8545');
let source=fs.readFileSync("./demo.sol","utf8");
let cacl=solc.compile(source,1);
let abi= JSON.parse(cacl.contracts[':Calc'].interface);
let contractAddress = '0xFCb0a633FEC2f80aec83508E13df38ce81A41c9E';
let myContract = new web3.eth.Contract(abi,contractAddress);
let privateKey = new Buffer.from('8dfa1cf0dabbfbe17c3acce13e8ec14955e6cce00f8d703b8b45594efdb2c6d7', 'hex');

const rawTx = {
    // this could be provider.addresses[0] if it exists
    from: '0xcD34b672c5C572a2E846F1D0ad0618c4B25FA4e6', 
    // target address, this could be a smart contract address
    to: '0xFCb0a633FEC2f80aec83508E13df38ce81A41c9E', 
    // optional if you want to specify the gas limit 
    gasPrice: '0x091',
    gasLimit: '0x27110',
    // optional if you are invoking say a payable function 
    value: '0x00',
    nonce: '0x04',
    // this encodes the ABI of the method and the arguements
    data: myContract.methods.getCount().encodeABI() 
  };

  var tx = new Tx(rawTx, {'chain':'ropsten'});
tx.sign(privateKey);

var serializedTx = tx.serialize();

web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex')).on('receipt', console.log)

  //let signPromise = web3.eth.accounts.signTransaction(tx, privateKey);
//let signPromise = web3.eth.signTransaction(tx, tx.from);


  //signPromise.then((signedTx) => {  

    // raw transaction string may be available in .raw or 
    // .rawTransaction depending on which signTransaction
    // function was called
    //const sentTx = web3.eth.sendSignedTransaction(signedTx.raw || signedTx.rawTransaction).then(console.log); 
    
    //sentTx.on("receipt", console.log);
    
    //sentTx.on("error", console.log);
    
  //}).catch((err) => {  
    
    // do something when promise fails
    
  //});