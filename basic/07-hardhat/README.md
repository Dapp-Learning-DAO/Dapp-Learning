## Hardhat 介绍  
Hardhat是一个编译、部署、测试和调试以太坊应用的开发环境。它可以帮助开发人员管理和自动化构建智能合约和dApps过程中固有的重复性任务，并围绕这一工作流程轻松引入更多功能。这意味着hardhat在最核心的地方是编译、运行和测试智能合约。
Hardhat内置了Hardhat网络，这是一个专为开发设计的本地以太坊网络。主要功能有Solidity调试，跟踪调用堆栈、console.log()和交易失败时的明确错误信息提示等。  
Hardhat Runner是与Hardhat交互的CLI命令，是一个可扩展的任务运行器。它是围绕任务和插件的概念设计的。每次你从CLI运行Hardhat时，你都在运行一个任务。例如，npx hardhat compile运行的是内置的compile任务。任务可以调用其他任务，允许定义复杂的工作流程。用户和插件可以覆盖现有的任务，从而定制和扩展工作流程。

Hardhat的很多功能都来自于插件，而作为开发者，你可以自由选择想使用的插件。  

为方便获取，在 .env 中放入的私钥，格式为 "PRIVATE_KEY=xxxx", 然后代码自动从中读取
 
- npx介绍 
https://www.ruanyifeng.com/blog/2019/02/npx.html  
npx 想要解决的主要问题，就是调用项目内部安装的模块。  

- ethers.js 和 hardhat 基础使用讲解  
https://www.bilibili.com/video/BV1Pv411s7Nb  

## 操作步骤
- 1 安装nodejs 并配置cnpm  （略）


- 2 安装项目依赖：
```cnpm install   
```

- 3 配置私钥和网络：
```
copy .env.example .env (windows)    /
cp  .env.example .env (linux)
```

- 4 编译合约
```
 npx hardhat compile
```

- 5 跑测试：(内置节点为Hardhat Network)
```
 npx hardhat test 
```

- 6 console.log调试合约:

	合约引入：
	```
	import "hardhat/console.sol";
	```

- 7 部署到测试网：

	hardhat.config.js 文件中添加一个network条目

	```
	npx hardhat run scripts/deploy.js --network <network-name>
	```

## 参考文档  
hardhat官方文档: https://hardhat.org/guides/project-setup.html   
hardhat中文文档: https://learnblockchain.cn/docs/hardhat/getting-started/ 
https://rahulsethuram.medium.com/the-new-solidity-dev-stack-buidler-ethers-waffle-typescript-tutorial-f07917de48ae  

