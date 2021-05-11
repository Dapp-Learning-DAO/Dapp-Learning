const Web3 = require('web3');
const fs = require("fs");
const { expect } = require('chai');

const privatekey = fs.readFileSync("./sk.txt").toString().trim()
/*
   -- Define Provider & Variables --
*/
// Provider
const web3 = new Web3(new Web3.providers.HttpProvider('https://kovan.infura.io/v3/0aae8358bfe04803b8e75bb4755eaf07'));

//account
const  account = web3.eth.accounts.privateKeyToAccount(privatekey);
const account_from = {
    privateKey: account.privateKey,
    accountaddress: account.address,
};

const abi = JSON.parse(contractFile.contracts[':BAC001'].interface);
const bytecode=contractFile.contracts[':BAC001'].bytecode;


describe("Erc20", function () {
  let contractAddress;

  describe("deploy Contract", function () {
    it("Should deploy YourContract", async function () {
        console.log(`Attempting to deploy from account ${account_from.accountaddress}`);
        // Create Contract Instance
        const bac = new web3.eth.Contract(abi);

        // Create Constructor Tx
        const incrementerTx = bac.deploy({
            data: bytecode,
            arguments: ["hello","Dapp",1,100000000],
        });
        // Sign Transacation and Send
        const createTransaction = await web3.eth.accounts.signTransaction(
            {
                data: incrementerTx.encodeABI(),
                gas: "8000000",
            },
            account_from.privateKey
        );

        // Send Tx and Wait for Receipt
        const createReceipt = await web3.eth.sendSignedTransaction(
            createTransaction.rawTransaction
        );
        console.log(
            `Contract deployed at address: ${createReceipt.contractAddress}`
        );
        contractAddress = createReceipt.contractAddress;
    });
    it("get token amount", async function () {

    const newbac = new web3.eth.Contract(abi, createReceipt.contractAddress);
    let shrotname ;
          newbac.methods.shortName().call().then(function(x){
              shrotname =x;
          });
        expect(shrotname ).to.equal("Dapp");
      });
  });
});
