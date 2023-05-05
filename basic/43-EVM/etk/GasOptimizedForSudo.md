# Sudoswap是如何节省gas的
## Background
sudoswap的一大特色就是非常节省gas，在它的twitter上也和seaport消耗的gas进行了对比，所以这里就想学习下sudoswap是如何节省gas的。
![](2022-09-04-17-24-43.png)
### 创建pair合约
通过factory创建pair合约的主要操作都是在LSSVMPairCloner这个lib里完成，可以看到这里有着非常多的assembly代码甚至是手写的Opcode。
比如其`cloneETHPair`方法，里面就充斥了一堆手写的[opcode](https://github.com/sudoswap/lssvm/blob/c8b228b2a3b51664c433f487fb76db42d3509dd4/src/lib/LSSVMPairCloner.sol#L21-L101)。
![](2022-09-04-17-29-48.png)
1. 明白这个函数在做什么：
这个函数实际上就是完成了EIP-1167，最小化proxy合约的创建，具体可参考[这个链接](https://learnblockchain.cn/article/2663)。与标准的创建EIP-1167合约不同的一点在于，他将函数的参数，如`factory,bondingCurve,nft,poolType`这四个参数全部硬编码到了部署得到的proxy合约代码里面，如这个[地址所示](https://etherscan.io/address/0xb79f94e6f2460d3cb8b8970de4aa873f78589e34#code)：
```js
0x3d3d3d3d363d3d37603d6035363936603d013d73cd80c916b1194beb48abf007d0b79a7238436d565af43d3d93803e603357fd5bf3b16c1342e617a5b6e4b631eb114483fdb289c0a4432f962d8209781da23fb37b6b59ee15de7d984164ad353bc90a04361c4810ae7b3701f3beb48d7e02
```
其中，implement合约地址是：`0xCd80C916B1194beB48aBF007D0b79a7238436D56`。
携带的4个参数分别是：
```js
factory: 0xb16c1342e617a5b6e4b631eb114483fdb289c0a4
bondingCurve: 0x432f962d8209781da23fb37b6b59ee15de7d9841
nft:0x64ad353bc90a04361c4810ae7b3701f3beb48d7e
poolType: 0x02
```
2. 然后当有任何的调用到这个proxy上时，这个proxy会直接将所有的函数调用通过delegatecall的方式，调用到其实现合约上，并且与EIP-1167不同的一点是，其调用delegatecall的时候，会在calldata后面硬编码上proxy创建时带的这4个参数:`factory,bondingCurve,nft,poolType`
即，比如最简单的调用`swapTokenForAnyNFTs`方法，其调用的calldata为：
```js
首先是用户直接调用proxy的swapTokenForAnyNFTs方法：
proxy.call(abi.encodeWithSelector(proxy.swapTokenForAnyNFTs.selector, numNFTs, maxExpectedTokenInput, nftRecipient, isRouter, routerCaller))
然后是proxy对该方法调用进行delegatecall转发：
impl.delegatecall(
    abi.encodePacked(
        abi.encodeWithSelector(
            proxy.swapTokenForAnyNFTs.selector, 
            numNFTs, 
            maxExpectedTokenInput, 
            nftRecipient, 
            isRouter, 
            routerCaller),
        abi.encodePacked(
            factory,
            bondingCurve,
            nft,
            poolType
        )))
```
这样做有很多好处，一个好处就是可以极大的省gas。
3. 现在我们需要来分析一下，我们自己应该如何才能实现同样的功能，有哪些值得学习的地方。
可以看到proxy合约要实现的功能主要有两个：
第一：通过delegatecall对函数调用进行转发，并将结果返回给我。
第二：函数调用转发时，带上4个参数。这4个参数需要硬编码到proxy合约里。
为了完成这个功能，我们需要用到[etk](https://github.com/quilt/etk)这个工具来辅助我们手写opcode。
首先是op.etk文件：
```js
initstart:
    push1 runtimeEnd-runtimeStart       #runtimesize
    returndatasize                      #0 runtimesize
    dup2                                #runtimesize 0 runtimesize
    push1 runtimeStart-initstart        #runtimeoffset runtimesize 0 runtimesize
    returndatasize                      #0 runtimeoffset runtimesize 0 runtimesize
    codecopy                            #0 runtimesize
    return
initend:
runtimeStart:
    returndatasize                      #0
    returndatasize                      #0 0
    returndatasize                      #0 0 0
    returndatasize                      #0 0 0 0
    calldatasize                        #calldatasize 0 0 0 0
    returndatasize                      #0 calldatasize 0 0 0 0
    returndatasize                      #0 0 calldatasize 0 0 0 0
    calldatacopy                        #0 0 0 0 
    push1 extradataEnd-extradataStart   #extradatasize 0 0 0 0
    push1 extradataStart-runtimeStart   #extradataoffset extradatasize 0 0 0 0
    calldatasize                        #calldatasize extradataoffset extradatasize 0 0 0 0
    codecopy                            #0 0 0 0
    push1 extradataEnd-extradataStart   #extradatasize 0 0 0 0
    calldatasize                        #calldatasize extradatasize 0 0  0 0
    add                                 #inputSize 0 0 0 0
    returndatasize                      #0 inputSize 0 0 0 0
    push20 0x0000000000000000000000000000000000000000                       #addr 0 inputSize 0 0 0 0
    gas                                 #gas addr 0 inputSize 0 0 0 0
    delegatecall                        #success 0 0
    returndatasize                      #returndatasize success 0 0
    swap3                               #0 success 0 returndatasize
    dup4                                #returndatasize 0 success 0 returndatasize
    swap1                               #0 returndatasize success 0 returndatasize
    dup1                                #0 0 returndatasize success 0 returndatasize
    returndatacopy                      #success 0 returndatasize
    push1 labelreturn-runtimeStart      #labelreturn success 0 returndatasize
    jumpi                               #0 returndatasize
    revert                              #
labelreturn:    
    jumpdest                            #0 returndatasize
    return                              #



extradataStart:
%include_hex("extra.etk")
extradataEnd:
runtimeEnd:
```
然后是extra.etk文件，这里面放着的是需要硬编码到proxy合约里的字节码：
```js
b16c1342e617a5b6e4b631eb114483fdb289c0a4432f962d8209781da23fb37b6b59ee15de7d984164ad353bc90a04361c4810ae7b3701f3beb48d7e02 
```
通过etk工具对op.etk文件进行编码，得到的字节码段为：
```js
60733d8160093d39f33d3d3d3d363d3d37603d60363639603d36013d7300000000000000000000000000000000000000005af43d928390803e603d57fd5bf3b16c1342e617a5b6e4b631eb114483fdb289c0a4432f962d8209781da23fb37b6b59ee15de7d984164ad353bc90a04361c4810ae7b3701f3beb48d7e02
```
那么我们为什么需要花费这么大的力气来手写这些编码呢？最大的一个好处是可以利用etk工具帮我们计算出对应的offset和length的数据，否则需要自己来手动计算，就很容易出错。并且我们可以在`evm.codes`这个网站上在线调试一下，我们手写的这部分字节码是不是正确的。
![](2022-09-04-19-00-24.png)
当我们拿到需要的字节码之后，我们就可以开始编写相对应的assembly部分了。编写assembly的核心是把得到的字节码当成一串字符，然后存储到memory里，最后通过create方法创建出来。
编写assembly之前，通过字节码，要算出对应的长度：
```python
>>> s= "60733d8160093d39f33d3d3d3d363d3d37603d60363639603d36013d7300000000000000000000000000000000000000005af43d928390803e603d57fd5bf3b16c1342e617a5b6e4b631eb114483fdb289c0a4432f962d8209781da23fb37b6b59ee15de7d984164ad353bc90a04361c4810ae7b3701f3beb48d7e02"
>>> s[:0x1d*2]
'60733d8160093d39f33d3d3d3d363d3d37603d60363639603d36013d73'
>>> s[0x1d*2:0x1d*2+40]
'0000000000000000000000000000000000000000'
>>> s[0x31*2:0x3f*2]
'5af43d928390803e603d57fd5bf3'
>>> s[0x3f*2:0x53*2]
'b16c1342e617a5b6e4b631eb114483fdb289c0a4'
>>> s[0x53*2:0x67*2]
'432f962d8209781da23fb37b6b59ee15de7d9841'
>>> s[0x67*2:0x7b*2]
'64ad353bc90a04361c4810ae7b3701f3beb48d7e'
>>> s[0x7b*2:0x7c*2]
'02'
```
```js
function cloneETHPair(
    address implementation,
    ILSSVMPairFactoryLike factory,
    ICurve bondingCurve,
    IERC721 nft,
    uint8 poolType
) internal returns (address instance) {
    assembly {
        let ptr := mload(0x40)
        mstore(ptr,           0x60733d8160093d39f33d3d3d3d363d3d37603d60363639603d36013d73000000)
        mstore(add(ptr,0x1d), shl(0x60,implementation))
        mstore(add(ptr,0x31), 0x5af43d928390803e603d57fd5bf3000000000000000000000000000000000000)
        mstore(add(ptr,0x3f), shl(0x60,factory))
        mstore(add(ptr,0x53), shl(0x60,bondingCurve))
        mstore(add(ptr,0x67), shl(0x60, nft))
        mstore8(add(ptr,0x7b), poolType)
        instance := create(0, ptr, 0x7c)
    }
}
```
