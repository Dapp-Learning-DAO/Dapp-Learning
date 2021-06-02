## 前言
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;本样例演示了 ERC20 合约的基本调用, 让开发者了解 ERC20 合约的基本接口

## 参考文档
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; mocha测试框架：
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;http://www.ruanyifeng.com/blog/2015/12/a-mocha-tutorial-of-examples.html
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;https://pcaaron.github.io/pages/fe/block/improve4.html#%E8%B7%91%E6%B5%8B%E8%AF%95

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;infura不支持sendTransaciton,只支持sendRawTransaction:
  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Infura has not activated the method eth_sendTransaction because this method needs unlocked accounts on the ethereum node. With the example I've provided above will it also work with infura :)
  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;https://ethereum.stackexchange.com/questions/70853/the-method-eth-sendtransaction-does-not-exist-is-not-available-on-infura 

## 代码逻辑
1) 私钥获取
为方便获取，在 sk.txt 中放入的私钥，然后代码自动从中读取

2) ERC20 合约部署
通过 deploy.js 进行部署，样例中链接的测试网为 Kovan, 对应需要使用有 Ether 的账户进行发送


3) 发交易方式
 1 拼装交易
 ```
const tx = newbac.methods.send("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",100000, "fee").encodeABI();

   // Sign Tx with PK
   const createTransaction1 = await web3.eth.accounts.signTransaction(
       {
          to: createReceipt.contractAddress,
          data: tx,
          gas: 8000000,
       },
       account_from.privateKey
   );

   // Send Tx and Wait for Receipt
   const createReceipt1 = await web3.eth.sendSignedTransaction(
       createTransaction1.rawTransaction
   );
```

## 测试流程
1) 安装依赖
```
npm install
```

2) 执行测试
```
node index.js
```