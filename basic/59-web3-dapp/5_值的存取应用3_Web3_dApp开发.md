在 2.0 版本中，我们学习了通过`require`语句给函数添加权限控制。

现在，我们可以给它加上真正的经济机制，让`purpose`的值由真正的竞价拍卖机制所控制！

###0x01 加入 Owner

如何知道合约的所有人`owner`是一个新手常见的问题。

最简单的方式是设置一个 public 的`owner`变量，在构造函数里传入`_owner`参数：

```solidity
pragma solidity >=0.8.0 <0.9.0;
//SPDX-License-Identifier: MIT

contract PurposeHandler {

  string public purpose = "Building Unstoppable Apps";
  address public owner = owner;
  // 这里填写你自己的地址

  constructor(address _owner) {
    owner = _owner;
  }

  function setPurpose(string memory newPurpose) public {
      // about msg.sender:
      // https://cryptozombies.io/en/lesson/2/chapter/3
      // about require:
      // https://cryptozombies.io/en/lesson/2/chapter/4
      require( msg.sender == owner, "NOT THE OWNER!");

      purpose = newPurpose;
      console.log(msg.sender,"set purpose to",purpose);
  }
}
```

在生产实践中，一般通过引入`ownable.sol`来实现。

Openzepplin中的`ownable.sol`：

> https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol

一个单文件`ownable.sol`:

```solidity
pragma solidity ^0.4.25;

  /**
  * @title Ownable
  * @dev The Ownable contract has an owner address, and provides basic authorization control
  * functions, this simplifies the implementation of "user permissions".
  */
  contract Ownable {
    address private _owner;

    event OwnershipTransferred(
      address indexed previousOwner,
      address indexed newOwner
    );

    /**
    * @dev The Ownable constructor sets the original `owner` of the contract to the sender
    * account.
    */
    constructor() internal {
      _owner = msg.sender;
      emit OwnershipTransferred(address(0), _owner);
    }

    /**
    * @return the address of the owner.
    */
    function owner() public view returns(address) {
      return _owner;
    }

    /**
    * @dev Throws if called by any account other than the owner.
    */
    modifier onlyOwner() {
      require(isOwner());
      _;
    }

    /**
    * @return true if `msg.sender` is the owner of the contract.
    */
    function isOwner() public view returns(bool) {
      return msg.sender == _owner;
    }

    /**
    * @dev Allows the current owner to relinquish control of the contract.
    * @notice Renouncing to ownership will leave the contract without an owner.
    * It will not be possible to call the functions with the `onlyOwner`
    * modifier anymore.
    */
    function renounceOwnership() public onlyOwner {
      emit OwnershipTransferred(_owner, address(0));
      _owner = address(0);
    }

    /**
    * @dev Allows the current owner to transfer control of the contract to a newOwner.
    * @param newOwner The address to transfer ownership to.
    */
    function transferOwnership(address newOwner) public onlyOwner {
      _transferOwnership(newOwner);
    }

    /**
    * @dev Transfers control of the contract to a newOwner.
    * @param newOwner The address to transfer ownership to.
    */
    function _transferOwnership(address newOwner) internal {
      require(newOwner != address(0));
      emit OwnershipTransferred(_owner, newOwner);
      _owner = newOwner;
    }
  }

```

### 0x02 通过一条 require 判断建立「拍卖机制」

规则即是，如果出价比当前的 price 高，那么就可以修改`set-purpose`的值；如果不如当前的 price 高，则抛出错误。

```solidity
pragma solidity >=0.8.0 <0.9.0;
//SPDX-License-Identifier: MIT

contract PurposeHandler {

  string public purpose = "Building Unstoppable Apps";
  address public owner = owner;
  uint256 public price = 0.001 ether;
  // 这里填写你自己的地址

  constructor(address _owner) {
    owner = _owner;
  }

  function setPurpose(string memory newPurpose) payable public {
      require( msg.value > price, "NOT ENOUGH!");
      purpose = newPurpose;
      // update price when guy set 
      price = msg.value;
      console.log(msg.sender,"set purpose to",purpose);
  }
  
}
```

### 0x03 提现机制

通过函数`getBalance()`让``owner`可以查看合约中的余额，通过函数`getMyMoney`可以让合约中的余额提现出来：

```solidity
pragma solidity >=0.8.0 <0.9.0;
//SPDX-License-Identifier: MIT

contract PurposeHandler {

  string public purpose = "Building Unstoppable Apps";
  address public owner;
  uint256 public price = 0.001 ether;
    
  constructor(address _owner) {
    owner = _owner;
  }

  function setPurpose(string memory newPurpose) payable public {
      require( msg.value > price, "NOT ENOUGH!");
      purpose = newPurpose;
      // update price when guy set 
      price = msg.value;
  }
  
  function getBalance() view public returns(uint256) {
      return address(this).balance;
  }
  
  function getMyMoney(address _to, uint256 amount) public {
      	require(msg.sender==owner);
      	address payable receiver = payable(_to);
        receiver.transfer(amount);
  }
}
```

### 0x04 通过 Event 记录 set purpose 的历史

什么是事件？

> 区块链是一个区块列表——它们基本上都是由交易构成。 每一笔交易都有一个附加的收据（receipt），其中包含零个或多个日志条目。这些日志条目代表着智能合约中的事件被触发后生成的结果。
>
> 在Solidity源代码中，要定义一个事件`event`，需要在其前面加上event关键字（类似于`function`关键字的用法）来标记它。 然后，你可以任何你希望生成事件的函数体内调用或触发该事件。 你可以从任何函数中使用`emit`关键字触发事件。
>
> 有人可能会添加关于如何“监听”DAPP中事件的信息。 它使用Web 3.0的过滤功能（[filtering functionality of Web 3.0](https://github.com/ethcore/parity#eth_newfilter)）。
>
> ——https://learnblockchain.cn/question/29

我们可以给 setPurpose 函数添加`event`, 以记录 set purpose 的历史。

```solidity
pragma solidity >=0.8.0 <0.9.0;
//SPDX-License-Identifier: MIT

contract PurposeHandler {

  event SetPurpose(address sender, string purpose);

  string public purpose = "Building Unstoppable Apps";
  address public owner;
  uint256 public price = 0.001 ether;
    
  constructor(address _owner) {
    owner = _owner;
  }

  function setPurpose(string memory newPurpose) payable public {
      require( msg.value > price, "NOT ENOUGH!");
      purpose = newPurpose;
      // update price when guy set 
      price = msg.value;
      emit SetPurpose(msg.sender, purpose);
  }
  
  function getBalance() view public returns(uint256) {
      return address(this).balance;
  }
  
  function getMyMoney(address _to, uint256 amount) public {
      	require(msg.sender==owner);
      	address payable receiver = payable(_to);
        receiver.transfer(amount);
  }
}
```

### 总结

值的存取系列就到这里了。以下是值的存储系列的所有文章：

> [值的存取应用2.0 |  Web3.0 dApp 开发（四）](http://mp.weixin.qq.com/s?__biz=MzI0NTM0MzE5Mw==&mid=2247485589&idx=1&sn=e173c9575c62b87a17187ceed4ca8cf1&chksm=e94ebe23de393735ab3a1d66bc83fb7374a512e3d3f832ebd988f6b5284d4b2c20945706960a&scene=21#wechat_redirect)
>
> [值的存取应用1.0 | web3.0 dApp开发（三）](http://mp.weixin.qq.com/s?__biz=MzI0NTM0MzE5Mw==&mid=2247485560&idx=1&sn=303e4805d09d7a82953d435a73d2156b&chksm=e94ebecede3937d8093270f91b122fa7b8ccfbc02d348c57df872df245aa63f71c9aac7b6701&scene=21#wechat_redirect)
>
> [Scaffold-eth 快速上手 | Web3.0 dApp 开发（二）](http://mp.weixin.qq.com/s?__biz=MzI0NTM0MzE5Mw==&mid=2247485520&idx=1&sn=b4aae0805f7bd9cc09ca99455b454194&chksm=e94ebee6de3937f0babbe6357795f9a6f8c06552e5c2c6075c47f84f8383c2a37488b5266fc4&scene=21#wechat_redirect)
>
> [eth.build 快速上手 | Web3.0 dApp 开发（一）](http://mp.weixin.qq.com/s?__biz=MzI0NTM0MzE5Mw==&mid=2247485492&idx=1&sn=335e3b092704152d30bdd8b2f49138f2&chksm=e94ebe82de3937948ba5a58aea0c60d7378fa82026d6005382a70d57ba897f93c2d3b315126f&scene=21#wechat_redirect)

在下一篇，我们进入下一章—— NFT dApp 的设计与实现！
