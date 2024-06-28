const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
  const provider = new ethers.WebSocketProvider(`wss://sepolia.infura.io/ws/v3/${process.env.INFURA_ID}`);

  function limitRPCRequest(fn, delay) {
    let timer;
    return function(){
        if(!timer) {
            fn.call(this, ...arguments)
            timer = setTimeout(()=>{
                clearTimeout(timer)
                timer = null
            },delay)
        }
    }
  }

    console.log("begin to listen to pending transactions")
    let j = 0
    var finishFlag = false
    provider.on("pending", limitRPCRequest(async (txHash) => {
        if (txHash && j <= 20) {
            // get the detail of transactions
            let tx = await provider.getTransaction(txHash);
            console.log(`[${(new Date).toLocaleTimeString()}] : ${txHash}`);
            console.log(tx);
            j++
        }
    }, 1000));

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()