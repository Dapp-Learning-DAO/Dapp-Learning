const {ethers} = require('ethers');
const BigNumber = ethers.BigNumber;
require('dotenv').config();
const {createTracer} = require("./my_tracer");

async function traceCall() {
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
        {tracer: "trigramTracer",diffMode: false}
    ];
    const response = await provider.send("debug_traceCall",args);
    console.log(response);
}

async function traceTransaction() {
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_POINT);
    const resp = await provider.send("debug_traceTransaction",[
        "0x867967c8a883daa070fdeafebc571b756bb60b45561962438026124bbd8920bf",
        {tracer: "prestateTracer"}
    ])
    console.log(resp);
}

async function traceTransactionCustomTx() {
    const tracerBody = getTracerBodyString(createTracer);

    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_POINT);
    const resp = await provider.send("debug_traceTransaction",[
        "0x867967c8a883daa070fdeafebc571b756bb60b45561962438026124bbd8920bf",
        {tracer: tracerBody,
        tracerConfig: {targetOpcode: 666}
        }
    ])
    console.log(resp);
}


function getTracerBodyString (func) {
    const tracerFunc = func.toString()
    // function must return a plain object:
    //  function xyz() { return {...}; }
    const regexp = /function \w+\s*\(\s*\)\s*{\s*return\s*(\{[\s\S]+\});?\s*\}\s*$/ // (\{[\s\S]+\}); \} $/
    const match = tracerFunc.match(regexp)
    if (match == null) {
      throw new Error('Not a simple method returning value')
    }
    return match[1]
  }

  traceTransaction();



//矿工