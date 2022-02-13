在 1.0 的版本中，我们创建了一个简单的存值读值的 dApp 及其配套合约，并将其部署到了 Github-Pages 上。

今天，我们对 1.0 的版本进行升级，让他变得更酷，我们甚至能给这个应用设计一个简单的经济模型！

## 0x01 让合约文件夹成为项目的子 Repo

在 Repo 中，我们会注意到 contracts 文件夹中实质存放的是另一个 Repo，这里用到了 git 中的`submodule`功能。

对于智能合约来说，这样做的好处是，可能对于同一个 dApp 来说，有不同的合约版本。例如对于 NFT 项目来说，有普通版、白名单版、可升级版等等，这个时候设置智能合约为 submodule，那么我们就可以在该文件夹中独立切换合约了。而不用再把合约移来移去。

以下是一些`submodule`相关的 git 操作：

```bash
# 在该目录下添加 submodule
git submodule add submodule-repository-URL
# example:
# git submodule add https://github.com/leeduckgo/set-purpose-contracts.git

# 在 clone 的时候即下载子模块
git clone --recurse-submodules repository-URL

# 手动拉取指定 submodule
git submodule update --init folder-path
# example:
# git submodule update packages/hardhat/contracts --init
```

## 0x02 给 setPurpose 函数加上权限控制

在原有的 `PurposeHandler` 基础上，我们通过 `require` 语句给 `setPurpose` 函数添加了权限控制。当合约调用人不是构造函数中赋值的`owner`的时候，就会报错并不执行下面的语句。

```solidity
pragma solidity >=0.8.0 <0.9.0;
//SPDX-License-Identifier: MIT

import "hardhat/console.sol";

contract PurposeHandler {

  //event SetPurpose(address sender, string purpose);

  string public purpose = "Building Unstoppable Apps";
  address public owner = 0x7EF99B0E5bEb8ae42DbF126B40b87410a440a32a;
  // 这里填写你自己的地址

  constructor() {

    // owner = msg.sender;
  }

  function setPurpose(string memory newPurpose) public {
      // about msg.sender:
      // https://cryptozombies.io/en/lesson/2/chapter/3
      // about require:
      // https://cryptozombies.io/en/lesson/2/chapter/4
      require( msg.sender == owner, "NOT THE OWNER!");

      purpose = newPurpose;
      console.log(msg.sender,"set purpose to",purpose);
      //emit SetPurpose(msg.sender, purpose);
  }
}
```

> **TIPS：**
>
> 关于 msg.sender: <https://cryptozombies.io/en/lesson/2/chapter/3>
>
> 关于 require: <https://cryptozombies.io/en/lesson/2/chapter/4>

回到 set-purpose 根目录，启动本地链、部署合约、启动 dApp：

```bash
export SKIP_PREFLIGHT_CHECK=true # 设置环境变量
yarn chain # 启动链
yarn deploy # 部署合约
yarn start # 启动dApp
```

![image-20211029132355937](https://mmbiz.qpic.cn/mmbiz_png/UrYDA9tqpqVibtpjulksqKGsglibrXxSicnjSOO2PHEc5J98Q64G3rp7N0hNCUqMiacsbCNxaEqqpMgibp0tlLmLyTA/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

访问`http://localhost:3000`。

由 Owner 发起交易的演示：

![set_purpose_v0x02](https://tva1.sinaimg.cn/large/008i3skNgy1gvw62x1b5hg30oq0kbjzo.gif)

非 Owner 发起交易：

![set_purpose_v0x02-wrong](https://tva1.sinaimg.cn/large/008i3skNgy1gvw652dfh0g30oq0kbdmq.gif)

> TIPS：
>
> 如果账户发生 Nonce 相关错误，重置 Nonce 即可：
>
> Metamask > Settings > Advanced > Reset Account
