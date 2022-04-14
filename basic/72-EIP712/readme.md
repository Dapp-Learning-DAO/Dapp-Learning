## 使用步骤

### web3.js

```js
//使用web3.js和eth-sig-util生成签名
import Web3 from "web3";
var sigUtil = require("eth-sig-util")

const typedData = {
		//定义数据格式
        types: {
          //固定格式,不要动,并且字段一个都不能少
          //name:contract name
          //vaersion:版本号,如1.0随意
          //chainId:当前链chainId
          //verifyingContract:合约地址
          EIP712Domain: [
            {name: 'name', type: 'string'},
            {name: 'version', type: 'string'},
            {name: 'chainId', type: 'uint256' },
            {name: 'verifyingContract', type: 'address' },
          ],
          //自定义自己业务的数据格式
          Mail: [
            {name: 'from', type: 'address'},
            {name: 'to', type: 'address'},
            {name: 'value', type: 'uint256'},
          ],
        },
  		//上面定义的数据格式具体内容
        domain: {
          name: 'Demo',
          version: '1.0',
          chainId:'1',
          verifyingContract:'0xf8e81D47203A594245E36C48e151709F0C19fBe8'
        },
        primaryType: 'Mail',
  		//具体的业务字段,需要和上面的Mail格式对应
        message: {
          from: "0xE3a463d743F762D538031BAD3f1E748BB41f96ec",
          to: "0x39Ef50bd29Ae125FE10C6a909E42e1C6a94Dde29",
          value: 1234234145789,
        },
      }
	  //生成签名 privateKey 是钱包账户的秘钥
      var privateKeyHex = Buffer.from(privateKey, 'hex')
      var signature = sigUtil.signTypedData_v4(privateKeyHex, {data: typedData})
}
```



### solidity验签

使用OpenZeppelin提供的draft-EIP712.sol验签

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/cryptography/ECDSA.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/cryptography/draft-EIP712.sol";

contract MyContract is EIP712 {
   	
    constructor(string memory name, string memory version) EIP712(name, version) {}
    
 	//生成签名的业务参数和生成的签名
    function recoverV4(
        address from,
        address to,
        uint256 value,
        bytes memory signature
    ) public view returns (address) {
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
        //需要和js中的type中业务的数据格式对应
        keccak256("Mail(address from,address to,uint256 value)"),
           from,
            to,
            value
        )));
        return ECDSA.recover(digest, signature);
    }
}
```

