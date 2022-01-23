import './App.css';
import 'antd/dist/antd.css';
import Arweave from 'arweave';
import { Button, notification, Divider, Space } from 'antd';
import {
  RadiusUpleftOutlined,
  RadiusUprightOutlined,
  RadiusBottomleftOutlined,
  RadiusBottomrightOutlined,
} from '@ant-design/icons';

// const Arweave = require('arweave');

// const arweave = Arweave.init({
//   host: '127.0.0.1',
//   port: 1984,
//   protocol: 'http'
// });

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https'
});

const openNotification = placement => {
  notification.info({
    message: `Notification ${placement}`,
    description:
      'This is the content of the notification. This is the content of the notification. This is the content of the notification.',
    placement,
  });
};

let myKey = localStorage.getItem("myKey")
let myWallet = localStorage.getItem("myWallet")

function App() {

  function generate_new_key() {
    arweave.wallets.generate().then((key) => {
      console.log(key);
      // {
      //     "kty": "RSA",
      //     "n": "3WquzP5IVTIsv3XYJjfw5L-t4X34WoWHwOuxb9V8w...",
      //     "e": ...
      myWallet = get_key_address(key)
      localStorage.setItem("myKey", JSON.stringify(key))

      console.log(localStorage.getItem("myKey"))
      console.log(localStorage.getItem("myWallet"))
    });
  }

  function get_key_address(key) {
    arweave.wallets.jwkToAddress(key).then((address) => {
      console.log(address);
      localStorage.setItem("myWallet", JSON.stringify(address))
      //1seRanklLU_1VTGkEk7P0xAwMJfA7owA1JHW5KyZKlY
      return address
    });

  }

  function get_address_balance() {
    // to go on experiment, I set address as my own wallet address
    // you can get some ARs to access: https://faucet.arweave.net/
    // or buy from DEX
    let address = 'JQ88jkvNSBGKDZZErz2cekh5mA9W3wUGba6YnqcT6p0'
    arweave.wallets.getBalance(address).then((balance) => {
      let winston = balance;
      let ar = arweave.ar.winstonToAr(balance);

      console.log(winston);
      //125213858712

      console.log(ar);
      //0.125213858712
    });
  }

  const handleGetWallet = () => {
    // const handleGetWallet = async () => {    
    if (!myWallet) {
      generate_new_key()
    } else {
      console.log(myWallet)
      document.getElementById('walletAddress').innerText = "Your wallet address: " + myWallet
    }

  }


  return (
    <div className="App">
      <div className="App-header">
        Arweave Demo 1
        <Button onClick={handleGetWallet}>{myWallet ? "Wallet OK" : "No Wallet"}</Button><br />
        <Button onClick={handleGetWallet}>Generate a new Wallet</Button><br />
        <Button onClick={() => get_address_balance()}>get a Wallet balance</Button><br />
        <Button type="primary" onClick={() => openNotification('bottomRight')}></Button>
        <i id="walletAddress"></i>
      </div>
    </div>
  );

}

export default App;
