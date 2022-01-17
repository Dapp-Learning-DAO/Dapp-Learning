## 1 本地运行 1.0 版本

我们先来尝试本地 1.0 版本。

1.0 版本我们不需要做什么，只需要把仓库 clone 下来运行即可。

### 1.1 代码下载、切换分支与子模块的初始化

先 fork。

> https://github.com/leeduckgo/set-purpose

![image-20211002001028548](https://mmbiz.qpic.cn/mmbiz_png/UrYDA9tqpqWRP31lpFoVMWXImwzMQWy7QSX7fk3Sg0VgptfLwL6fguKpPB4pnbzv5VMGBuc3X3eMFVoBfuHovA/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

再 clone。

![image-20211002001126440](https://mmbiz.qpic.cn/mmbiz_png/UrYDA9tqpqWRP31lpFoVMWXImwzMQWy70FrftTvDUqR2rlIpF4ZDYuN5f2a2Emx1VAUJ75iaKPoicYoDQV7Mw9NQ/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

```bash
# clone Repo
git clone [fork 之后你的仓库]
# example: git clone https://github.com/WeLightProject/set-purpose.git
cd set-purpose
# 切换分支
git checkout feat/v0x01
# 初始化子模块
git submodule update --init packages/hardhat/contracts
```

### 1.2 包的安装

```node
yarn;
```

### 1.3 运行本地测试链

```bash
yarn chain
```

![[image-20211001211834038]](https://mmbiz.qpic.cn/mmbiz_png/UrYDA9tqpqWRP31lpFoVMWXImwzMQWy7qYNibFZtG6xeiafjZBBb0ctWD1NdqDolibd6icpFZjsuzrY2gCUsRmRBPA/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

### 1.4 部署合约

```bash
yarn deploy
```

![image-20211001220413508](https://mmbiz.qpic.cn/mmbiz_jpg/UrYDA9tqpqWRP31lpFoVMWXImwzMQWy7ibpW55XozBaVwMlg8sEcPyQQ6vlNTaYCyPl1REQzicic1LUgUM0uRbBSw/640?wx_fmt=jpeg&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

### 1.5 在另一个 terminal 窗口中运行程序

```bash
yarn start
```

### 1.6 在浏览器中打开

访问：

> http://localhost:3000

就能看到你的程序了！

![image-20211001220814439](https://mmbiz.qpic.cn/mmbiz_png/UrYDA9tqpqWRP31lpFoVMWXImwzMQWy7VqnTnneVaeREkhQMBnjDxhLa5xAtfV0Th2FBxw9fP5a9rWH4kY2XHA/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

## 2 合约源码解析

```solidity
pragma solidity >=0.8.0 <0.9.0; // 合约版本号
//SPDX-License-Identifier: MIT

import "hardhat/console.sol";
// 引入 console.sol 的作用在这里：https://hardhat.org/tutorial/debugging-with-hardhat-network.html，简单来说就是能在合约中 console.log 进行调试了
//import "@openzeppelin/contracts/access/Ownable.sol"; //https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol

contract PurposeHandler { // 合约名称

  //event SetPurpose(address sender, string purpose);

  string public purpose = "Building Unstoppable Apps!!!"; // 设定一个变量 purpose，这个变量是直接存储在区块链中的，这也是和传统的编程语言不同的特性之一 —— 赋值即存储。

  constructor() {
    // what should we do on deploy?
  }

  function setPurpose(string memory newPurpose) public {
  		// 一个传参为 newPurpose 的函数
  		// memory/storage 这两种修饰符的使用看这里：
  		// https://learnblockchain.cn/2017/12/21/solidity_reftype_datalocation
      purpose = newPurpose; // 把 purpose 更新为传入的参数
      console.log(msg.sender,"set purpose to",purpose);
      //emit SetPurpose(msg.sender, purpose);
  }
}
```

## 3 将你的程序托管在 Github-pages 上

是的，因为 web3.0 应用是纯前端应用，所以我们可以无需自己去购买一台服务器，而是可以直接将它部署在 github 上。

### 3.1 切换 React 程序中的网络到以太坊测试网

Aha！这是我们首次要修改源码的地方，在`packages/react-app/src/App.jsx`中，定位到如下代码：

```javascript
const targetNetwork = NETWORKS.localhost; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)
```

将`localhost`修改为我们想要部署的测试网，如`ropsten`。

```js
const targetNetwork = NETWORKS.ropsten;
```

然后我们刷新页面，会发现已经弹出提示让我们连接测试网了。

![image-20211001232356720](https://mmbiz.qpic.cn/mmbiz_png/UrYDA9tqpqWRP31lpFoVMWXImwzMQWy7OMWWuOIxDavengLo6pfQ0zyuswdu1T0KgiccX6fuGTV35r3PSgJD0FA/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

用 metamask 链接测试网络，这个时候我们就要来点测试币以在测试网上调用合约：

> Ropsten 水龙头：https://faucet.ropsten.be/
> Paradigm 水龙头：https://faucet.paradigm.xyz/

### 3.2 切换 Hardhat 中的网络到 Ropsten 测试网

这个决定了我们通过 Hardhat 和区块链交互时连接的是哪个网络。

在`packages/hardhat/hardhat.config.js`中，定位到：

```javascript
const defaultNetwork = 'localhost';
```

将`localhost`修改为`ropsten`。

```js
const defaultNetwork = "ropsten";
```

### 3.3 重新部署合约

因为我们切换了网络，所以我们得重新部署一下合约。

我们先来用 hardhat 生成个新地址：

```javascript
yarn run generate
```

> 小 Tips ①：
>
> 在 package.json 中可以看到指令大全！

![image-20211001234607175](https://mmbiz.qpic.cn/mmbiz_png/UrYDA9tqpqWRP31lpFoVMWXImwzMQWy7ouVOsXZT6tUabuYeG1AWnRa3neS9qRc8dB1OJtiaRcNuZ7aTG18u75Q/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

> 小 Tips ②：
>
> git 基础命令：
>
> ```bash
> git add . # 添加所有修改
> git commit -m "[msg]" # 提交修改
> git push
> ```

Yeps，很好，我们生成了一个新的以太坊地址`0x1c95a91e74872ead0a4c726712cfdfab3292f284`，我们将使用这个地址来部署合约。

我们首先给这个地址打点儿测试币：

![image-20211001234619304](https://mmbiz.qpic.cn/mmbiz_png/UrYDA9tqpqWRP31lpFoVMWXImwzMQWy7U108U4XDnoibTfr1xOVhap4w9LlWON4my5Ieb5PpAsVKSI2gOjnppnw/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

再次执行`yarn deploy`：

![image-20211001234758890](https://mmbiz.qpic.cn/mmbiz_png/UrYDA9tqpqWRP31lpFoVMWXImwzMQWy7dtVns59CICzqouc44ibxfT9GKlxSFbViap9oFt5SLAWlxKhWWYV7oS1w/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

Oh，这次我们的合约部署在 Ropsten 测试网络上而不是本地测试网络上了！

https://ethereum.stackexchange.com/questions/65589/return-a-mapping-in-a-getall-function

我们可以通过 Etherscan 找到它：

![image-20211001234830483](https://mmbiz.qpic.cn/mmbiz_png/UrYDA9tqpqWRP31lpFoVMWXImwzMQWy7wO3s4r2FJfpPzpNibAC1ekUEWib23MSpjlEzJjHqnrfoWdKDdE3OFycQ/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

### 3.3 生成静态网站

首先我们切出一个专门托管静态网站的分支：

```bash
git checkout -b gh-pages
```

最好把这个分支放在另一个文件夹下，以免对`gh-pages`分支的改动影响到一些本地的文件，推荐做法是切到另外一个文件夹里：

```bash
git checkout feat/v0x01
git worktree add ../set_purpose_gh_pages gh-pages
```

执行如下命令，我们就会生成可以直接托管到 Github-pages 上的静态网站：

```bash
yarn build
```

![image-20211002000250805](https://mmbiz.qpic.cn/mmbiz_png/UrYDA9tqpqWRP31lpFoVMWXImwzMQWy7byzfaAjr0OcmcSY08icJtJ9NPQ1Xd3ORicopOib3SYURDkyzB3g0fuAXg/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

网站生成在`packages/react-app/build`路径下，我们把这个文件夹内容复制到根目录下的 docs 文件夹下：

```bash
mkdir docs
cp -r packages/react-app/build/* ../set_purpose_gh_pages/docs
```

![image-20211002000605549](https://mmbiz.qpic.cn/mmbiz_png/UrYDA9tqpqWRP31lpFoVMWXImwzMQWy7bKmRWjwkGSTQzFaMWlox7fC5u9pB8eDwaonMU1ylAoHLfKCyAfiaqlw/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

删除其余的文件夹：

```bash
rm -rf packages package.json yarn.lock node_modules
```

检查无误，我们把这个分支推上去：

```bash
g add .
g commit -m "feat/init gh-pages"
git push --set-upstream origin gh-pages
```

### 3.4 Github-pages 设置

然后，在 Repo 的 `Settings`>`Pages`中设置下 **Branches** 和 **Folder**，就可以啦！

![image-20211002002301741](https://mmbiz.qpic.cn/mmbiz_png/UrYDA9tqpqWRP31lpFoVMWXImwzMQWy7LAJoIiaI7fU243jN10fxppfrWEic16Ce6AUMXflWHAgOGh6NuJ5Lo46w/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

点击 绿色框框中的链接，我们就能访问我们第一个部署的 web3 dApp 了！

> https://leeduckgo.github.io/set-purpose

![image-20211002005210633](https://mmbiz.qpic.cn/mmbiz_png/UrYDA9tqpqWRP31lpFoVMWXImwzMQWy7z5TokJgFtg3mibh1c7hTk3tyY1zjhITqzY98GrdZVuBqAel7J3yEt9A/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

## 附：Git Submodule 小贴士

有的时候，我们的 Github Repo 会依赖于其它的 Repo，这个时候就需要使用 Git Submodule 子模块了。

此外，有的时候对代码进行拆分，做模块分离也是让项目结构更有条理的方式。

例如，在本例中我们就对 set-purpose 的主代码和 set-purpose-contracts 进行了分离。

以下是一些`git submodule`命令的小贴士：

```bash
# 查看帮助
git submodule -h
# 添加子模块
git submodule add https://github.com/leeduckgo/set-purpose-contracts.git

# clone 时带上该仓库下的所有子模块
git clone --recurse-submodules https://github.com/leeduckgo/set-purpose.git
# 只拉取指定的子模块
# --init 是第一次拉取时的参数，后面是模块所在的路径
git submodule update --init packages/hardhat/contracts
```
