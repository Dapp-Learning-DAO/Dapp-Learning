## Genosis Safe简介

![image20210827195813096.png](https://img.learnblockchain.cn/attachments/2021/09/ncWkMkb5613bff2dbdc1a.png)

Genosis Safe简单来讲是一个多签钱包，它允许多个账户对同一笔交易进行签名，实现账户资金的安全管理。主要的应用有如下三个场景：

1. 公司和合约可以安全地持有他们的资金，并要求大多数所有者接受转移资金。所以没有一个所有者可以带着钱跑。
2. 公司可以在大多数所有者的共识下执行敏感交易。
3. 个人可以使用multisig来拥有钥匙的冗余度。多重认证的一个特性是，如果你丢失了一把钥匙，你可以用剩下的两把钥匙恢复钱包。

## 业务逻辑分析：

Genosis Safe的主要业务逻辑是组合多个用户（可以是EOA，也可以是合约），多个用户同时对一笔交易进行签名，签名验证成功后，执行交易并扣除相应的Gas费用，将剩余Gas返回给设定的refund账户。用户可以加载多个模块，通过不同的模块对多签钱包的行为进行限制。

### EIP712:

$$
hashStruct(S)=keccak256(abi.encode(typeHash,encodeData(S)))\\
typeHash=keccak256(encodeType(typeOf(S)))
$$

EIP712中定义的结构体：

```js
EIP712Domain(uint256 chainId,address verifyingContract)
SafeTx(address to,uint256 value,bytes data,uint8 operation,uint256 safeTxGas,uint256 baseGas,uint256 gasPrice,address gasToken,address refundReceiver,uint256 nonce)
```

EIP712结构体1：EIP712Domain

```assembly
首先是encodeType 
bytes32 DOMAIN_SEPARATOR_TYPEHASH = keccak256("EIP712Domain(uint256 chainId,address verifyingContract)");
然后是encodeData
uint chain_id;
assembly{
	chain_id := chainid()
}
bytes memory encodeData = abi.encode(
                            DOMAIN_SEPARATOR_TYPEHASH,
                            chain_id,
                            address(this));
最后是得到DomainSeparatorHash
bytes32 DomainSeparatorHash = keccak256(encodeData);
```

EIP712结构体2：SafeTx

```assembly
首先是encodeType:
bytes32 SafeTx_TYPEHASH = keccak256("SafeTx(address to,uint256 value,bytes data,uint8 operation,uint256 safeTxGas,uint256 baseGas,uint256 gasPrice,address gasToken,address refundReceiver,uint256 nonce)");
然后是encodeData:
注意到data中由bytes类型，针对这种不固定长度的数据类型，编码时直接取其hash值作为编码数据
bytes memory SafeTx_encodeData = abi.encode(
	SafeTx_TYPEHASH,
	address(to),
	uint256(value),
	keccak256(data),
	uint256(uint8(operation)),
	uint256(safeTxGas),
	uint256(baseGas),
	uint256(gasPrice),
	address(gasToken),
	address(refundReceiver),
	uint256(nonce)
)
最后是得到SafeTxHash
bytes32 SafeTxHash = keccak256(SafeTx_encodeData);
```

EIP712得到的结构化编码信息如下：

```assembly
abi.encodePacked(bytes1(0x19),bytes1(0x01),DomainSeparatorHash,SafeTxHash);
```

### 签名的三种类型：

在GnosisSafe中，所有的签名都编码为{bytes32 r}{btyes32 s}{uint8 v}，共计65个bytes

- 来自EOA的ECDSA签名:  V值范围为(26,31), 若V值大于30，说明需要减去4以适配eth_sign方式

```assembly
EOA的签名由三部分组成，R,S,v. 其中V值在EIP-155后的定义为：由{0,1}+27 -> {0,1} + chian_id*2 + 35
r: 0xbde0b9f486b1960454e326375d0b1680243e031fd4fb3f070d9a3ef9871ccfd5
s: 0x7d1a653cffb6321f889169f08e548684e005f2b0c3a6c06fba4c4a68f5e00624 
v: 0x1c
=> 编码后的签名为：
bde0b9f486b1960454e326375d0b1680243e031fd4fb3f070d9a3ef9871ccfd5
7d1a653cffb6321f889169f08e548684e005f2b0c3a6c06fba4c4a68f5e00624
1c
```

签名验证：

```js
if v < 30: (v={0,1}+27)
addr = ecrecover(dataHash,v,r,s)
if V > 30: (v={0,1}+27+4)
newDataHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32",dataHash))
addr = ecrecover(newDataHash,v-4,r,s)
require(Owners[addr]!=address(0))
```

- 来自合约的EIP-1271签名

```assembly
EIP-1271签名是利用智能合约对一笔交易进行签名，其会返回一个验证签名的地址以及需要验证的动态数组bytes, 故在GnosisSafe的编码规则中，让V值为0，r值为验证签名的地址，v值为动态数组bytes的offset。类似于abi编码
动态数组bytes的内容为：
bytes public data = new bytes();
data.push(0xdeadbeaf)
则data中的内容为：
{bytes32 offset}{bytes32 length}{bytes data}
r: 0000000000000000000000000000000000000000000000000000000000000001 //验证合约地址
s: 00000000000000000000000000000000000000000000000000000000000000c3 //bytes offset
v: 00
=>编码后的签名为：
0000000000000000000000000000000000000000000000000000000000000001
00000000000000000000000000000000000000000000000000000000000000c3
00
0000000000000000000000000000000000000000000000000000000000000008
00000000000000000000000000000000000000000000000000000000deadbeaf
```

签名验证：

```javascript
ISignatureValidator(addr).isValidSignature(data,sig) == EIP1271_MAGIC_VALUE
```

- 预签名：

```assembly
预签名中设计V值为1，预签名用于GnosisSafe内部维护的map(address=>map(bytes32=>bool))，来确认某个账户对一笔交易哈希是否以及预先签名。为统一编码，这里的签名信息编码如下：
r: 0000000000000000000000000000000000000000000000000000000000000002 //该比交易哈希的验证者地址
s: 0000000000000000000000000000000000000000000000000000000000000000 //占位符
v: 01
=>
0000000000000000000000000000000000000000000000000000000000000002
0000000000000000000000000000000000000000000000000000000000000000
01
```

签名验证：

```js
addr = r
msg.sender == addr || approveHashes[addr][dataHash] == uint(true)
```

revert语法：

```assembly
The provided string will be abi-encoded as if it were a call to a function Error(string). In the above example, revert("Not enough Ether provided."); will cause the following hexadecimal data be set as error return data:
0x08c379a0                                                         // Function selector for Error(string)
0x0000000000000000000000000000000000000000000000000000000000000020 // Data offset
0x000000000000000000000000000000000000000000000000000000000000001a // String length
0x4e6f7420656e6f7567682045746865722070726f76696465642e000000000000 // String data
```

### 链上签名

GnosisSafe提出了一个名为链上签名的解决方案，其要解决的问题是智能合约没有私钥，无法对一笔交易签名。它的解决方案是在状态合约中维护一个全局变量：

```javascript
mapping(address => mapping(bytes32 => uint256)) public approvedHashes;
```

然后该多签钱包的一个Owner通过调用合约的`approveHash`方法，传递要签名的交易hash，来实现链上对一笔交易签名。

```
function approveHash(bytes32 hashToApprove) external {
	require(owners[msg.sender] != 0, "GnosisSafe/approveHash msg.sender is not an owner");
	approveHashes[msg.sender][hashToApprove] = uint256(1);
}
```

### 链下签名链上验证

这是GnosisSafe中最常用的用法，多个用户同时对一笔交易签名后，组合得到的签名数据发送给链上，让链上对其验证。链上验证的逻辑主要在`execTransaction`方法中执行。

#### 链下签名过程：

##### 普通的EOA交易签名过程

对于如下一笔交易数据：

```js
const tx2 = {
    nonce:9,
    gasPrice: "0x"+(20000000000).toString(16),//"0x4A817C800", 
    gasLimit: "0x"+(21000).toString(16),//"0x5208",
    to: '0x3535353535353535353535353535353535353535',
    value: ethers.utils.parseEther("1.0"),
    data: '',
    chainId: 1,
};
```

第一步：对其RLP编码

$$
RLP([nonce,gasprice,gaslimit,to,value,data,chainid,0,0])
$$

```assembly
nonce: 9, => 0x09 => len=1
gasPrice: 0x4A817C800,//20*10**9, => 0x8504A817C800 => len=6
gasLimit: 0x5208,//21000, => 0x825208 => len=3
to: 0x3535353535353535353535353535353535353535, => 0x943535353535353535353535353535353535353535 => len=21
value: 0xDE0B6B3A7640000 //1 ether => 0x880DE0B6B3A7640000 => len=9
data: "", => 0x80 => len=1
v: 1 => 0x01 => len=1
s: "" => 0x80 => len=1
v: "" => 0x80 => len=1
则RLP编码后签名前的交易为：
上述字段组成了一个列表，RLP在对列表编码得：192+44=0xEC
await ethers.utils.serializeTransaction(tx2) = 
0xEC098504A817C800825208943535353535353535353535353535353535353535880DE0B6B3A764000080018080
```

第二步：得到未签名交易Hash

```assembly
keccak256(0xEC098504A817C800825208943535353535353535353535353535353535353535880DE0B6B3A764000080018080)
=
0xdaf5a779ae972f972197303d7b574746c7ef83eadac0f2791ad23db92e4c8e53
```

第三步：将未签名的交易哈希签名

```js
签名的私钥：0x4646464646464646464646464646464646464646464646464646464646464646
则Alice的地址为：
const alice = await new ethers.Wallet("0x4646464646464646464646464646464646464646464646464646464646464646")
alice.address = 0x9d8A62f656a8d1615C1294fd71e9CFb3E4855A4F
得到的
r: 18515461264373351373200002665853028612451056578545711640558177340181847433846=>
s: 46948507304638947509940763649030358759909902576025900602547168820602576006531
v: 37
转换为对应的16进制为：
ethers.utils.hexlify(ethers.BigNumber.from("18515461264373351373200002665853028612451056578545711640558177340181847433846"))
r: 0x28ef61340bd939bc2195fe537567866003e1a15d3c71ff63e1590620aa636276
s: 0x67cbe9d8997f761aecb703304b3800ccf555c9f3dc64214b297fb1966a3b6d83
v: 0x25
则对应的tx变为：
const tx3 = {
    nonce:9,
    gasPrice: ethers.utils.hexlify(ethers.BigNumber.from("20000000000")),//"0x4A817C800", 
    gasLimit: ethers.utils.hexlify(ethers.BigNumber.from("21000")),//"0x5208",
    to: '0x3535353535353535353535353535353535353535',
    value: ethers.utils.parseEther("1.0"),
    data: '',
    v: 0x25,
    r: 0x28ef61340bd939bc2195fe537567866003e1a15d3c71ff63e1590620aa636276,
    s: 0x67cbe9d8997f761aecb703304b3800ccf555c9f3dc64214b297fb1966a3b6d83
};
故签名后的数据进行RLP编码后为：
await alice.signTransaction(tx2)=
0xf86c098504a817c800825208943535353535353535353535353535353535353535880de0b6b3a76400008025a028ef61340bd939bc2195fe537567866003e1a15d3c71ff63e1590620aa636276a067cbe9d8997f761aecb703304b3800ccf555c9f3dc64214b297fb1966a3b6d83

ethers.utils.RLP.decode("0xf86c098504a817c800825208943535353535353535353535353535353535353535880de0b6b3a76400008025a028ef61340bd939bc2195fe537567866003e1a15d3c71ff63e1590620aa636276a067cbe9d8997f761aecb703304b3800ccf555c9f3dc64214b297fb1966a3b6d83")
[
  '0x09',
  '0x04a817c800',
  '0x5208',
  '0x3535353535353535353535353535353535353535',
  '0x0de0b6b3a7640000',
  '0x',
  '0x25',
  '0x28ef61340bd939bc2195fe537567866003e1a15d3c71ff63e1590620aa636276',
  '0x67cbe9d8997f761aecb703304b3800ccf555c9f3dc64214b297fb1966a3b6d83'
]
```

这是一个EOA账户对该笔交易进行签名得到数据。

##### 预签名交易：

最开始理解presigned message时，会感到困惑。一直在思考按照EIP-712编码后的数据如何和普通的转账类交易混合编码，当重新读了一遍EIP-191后才渐渐理解。其实Presigned message压根就不需要再和普通的转账类交易去混合，它自己本身就是一种已经签名的信息，代表了EOA的意志，智能合约（通常是钱包）只需要验证签名是否正确，然后按照EOA的想法来执行相关的交易就行。预签名交易不遵循RLP编码方式。

EIP-191 签名数据标准：

为了与普通的交易信息区分开，EIP-191定义了presigned message标准。即：

```assembly
0x19 <1 byte version> <version specific data> <data to sign>
```

选择0x19作为开始字段的原因是普通的交易信息采用RLP编码，而RLP编码中的0x19开头只能是代表一个值：0x19本身，无法去对后续信息编码。从而与普通的RLP编码的普通交易区分开。

对于目前的Presigned message来讲，一共有三种不同的实现版本：

| Version Type | EIP     | Desc                         |
| ------------ | ------- | ---------------------------- |
| 0x00         | EIP-191 | Data with intended validator |
| 0x01         | EIP-712 | Structured data              |
| 0x45         | EIP-191 | personal_sign message        |

对于version type = 0x00, <version specific data>中存放的是32位的验证者地址

对于version type = 0x45, 在<data to sign>中，将`\x19Ethereum Signed Message:\n+len(message)`添加到了<data to sign>的前面，然后在进行哈希，签名。

在Gnosis中，我们主要关注version type = 0x01, 即EIP-712的实现：

如业务逻辑分析中指出：Gnosis定义了两个结构体，分别是EIP712Domain和SafeTx。一个作为DomainSeperator存入<version specific data>中，一个作为payload存入<data to sign>数据中。

```js
// const alice = await new ethers.Wallet("0x4646464646464646464646464646464646464646464646464646464646464646");
// alice.address = 0x9d8A62f656a8d1615C1294fd71e9CFb3E4855A4F
let EIP712Domain = {
	chainId: "1",
    verifyingContract: '0x9d8A62f656a8d1615C1294fd71e9CFb3E4855A4F', //alice
}
let SafeTx_types = {
    SafeTx : [
        {name: 'to', type:'address'},
        {name: 'value', type: 'uint256'},
        {name: 'data', type: 'bytes'},
        {name: 'operation', type: 'uint8'},
        {name: 'SafeTxGas', type: 'uint256'},
        {name: 'baseGas', type: 'uint256'},
        {name: 'gasPrice', type: 'uint256'},
        {name: 'gasToken', type: 'address'},
        {name: 'refundReceiver', type: 'address'},
        {name: 'nonce', type: 'uint256'}
    ]
}
let SafeTx_values = {
    "to": '0x0000000000000000000000000000000000000000',
    "value": "1",
    "data": "0xdeadbeaf",
    "operation": "0",
    "SafeTxGas": ethers.utils.hexlify(ethers.BigNumber.from("20000000000")), //0x04a817c800
    "baseGas": ethers.utils.hexlify(ethers.BigNumber.from("20000000000")), //0x04a817c800
    "gasPrice": '0',
    "gasToken": '0x0000000000000000000000000000000000000000',
    "refundReceiver": "0x0000000000000000000000000000000000000000",
    "nonce": "1",
}
哈希域名：
keccak256(abi.encode(keccak256("EIP712Domain(uint256 chainId,address verifyingContract)"),uint256(1),uint256(uint160(address(0x9d8A62f656a8d1615C1294fd71e9CFb3E4855A4F)))))
=>
0x47e79534a245952e8b16893a336b85a3d9ea9fa8c573f3d803afb92a79469218
  0000000000000000000000000000000000000000000000000000000000000001
  0000000000000000000000009d8A62f656a8d1615C1294fd71e9CFb3E4855A4F

0x98f25862027c897aa0e497eac4a47094fd7b52be9b1bea9bb803916aec0409a2

ethers.utils._TypedDataEncoder.hashDomain(EIP712Domain)
=>
0x98f25862027c897aa0e497eac4a47094fd7b52be9b1bea9bb803916aec0409a2
数值哈希：
keccak256(abi.encode(
	keccak256("SafeTx(address to,uint256 value,bytes data,uint8 operation,uint256 safeTxGas,uint256 baseGas,uint256 gasPrice,address gasToken,address refundReceiver,uint256 nonce)"),
    uint256(uint160(address(0x0000000000000000000000000000000000000000))),
    uint256(1),
    keccak256(bytes(0xdeadbeaf)),
    uint256(uint8(0)),
    uint256(0x04a817c800),
    uint256(0x04a817c800),
    uint256(0),
    uint256(uint160(address(0x0000000000000000000000000000000000000000))),
    uint256(uint160(address(0x0000000000000000000000000000000000000000))),
    uint256(1)
))
=>
0xbb8310d486368db6bd6f849402fdd73ad53d316b5a4b2644ad6efe0f941286d8
0000000000000000000000000000000000000000000000000000000000000000
0000000000000000000000000000000000000000000000000000000000000001
b2245a4923cdc7f56016b95b14f0fc5f5b3cd64ee68e68c3da3d8f4a67da3752
0000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000004a817c800
00000000000000000000000000000000000000000000000000000004a817c800
0000000000000000000000000000000000000000000000000000000000000000
0000000000000000000000000000000000000000000000000000000000000000
0000000000000000000000000000000000000000000000000000000000000000
0000000000000000000000000000000000000000000000000000000000000001
=>
aad21e462218b5aa0cbcf79b0a35aedb0cb5284c70521a35065681c3641cd2c0
整体编码：
ethers.utils._TypedDataEncoder.encode(EIP712Domain,SafeTx_types,SafeTx_values) 
=>
abi.encodePacked(bytes1(0x19),bytes1(0x01),)
0x19 //EIP-191定义的首字符为0x19
  01 //EIP-191定义的version type 01
  98f25862027c897aa0e497eac4a47094fd7b52be9b1bea9bb803916aec0409a2 //EIP-191定义的<version specific data> => hashDomain
  aad21e462218b5aa0cbcf79b0a35aedb0cb5284c70521a35065681c3641cd2c0 //EIP-191定义的<data to sign> 数据的哈希值
```

上面通过EIP-721的编码后，需要进行哈希，然后在进行签名得到r,s,v

```js
ethers.utils._TypedDataEncoder.hash(EIP712Domain,SafeTx_types,SafeTx_values)
=>
0x0fda8d4f1c154fd9bb5139f4d0dd1eb327fd952ce7fe600be00bbf7486b91d6a
```

利用alice账户对哈希值进行签名，这样就得到了alice用户对于message的一个签名：

```
const alice = await new ethers.Wallet('0x4646464646464646464646464646464646464646464646464646464646464646')
await alice.signMessage(ethers.utils.arrayify("0x0fda8d4f1c154fd9bb5139f4d0dd1eb327fd952ce7fe600be00bbf7486b91d6a"))
=>
0xb2ea252c31e822cedad8bdd1656c713b96f61345459ca47e14925f0f6e345ac4 //r
  070c60d290a0acac4ebd44550b71dd032a99608dc770bd4a7295c235c5178aca //s
  1c														  //v
```

当有多个EOA账户对该message进行签名时，会将多个交易的签名信息，即r,s,v值按照第一种签名编码方式进行编码，{bytes32 r}{bytes32 v}{uint8 v}，最后得到一个bytes类型的数据Signature.

#### 链上验证过程

前面对链下的签名过程进行了分析，其实质是综合了EIP-191,EIP-155,EIP-712等签名规范。这个章节部分，我们将对Gnosis的链上验证过程进行讨论。
GnosisSafe的链上验证函数主要是：`checkNSignatures`, 其函数签名如下：

```js
function checkNSignatures(bytes32 dataHash,bytes memory data, bytes memory signatures, uint256 requiredSignatures) 
	public view{}
```

函数里的主要逻辑是执行一个for循环，在每一个循环内部从sigatures里拿到对应的`r,s,v`值，然后根据它自定义的编码规则中的v值，依次判断签名的有效性。

第一步：拿到sigantures中对应的r,s,v值

由于其编码{bytes32 r}{bytes32 v}{bytes1 v}的编码方式，每一个owner的签名都占据65个bytes。

```assembly
首先拿到owner[i]对应的offset值：
注意bytes memory signatures 指向的是sigantures的数据长度，真正的数据存放位置为: add(signatures,0x20)
这里忽略了EIP-1127的情况，需要在签名情况验证中去处理
uint i; bytes32 r; bytes32 s; uint8 v;
assembly{
	let base_offset := add(signatures, 0x20)
	let owner_i_offset :=  add(base_offset, mul(i, 0x41))
	r := mload(owner_i_offset)
	s := mload(add(owner_i_offset, 0x20))
	v := byte(0, mload(add(owner_i_offset, 0x40)))
}
return r,s,v;
```

第二步：EOA签名情况验证

```js
if (v < 30 && v > 25) {
	address currentOwner = ecrecover(dataHash, v,r,s);
	require(currentOwner == address(alice));
}
```

第三步：EOA签名带personal_sign方法情况验证

```js
if (v > 30) {
	v = v -4;
	bytes memory newDataHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", dataHash));
	address currentOwner = ecrecover(newDataHash,v,r,s);
	require(currentOwner == address(alice));
}
```

第四步：线上签名情况验证

```js
if (v == 1) {
	address currentOwner = address(uint160(uint256(r)));
	require(approvedHashes[currentOwner][dataHash] != 0 || msg.sender == currentOwner);
}
```

第五步：合约签名情况验证

```js
bytes memory contractSignature;
if (v == 0) {
	address currentOwner = address(uint160(uint256(r)));
	assembly{
         let signatures_base := add(sigatures,0x20)
		let sig_len := mload(add(signatures_base, s))
		contractSignature := add(signatures_base, s) //并未跳过长度部分，仍然遵循Solidity规范
	}
	require(IEIP1271SignatureValidator(currentOwner).isValidSignature(data,contractSignature) == EIP1271_MAGIC_VALUE);
}
```