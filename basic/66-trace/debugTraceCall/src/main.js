const {ethers} = require('ethers');
const BigNumber = ethers.BigNumber;
require('dotenv').config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_POINT);
    //模拟执行一笔ERC20的转账
    //交易见https://etherscan.io/tx/0x867967c8a883daa070fdeafebc571b756bb60b45561962438026124bbd8920bf

    const args =     [
        //https://www.quicknode.com/docs/ethereum/eth_call
        {
        "from":"0x4fec0c5711acaf31c68fc1655b9551bbd816f638",
        "to":"0x6b175474e89094c44da98b954eedeac495271d0f",
        "gas":BigNumber.from("35065").toHexString(),
        gasprice: "0x38dab496f",
        "data":"0xa9059cbb0000000000000000000000008eb871bbb6f754a04bca23881a7d25a30aad3f2300000000000000000000000000000000000000000000000ad78ebc5ac6200000"
        },
        BigNumber.from("16454667").toHexString(),//should be mined block - 1
        {tracer: "4byteTracer",diffMode: false}
    ];
    const response = await provider.send("debug_traceCall",args);
    console.log(response);
}

main();

// {
//     "jsonrpc": "2.0",
//     "id": 0,
//     "result": {
//       "0x6b175474e89094c44da98b954eedeac495271d0f": {
//         "balance": "0x0",
//         "code": "0x6080....",
//         "nonce": 1,
//         "storage": {
//           "0x634f8a1a4aff932fc646443264e0e0e45cee2d9dfb84db5de450cfb0331b7949": "0x0000000000000000000000000000000000000000000003708623aa138175f205",
//           "0xf02f5385b52432c1a270c20c346d380219f286755cbd16bede4ce0fb454a4722": "0x000000000000000000000000000000000000000000008176653f38776971a85b"
//         }
//       },
//       "0xd3561da2bfcac843494854f7de1af98a3962925f": {
//         "balance": "0xe10720fc1311605c",
//         "nonce": 428
//       },
//       "0xfeebabe6b0418ec13b30aadf129f5dcdd4f70cea": {
//         "balance": "0x2ab283d3d01fc2fa",
//         "nonce": 23036
//       }
//     }
//   }

//矿工