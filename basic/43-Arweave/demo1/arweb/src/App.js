import './App.css';
import 'antd/dist/antd.css';
import { Button, message } from "antd";
import Arweave from 'arweave';
// const Arweave = require('arweave');

var my_wallet = null

const arweave = Arweave.init({
    host: '127.0.0.1',
    port: 1984,
    protocol: 'http'
});


function generate_new_key(){
    arweave.wallets.generate().then((key) => {
        console.log(key);
        // {
        //     "kty": "RSA",
        //     "n": "3WquzP5IVTIsv3XYJjfw5L-t4X34WoWHwOuxb9V8w...",
        //     "e": ...
    });
    // my_wallet = key
    // return key
}

function get_key_address(myKey){
arweave.wallets.jwkToAddress(myKey).then((address) => {
    console.log(address);
    //1seRanklLU_1VTGkEk7P0xAwMJfA7owA1JHW5KyZKlY
});
}

function get_address_balance(address){
    arweave.wallets.getBalance(address).then((balance) => {
        let winston = balance;
        let ar = arweave.ar.winstonToAr(balance);
    
        console.log(winston);
        //125213858712
    
        console.log(ar);
        //0.125213858712
    });
}

function getWallet(){
  // generate_new_key()
  console.log("I am here")
}

function App() {
  return (
    <div className="App">
      <div className="App-header">
          Arweave Demo 1
          <Button onClick={getWallet()}>{my_wallet ? "Wallet OK" : "No Wallet"}</Button><br /> 
          <Button onClick={generate_new_key()}>Generate a new Wallet</Button><br /> 
      </div>
    </div>
  );
  
}

export default App;
