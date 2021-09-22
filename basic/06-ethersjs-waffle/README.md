## 前言
Waffle 是一款适配 ehterjs 的智能合约测试库。本样例演示了使用 Waffle 进行测试的基本流程及使用方法.   
Waffle 详细使用方法可以参考 [Waffle 官网](https://ethereum-waffle.readthedocs.io/en/latest/getting-started.html) , 
对于不熟悉 Waffle 测试框架的开发者, 可以根据本样例进行基础的操作, 阅读样例代码, 形成初步的流程概念, 之后再参考官网进行更加深入的了解.   
## 合约介绍    
- contract/SimpleToken.sol  
一个标准的 ERC20 合约, 实现了 ERC20 的所有接口, 用户可以使用这个合约进行 ERC20 代币的发放   

## 脚本介绍  
- test/simpleTokenTest.js  
SimpleToken.sol 合约的单元测试代码. 这里只写了一个测试脚本, 实际开发中, 可以在 test 目录下, 针对不同的合约, 编写多个单元测试脚本, 之后使用 yarn test 命令即可执行 test 目录下所有的单元测试脚本.    
在 simpleTokenTest.js 脚本中, 对 SimpleToken.sol 合约的各个接口进行简单的测试, 可以参考此样例编写其他合约的单元测试代码. 

- index.js  
外部合约, 需要单独进行调用. 对应实际生产环境中, 当单元测试通过后, 就可以调用此脚本进行实际的生成操作.  
此脚本名字自行进行定义, 这里是使用 index.js 进行指定

## 操作步骤  
- 1 安装依赖
```
yarn install
```

- 2 编译合约：
```
yarn build
```

- 3 执行测试  
```
yarn test
``` 

- 4 测试 index.js  
```
node index.js
```

## 参考文档
waffle 官方文档： 
https://ethereum-waffle.readthedocs.io/en/latest/getting-started.html     

ehterjs 官方文档：
https://docs.ethers.io/v4/api-providers.html   
https://docs.ethers.io/v5/getting-started/#getting-started--contracts   

中文文档： 
https://learnblockchain.cn/docs/ethers.js/api-providers.html  