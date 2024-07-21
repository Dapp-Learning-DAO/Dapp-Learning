# GnosisSafe - 合约结构分析

上篇文章简单分析`Gnosis` Safe中的部分业务逻辑，主要是链下签名与链上验证的逻辑，关于方法执行，Gas费用扣减等并未涉及到。因为主要是目前也暂时用不到那一块。这一篇文章主要是分析下`GnosisSafe`的合约结构。代码以最新release的v1.3.0为准，地址为https://rinkeby.etherscan.io/address/0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552#code

`GnosisSafe`是一个多签钱包，在项目中一大优点就是它的合约架构设计，实现可插拔，可配置的功能。
![image20210828143026536.png](https://img.learnblockchain.cn/attachments/2021/09/RsixiyJY614757ae3c66f.png)

## 可插拔模块设计

可插拔模块，即每个模块都可以为合约增加新的功能。在这种模式中，主合约提供了一套核心的不可变的功能，并允许新的模块被注册。这些模块增加了新的功能，可以调用核心合约。这种模式在钱包中最常见，如`GnosisSafe`或`InstaDapp`。用户可以选择在自己的钱包中添加新的模块，然后每次调用钱包合约都要求执行特定模块的特定功能。

请记住，这种模式要求核心合约是没有错误的。任何关于模块管理本身的错误都不能通过在这种方案中添加新模块来修补。另外，根据实施情况，新模块可能有权通过使用DELEGATECALLs代表核心合约运行任何代码，所以也应该仔细审查。

`ModuleManager`合约里比较有意思的一点是它使用了一个`map(address=>address)`形成的链表将所有的Modules串起来，并设置了一个哨兵模块`address(1)`作为链表头部。

在网站上添加Module的步骤可以参考如下链接：https://help.gnosis-safe.io/en/articles/4934427-add-a-module

### 模块管理合约-`ModuleManager`

从合约代码中，我们可以看到`ModuleManager`主要提供了如下几种功能：

```js
哨兵：
address internal constant SENTINEL_MODULES = address(0x01);
```

`setupModules` -通过`delegateCall`的方式初始化模块

```js
function setupModules(address to, bytes memory data) internal {
	//确认哨兵在链表尾部，即该链表为空链表
    require(modules[SENTINEL_MODULES] == address(0));
    //把哨兵指向自己
    modules[SENTINEL_MODULES] = SENTINEL_MODULES;
    //对to地址的模块进行初始化
    bool success;
    assembly {
        success := delegatecall(gas(),to,add(data,0x20),mload(data),0,0)
    }
    require(success);
}
```

`enableModule` - 使能该模块, 实际上是添加该模块到链表里

```js
//sentinel -> A <-> A
function enableModule(address module) public authorized {
    //要求该module不能重复添加。如果该module在链表尾部，则该module应该指向自己
    require(modules[module] == address(0));
    //将该module-> A <-> A
    modules[module] = modules[SENTINEL_MODULES];
    //将哨兵重新指向module：sentinel -> module -> A <-> A
    modules[SENTINEL_MODULES] = module;
}
```

`disableModule` - 废弃该模块, 将该module移除链表

```js
//sentinel -> prevModule -> module -> B <-> B
function disableModule(address prevModule, address module) public authorized {
    //要求要废除的module和该module前的preModule都在链表中,且prevModule->module
    require(modules[module] != address(0) && modules[prevModule] != address[0] && modules[prevModule] = module);
    //sentinel -> prevModule -> B <-> B
    modules[prevModule] = modules[module];
    //module -> address(0)
    modules[module] = address(0);
}
```

`getModulesPaginated` - 拿到所有的模块列表

```js
function getModulesPaginated(address start, uint256 pageSize) external view returns (address[] memory array, address next) {
    array = new address[](pageSize);
    //遍历链表，不包括哨兵
    address currentModule = modules[SENTINEL_MODULES];
    uint moduleCount = 0;
    while (currentModule != address(0) && currentModule != SENTINEL_MODULES && moduleCount < pageSize) {
        array[moduleCount] = currentModule;
        moduleCount += 1;
        currentModule = modules[currentModule];      
    }
    next = currentModule;
    //设置正确的array大小
    assembly{
        mstore(array, moduleCount)
    }
}
```

`execTransactionFromModuleReturnData `- 通过模块执行方法

```js
function execTransactionFromModuleReturnData(
        address to,
        uint256 value,
        bytes memory data,
        Enum.Operation operation
    ) public returns (bool success, bytes memory returnData) {
    //这里不能直接把数据写到reutrnData这一个内存数组里面，还是要从freepointer处开始
	if (operation == Enum.Operation.Call) {
        assembly{
            success := call(gas(),to,value,add(data,0x20),mload(data),0,0)
            let free_ptr := mload(0x40)
            let returndatasize_ := returndatasize()
            //更新0x40的值
            mstore(0x40, add(free_ptr,add(0x20,returndatasize_)))
            mstore(free_ptr, returndatasize_)
            
            returndatacopy(add(free_ptr,0x20),0,returndatasize_)
            returnData = free_ptr
        }
    } else if (operation == Enum.Operation.DelegateCall) {
        assembly{
            success := delegatecall(gas(),to,add(data,0x20),mload(data),0,0)
            let free_ptr := mload(0x40)
            let returndatasize_ := returndatasize()
            //更新0x40的值
            mstore(0x40, add(free_ptr,add(0x20,returndatasize_)))
            mstore(free_ptr, returndatasize_)   
            returndatacopy(add(free_ptr,0x20),0,returndatasize_)
            returnData = free_ptr
        }
    }
}
```

### 思考1：多签钱包的主合约应该如何调用模块方法？

我们注意到主合约：`GnosisSafe`直接继承了`ModuleManager`，而`ModuleManager`中列出的方法都是`public/external`，说明用户可以直接访问模块中的方法，不需要多签？

### 思考2：模块方法中是否要进行权限认证？只允许多签钱包的主合约直接调用

即是否需要在模块合约中，都保存主合约的地址，并在公开的方法中，添加一个modifier：

```assembly
modifier GnosisSafeOnly() {
	//proxy ->delegatecall-> GnosisSafe ->call-> module => msg.sender == address(proxy)
	//proxy ->delegatecall-> GnosisSafe ->delegatecall-> module => msg.sender == address(proxy) // 对吗？
	require( 
		msg.sender == address(GnosisSafeProxy)
        );
	_;
}
```

```js
modifier authorized() {
    require(msg.sender == address(manager), "Method can only be called from manager");
    _;
}
```

### 思考3：代理合约通过`delegatecall`来访问主合约，而调用主合约中的执行模块方法时，可以选择用call来执行传入的to地址上的方法，那么`delegatecall`的上下文环境里，再使用call，最后它的状态变化发生在哪里？是代理合约里呢还是call中的to地址上？

问题实质是`msg.sender`分别是谁：

```assembly
//proxy ->delegatecall-> GnosisSafe ->call-> module => msg.sender == address(proxy)
//proxy ->delegatecall-> GnosisSafe ->delegatecall-> module => msg.sender == address(proxy) // 对吗？
```

## 工厂代理合约

工厂合约地址：

https://rinkeby.etherscan.io/address/0xa6b71e26c5e0845f74c812102ca7114b6a896ab2#code

部署后得到的代理合约地址：

https://rinkeby.etherscan.io/address/0xee52992d1ccc6338f1b83880da210a0b9fe7463f#code

创建代理合约的交易哈希

https://rinkeby.etherscan.io/tx/0x37b0091794de7862e5d0b9d470a4c454c74f8954e964280d7d2ad0d71dd45f71
![image20210829101545856.png](https://img.learnblockchain.cn/attachments/2021/09/HWkd99YN61475789d9d65.png)

分析工厂代理合约前的创建交易，可以从交易侧了解到合约的一个创建过程。

```assembly
Function: createProxyWithNonce(address _singleton, bytes initializer, uint256 saltNonce)

MethodID: 0x1688f0b9
[0]:  000000000000000000000000d9db270c1b5e3bd161e8c8503c55ceabee709552  //_singleton
[20]:  0000000000000000000000000000000000000000000000000000000000000060 //offset 初始化数据
[40]:  0000000000000000000000000000000000000000000000000000017b8b872419 //saltNonce
[60]:  00000000000000000000000000000000000000000000000000000000000001a4 //length 
[80]:  b63e800d 
//keccak256("setup(address[],uint256,address,bytes,address,address,uint256,address)") 0xb63e800d
	   0000000000000000000000000000000000000000000000000000000000000100  //_owners offset
[20]:  0000000000000000000000000000000000000000000000000000000000000002  //_threshold=2
[40]:  0000000000000000000000000000000000000000000000000000000000000000  //to = address(0)
[60]:  0000000000000000000000000000000000000000000000000000000000000180  //data offset
[80]: 000000000000000000000000f48f2b2d2a534e402487b3ee7c18c33aec0fe5e4  //fallbackHandler
[a0]: 0000000000000000000000000000000000000000000000000000000000000000  //paymentToken
[100]: 0000000000000000000000000000000000000000000000000000000000000000  //payment
[120]: 0000000000000000000000000000000000000000000000000000000000000000  //paymentReceiver
[140]: 0000000000000000000000000000000000000000000000000000000000000003  //owners len
[160]: 000000000000000000000000efe36830aad8a001eed8f79b544d798f4b49c2e5  //owner_1
[180]: 000000000000000000000000664254cec2c0a498151d80ff8637b568b7a7dacc  //owner_2
[1a0]: 000000000000000000000000f9980317b1dc17a0f9d96a003a2b6369e61659f9  //owner_3
[1c0]: 0000000000000000000000000000000000000000000000000000000000000000  //len data
[1e0]: 00000000000000000000000000000000000000000000000000000000

//keccak256("setup(address[],uint256,address,bytes,address,address,uint256,address)") 0xb63e800d
```

```js
function createProxyWithNonce(address _singleton,bytes memory initializer,uint256 saltNonce) {
	//使用create2创建一个代理合约
    bytes32 salt = keccak256(abi.encodePacked(keccak256(initializer), saltNonce));
    //GnosisSafe.contructor(address _singleton) 编码时初始化时，需要将初始化的参数编码到creationCode后面
    bytes memory deploymentData = abi.encodePacked(type(GnosisSafeProxy).creationCode, uint256(uint160(_singleton)));
    address proxy;
    assembly{
        proxy := create2(0,add(deploymentData,0x20),mload(deploymentData),salt)
    }
     //使用call调用setup进行初始化, call成功会返回1，call失败会返回0
    assembly{
        let success := call(gas(),proxy,0,add(initializer,0x20),mload(initializer),0,0)
        if (eq(success,0x0)) {
            let ptr := mload(0x40)
            returndatacopy(ptr,0,returndatasize())
            revert(ptr,returndatasize())
        }
    }
}
```

简单来讲，`GnosisSafeProxyFactory`合约作为一个工厂合约，为每一个多签钱包创建一个`GnosisSafeProxy`的代理合约，所有的数据都储存在代理合约上。然后代理合约`GnosisSafeProxy`将所有的函数调用都通过`delegatecall`的方式远程调用`GnosisSafe`合约。

### 注意点1： 代理合约的构造函数有参数，工厂合约如何创建

在代理合约`GnosisSafeProxy`里面，其构造函数如下：

```js
constructor(address _singleton) {
    require(_singleton != address(0), "Invalid singleton address provided");
    singleton = _singleton;
}
```

可以看到在构造函数里有一个参数`address _singleton`，作为工厂合约，最简单的生产一个Proxy的方法如下：

```js
function createProxy(address singleton, bytes memory data) public returns (GnosisSafeProxy proxy) {
	proxy = new GnosisSafeProxy(singleton);
    //初始化
	(bool success, bytes memory res) = address(proxy).call(data);
	require(success, "GnosisSafeProxyFactory/createProxy init fail");
}
```

在上面的创建Proxy合约的过程中，其实质是调用了create这一opcode。又因为create这一个opcode的创建合约的地址仅与Factory合约的地址和nonce有关，故导致钱包地址可被人手动推算出来。导致任何通过Factory合约这一方法创建钱包的人的钱包地址都可以被推断，出现安全隐患。

<!-- $$
\begin{eqnarray}
a & \equiv & A(s, \boldsymbol{\sigma}[s]_{\mathrm{n}} - 1, \zeta, \mathbf{i}) \\
\label{eq:new-address} A(s, n, \zeta, \mathbf{i}) & \equiv & \mathcal{B}_{96..255}\Big(\mathtt{KEC}\big(B(s, n, \zeta, \mathbf{i})\big)\Big) \\
B(s, n, \zeta, \mathbf{i}) & \equiv & \begin{cases}
\mathtt{RLP}\big(\;(s, n)\;\big) & \text{if}\ \zeta = \varnothing \\
(255) \cdot s \cdot \zeta \cdot \mathtt{KEC}(\mathbf{i}) & \text{otherwise}
\end{cases}
\end{eqnarray}
$$ -->

<math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><mtable displaystyle="true" columnalign="right center left" columnspacing="0 thickmathspace" rowspacing="3pt"><mtr><mtd><mi>a</mi></mtd><mtd><mi></mi><mo>≡</mo></mtd><mtd><mi>A</mi><mo stretchy="false">(</mo><mi>s</mi><mo>,</mo><mi mathvariant="bold-italic">σ</mi><mo stretchy="false">[</mo><mi>s</mi><msub><mo stretchy="false">]</mo><mrow><mrow><mi mathvariant="normal">n</mi></mrow></mrow></msub><mo>−</mo><mn>1</mn><mo>,</mo><mi>ζ</mi><mo>,</mo><mrow><mi mathvariant="bold">i</mi></mrow><mo stretchy="false">)</mo></mtd></mtr><mtr><mtd><mi>A</mi><mo stretchy="false">(</mo><mi>s</mi><mo>,</mo><mi>n</mi><mo>,</mo><mi>ζ</mi><mo>,</mo><mrow><mi mathvariant="bold">i</mi></mrow><mo stretchy="false">)</mo></mtd><mtd><mi></mi><mo>≡</mo></mtd><mtd><msub><mrow><mi data-mjx-variant="-tex-calligraphic" mathvariant="script">B</mi></mrow><mrow><mn>96.</mn><mn>.255</mn></mrow></msub><mrow data-mjx-texclass="ORD"><mo minsize="1.623em" maxsize="1.623em">(</mo></mrow><mrow><mi mathvariant="monospace">K</mi><mi mathvariant="monospace">E</mi><mi mathvariant="monospace">C</mi></mrow><mrow data-mjx-texclass="ORD"><mo minsize="1.2em" maxsize="1.2em">(</mo></mrow><mi>B</mi><mo stretchy="false">(</mo><mi>s</mi><mo>,</mo><mi>n</mi><mo>,</mo><mi>ζ</mi><mo>,</mo><mrow><mi mathvariant="bold">i</mi></mrow><mo stretchy="false">)</mo><mrow data-mjx-texclass="ORD"><mo minsize="1.2em" maxsize="1.2em">)</mo></mrow><mrow data-mjx-texclass="ORD"><mo minsize="1.623em" maxsize="1.623em">)</mo></mrow></mtd></mtr><mtr><mtd><mi>B</mi><mo stretchy="false">(</mo><mi>s</mi><mo>,</mo><mi>n</mi><mo>,</mo><mi>ζ</mi><mo>,</mo><mrow><mi mathvariant="bold">i</mi></mrow><mo stretchy="false">)</mo></mtd><mtd><mi></mi><mo>≡</mo></mtd><mtd><mrow data-mjx-texclass="INNER"><mo data-mjx-texclass="OPEN">{</mo><mtable columnalign="left left" columnspacing="1em" rowspacing=".2em"><mtr><mtd><mrow><mi mathvariant="monospace">R</mi><mi mathvariant="monospace">L</mi><mi mathvariant="monospace">P</mi></mrow><mrow data-mjx-texclass="ORD"><mo minsize="1.2em" maxsize="1.2em">(</mo></mrow><mstyle scriptlevel="0"><mspace width="thickmathspace"></mspace></mstyle><mo stretchy="false">(</mo><mi>s</mi><mo>,</mo><mi>n</mi><mo stretchy="false">)</mo><mstyle scriptlevel="0"><mspace width="thickmathspace"></mspace></mstyle><mrow data-mjx-texclass="ORD"><mo minsize="1.2em" maxsize="1.2em">)</mo></mrow></mtd><mtd><mtext>if</mtext><mtext>&nbsp;</mtext><mi>ζ</mi></mtd><mtd></mtd><mtd><mo>=</mo></mtd><mtd></mtd><mtd><mi data-mjx-alternate="1">∅</mi></mtd></mtr><mtr><mtd><mo stretchy="false">(</mo><mn>255</mn><mo stretchy="false">)</mo><mo>⋅</mo><mi>s</mi><mo>⋅</mo><mi>ζ</mi><mo>⋅</mo><mrow><mi mathvariant="monospace">K</mi><mi mathvariant="monospace">E</mi><mi mathvariant="monospace">C</mi></mrow><mo stretchy="false">(</mo><mrow><mi mathvariant="bold">i</mi></mrow><mo stretchy="false">)</mo></mtd><mtd><mtext>otherwise</mtext></mtd></mtr></mtable><mo data-mjx-texclass="CLOSE" fence="true" stretchy="true" symmetric="true"></mo></mrow></mtd></mtr></mtable></math>

地址的推算方法如下：

```js
//首先拿到工厂合约的地址：
address factory = 0xa6b71e26c5e0845f74c812102ca7114b6a896ab2;
假设nonce = 1, 则RLP((s,n))为：
ethers.utils.RLP.encode(["0xa6b71e26c5e0845f74c812102ca7114b6a896ab2","0x01"])
=>
RLP((factory,nonce)) = 0xd694a6b71e26c5e0845f74c812102ca7114b6a896ab201

Keccak256(RLP((factory,nonce))) =  0x4c2134364fb2823682748fe543e77ba9f5e59cefb97d55cf58641ebb7beb22c4
address = 0x43e77ba9f5e59cefb97d55cf58641ebb7beb22c4
```

使用create2这一OPCODE就没有这个问题，但使用create2时，需要理解构造函数中的参数应该怎么传入进去：

> Arguments for the constructor of a contract are directly appended at the end of the contract’s code, also in ABI encoding. The constructor will access them through a hard-coded offset, and not by using the codesize opcode, since this of course changes when appending data to the code.

即将`contructor`里的参数直接以ABI编码后贴在`contract.creationCode`里。

```js
bytes memory data = abi.encode(type(GnosisSafeProxy).creationCode, uint256(uint160(singleton)))
```

### 注意点2：代理合约与实现合约的Storage插槽排布是否一致

由于代理合约`GnosisSafeProxy`与实现合约`GnosisSafe`是通过`delegatecall`来调用，故需要仔细检查两边的插槽排布，需让其保持一致。

首先是`GnosisSafeProxy`代理合约：

```assembly
slot_00 => singleton
```

然后是`GnosisSafe`实现合约

```assembly
contract GnosisSafe is
    EtherPaymentFallback,
    Singleton,
    ModuleManager,
    OwnerManager,
    SignatureDecoder,
    SecuredTokenTransfer,
    ISignatureValidatorConstants,
    FallbackManager,
    StorageAccessible,
    GuardManager
EtherPaymentFallback => 无全局变量
Singleton =>有全局变量 slot_00 => singleton
ModuleManager is SelfAuthorized, Executor
SelfAuthorized => 无全局变量
Executor => 无全局变量
ModuleManager => 有全局变量 mapping(address => address) internal modules
OwnerManager is SelfAuthorized
SelfAuthorized => 无全局变量
OwnerManager => 有全局变量 mapping(address => address) internal owners;
						uint256 internal ownerCount;
                          uint256 internal threshold;
SignatureDecoder => 无全局变量
SecuredTokenTransfer => 无全局变量
ISignatureValidatorConstants => 无全局变量
FallbackManager is SelfAuthorized
SelfAuthorized => 无全局变量
FallbackManager => 有全局变量 keccak256("fallback_manager.handler.address") => fallback_handler
StorageAccessible => 无全局变量
GuardManager is SelfAuthorized
SelfAuthorized => 无全局变量
GuardManager => 有全局变量 keccak256("guard_manager.guard.address") => set_guard
GnosisSafe => 有全局变量 uint256 public nonce;
                        bytes32 private _deprecatedDomainSeparator;
                        mapping(bytes32 => uint256) public signedMessages;
                        mapping(address => mapping(bytes32 => uint256)) public approvedHashes;
```

将上面的`GnosisSafe`实现合约的插槽整理如下：

```assembly
slot_00 => singleton
slot_01 => mapping(address => address) internal modules
slot_02 => mapping(address => address) internal owners;
slot_03 => uint256 internal ownerCount;
slot_04 => uint256 internal threshold;
slot_05 => uint256 public nonce;
slot_06 => bytes32 private _deprecatedDomainSeparator;
slot_07 => mapping(bytes32 => uint256) public signedMessages;
slot_08 => mapping(address => mapping(bytes32 => uint256)) public approvedHashes;
keccak256("fallback_manager.handler.address") => fallback_handler
keccak256("guard_manager.guard.address") => set_guard
```

可以看到代理合约`Proxy`和实现合约`GnosisSafe`的插槽并不完全一致，但是在代理合约Proxy的插槽排布中，slot_00位置处的值都是`singleton`，并未出现碰撞。可能是Gnosis想让`proxy`合约尽可能小，所以这样设计。

### 注意点3：与compound的`Unitroller`部分对比

`Compound`中的`Unitroller`是一个可升级合约架构，即其对应的实现`comptrollerImplementation`合约地址可以通过`Unitorller`中的方法去更改，从而实现合约升级。而`GnosisSafeProxy`并不是一个可升级合约架构，它对应的实现`singleton`是在初始化时就写死的，没有办法去更改实现。

作为一个代理合约，其实现地址通常需要在创建时就传入进去，然后再调用init方法来进行初始化。

## 代理合约结构

后续更新，因为重新看了下Gnonsis Safe的代码。

proxy代码逻辑中并没有可升级的操作，所有的升级操作再impl代码中的masterCopy合约中，类似于UUPS的升级方式。

```js
masterCopy.sol:
function changeMasterCopy(address _masterCopy)
        public
        authorized
{
    // Master copy address cannot be null.
    require(_masterCopy != address(0), "Invalid master copy address provided");
    masterCopy = _masterCopy;
    emit ChangedMasterCopy(_masterCopy);
}
```

这里与UUPS不一样的地方是，它提供一个authorized的modifier，这个modifier特别有意思，它要求msg.sender==address(this), 这特别像inernal的感觉。 这与openzeppelin再UUPS中实现的onlyProxy并不是一个思路。

```js
modifier authorized() {
    require(msg.sender == address(this), "Method can only be called from this contract");
    _;
}
```

对比Openzeppelin的UUPS中onlyProxy实现：

```js
address private __self = address(this);

modifier onlyProxy() {
    require(address(this) != __self, "Function must be called through delegatecall");
    require(_getImplementation() == __self, "Function must be called through active proxy");
    _;
}
```

Openzeppelin是利用proxy ->delegatecall -> impl时，其address(this)应该等于address(proxy), 而部署impl时的_self应该等于address(impl), 两者并不相等。然后再检查对应的代理合约的实现合约是不是impl。

Gnosis中的authorized方式是检查msg.sender==address(this)，是FactoryProxy->call->proxy->delegatecall->impl,

```js
function createProxyWithNonce(address _mastercopy, bytes memory initializer, uint256 saltNonce)
        public
        returns (Proxy proxy)
{
    proxy = deployProxyWithNonce(_mastercopy, initializer, saltNonce);
    if (initializer.length > 0)
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            if eq(call(gas, proxy, 0, add(initializer, 0x20), mload(initializer), 0, 0), 0) { revert(0,0) }
        }
    emit ProxyCreation(proxy);
}
function deployProxyWithNonce(address _mastercopy, bytes memory initializer, uint256 saltNonce)
        internal
        returns (Proxy proxy)
    {
    // If the initializer changes the proxy address should change too. Hashing the initializer data is cheaper than just concatinating it
    bytes32 salt = keccak256(abi.encodePacked(keccak256(initializer), saltNonce));
    bytes memory deploymentData = abi.encodePacked(type(Proxy).creationCode, uint256(_mastercopy));
    // solium-disable-next-line security/no-inline-assembly
    assembly {
        proxy := create2(0x0, add(0x20, deploymentData), mload(deploymentData), salt)
    }
    require(address(proxy) != address(0), "Create2 call failed");
}
```

```js
Function: createProxyWithNonce(address _mastercopy, bytes initializer, uint256 saltNonce)

MethodID: 0x1688f0b9
[0]:  00000000000000000000000034cfac646f301356faa8b21e94227e3583fe3f5f //mastercopy
[1]:  0000000000000000000000000000000000000000000000000000000000000060 //init
[2]:  000000000000000000000000000000000000000000000000000001798f2d474d //saltnonce
[3]:  00000000000000000000000000000000000000000000000000000000000001a4 //len
[4]:  b63e800d
0000000000000000000000000000000000000000000000000000000000000100 //_owners
0000000000000000000000000000000000000000000000000000000000000002 //_threshold
0000000000000000000000000000000000000000000000000000000000000000 //to
0000000000000000000000000000000000000000000000000000000000000180 //data
000000000000000000000000d5d82b6addc9027b22dca772aa68d5d74cdbdf44 //fallbackHandler
0000000000000000000000000000000000000000000000000000000000000000 //paymentToken
0000000000000000000000000000000000000000000000000000000000000000 //payment
0000000000000000000000000000000000000000000000000000000000000000 //receiver
0000000000000000000000000000000000000000000000000000000000000003 //_owner len
000000000000000000000000a75c86521514ff4873e5524a2579b249403c9a21 //owner[0]
000000000000000000000000594bdaecc368f6cfa0baebb4c82794090a85fff0 //owner[1]
0000000000000000000000007d9b016edd3b52495860f65de4c8238d2a73b88e //owner[2]
0000000000000000000000000000000000000000000000000000000000000000 //data
00000000000000000000000000000000000000000000000000000000
```