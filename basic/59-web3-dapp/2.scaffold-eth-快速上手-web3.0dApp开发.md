## 前言

Scaffold-eth 是搭建以太坊上 dApp 的模板（Template），也是 dApp 优秀作品的集合，让开发人员可以大大提升开发效率，降低踩坑几率，是 web3.0 dApp 开发者的「入门神器」。

它包括如下组件：

- **hardhat:** 用于运行本地网络、部署和测试智能合约。
- **React:** 使用许多预制组件和 hooks 来构建前端。
- **Ant:** 用于构建你的 UI，可以轻松更改为 Bootstrap 或者其他库。
- **Surge:** 发布你的应用。
- Tenderly / The Graph / Etherscan / Infura / Blocknative 等等。
- 支持 L2 / Sidechains。

## 极速部署

### 环境要求

Scafford Eth 基于 Node.js 环境，需要安装`node.js`和`yarn`。

### 部署 Scaffold-eth 脚手架

1. 获取项目源代码

```bash
git clone https://github.com/austintgriffith/scaffold-eth.git
```

2. 打开三个命令行面板

> **TIPS:** 很多 Terminal 终端都支持分屏操作。

![image-20210924203810255](https://tva1.sinaimg.cn/large/008i3skNly1gurzzs4lelj61by0u075u02.jpg)

3. 在第一个命令行面板里，启动 👷‍ Hardhat chain:

```bash
cd scaffold-eth
yarn install
yarn chain
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/b0b2f44277d54f72af11266406f00d8a.png?x-oss-process=image/watermark,type_ZHJvaWRzYW5zZmFsbGJhY2s,shadow_50,text_Q1NETiBAOTlLaWVz,size_20,color_FFFFFF,t_70,g_se,x_16)

4. 在第二个命令行窗口里，部署 `/scaffold-eth/packages/hardhat/contracts/` 下的合约。

```bash
cd scaffold-eth
yarn deploy
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/955e5f40c2a6496b9d36ab3d2793527d.png?x-oss-process=image/watermark,type_ZHJvaWRzYW5zZmFsbGJhY2s,shadow_50,text_Q1NETiBAOTlLaWVz,size_20,color_FFFFFF,t_70,g_se,x_16)

5. 在第三个命令行窗口里 启动你的前端应用:

```bash
cd scaffold-eth
yarn start
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/62f4b4be6800401f959c27591ef67054.png?x-oss-process=image/watermark,type_ZHJvaWRzYW5zZmFsbGJhY2s,shadow_50,text_Q1NETiBAOTlLaWVz,size_20,color_FFFFFF,t_70,g_se,x_16)

主分支下的案例合约是一个存储/读取值的合约，你可以在 `/scaffold-eth/packages/hardhat/contracts/`下找到这个合约并修改这个新合约的内容然后重新部署。

> **TIPS:**
>
> 如果你对其他的合约项目感兴趣，可以切换仓库的分支部署不同的 dapp 服务。
> [可以切换的案例分支](https://github.com/scaffold-eth/scaffold-eth/branches/active)
> 比如 nft 的案例分支 <https://github.com/scaffold-eth/scaffold-eth/tree/simple-nft-example>

## 应用体验

回到刚才的话题，这时候 我们合约部署了，前端和本地测试链都启动了。
在这里我们先贴一下 我们刚才 deploy 的合约内容。

```javascript
pragma solidity >=0.8.0 <0.9.0;
//SPDX-License-Identifier: MIT

import "hardhat/console.sol";
//import "@openzeppelin/contracts/access/Ownable.sol"; //https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol

contract YourContract {

  //event SetPurpose(address sender, string purpose);

  string public purpose = "Building Unstoppable Apps!!!";

  constructor() {
    // what should we do on deploy?
  }

  // 存储 purpose 变量
  function setPurpose(string memory newPurpose) public {
      purpose = newPurpose;
      console.log(msg.sender,"set purpose to",purpose);
      //emit SetPurpose(msg.sender, purpose);
  }
}

```

合约里设置了一个 public 的 string 变量 purpose，这个 purpose 的默认值是“Building……"，也提供了一个 setPurpose 方法 可以通过这个方法去修改 purpose 的内容。

现在我们访问前端服务<http://localhost:3000>。
![在这里插入图片描述](https://tva1.sinaimg.cn/large/008i3skNgy1gus4qhaxm1j61hc0qr41r02.jpg)

1. 给账户申请测试币
   ![在这里插入图片描述](https://tva1.sinaimg.cn/large/008i3skNgy1gus4qkp6gbj61hc0p2wgj02.jpg)
   ![在这里插入图片描述](https://tva1.sinaimg.cn/large/008i3skNgy1gus4qe3thhj61hc0p2ac602.jpg)
   ![在这里插入图片描述](https://tva1.sinaimg.cn/large/008i3skNgy1gus4qg8331j61hc0p2jt302.jpg)
2. 调用合约方法。
   因为调用方法需要耗费 gas，所以一定得申请测试代币。
   ![在这里插入图片描述](https://tva1.sinaimg.cn/large/008i3skNgy1gus4qiuqqlj61hc0p275y02.jpg)
   ![在这里插入图片描述](https://tva1.sinaimg.cn/large/008i3skNgy1gus4qf9ob1j61hc0ptq5r02.jpg)
   ![在这里插入图片描述](https://tva1.sinaimg.cn/large/008i3skNgy1gus4qjsw20j61hc0p2q5202.jpg)
   可见 purpose 的值成功修改，我们账户由于调用方法的时候消耗了 gas 费所以这里的余额也不在是**1**这个整数。

## 总结

我们可以通过 scaffold-eth 这个脚手架快速构架我们的 Dapp 应用，在 hardhat 里它不光可以 deploy 在本地测试网，你可以选择网络地址，可以将你的合约部署在任何的网络里。
至此我们的 scaffold-eth 快速体验就到这里了。
