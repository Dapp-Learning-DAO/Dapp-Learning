# web3.py 的基本使用
web3.py是类似于web3.js的在ethereum client API上封装的一层api，熟悉使用它能够让我们对以太坊编程有更好的理解

## Dependencies
- python语言的常用IDE：[PyCharm](https://www.jetbrains.com/pycharm/)
- python版本管理工具：[pyenv](https://github.com/pyenv/pyenv) ，可以用pyenv来安装anaconda或者其他版本的python环境
- node
- ganache-cli: 通过node来安装，快速构建在本地的区块链
- [brownie](https://eth-brownie.readthedocs.io/en/stable/toctree.html) ：作为python的软件包来安装，类似于truffle，使用它可以更方便编译或者生成项目文件，在这里为了演示web3.py的接口，不使用它的其他功能

## Steps
- ganache-cli运行ganache链，在默认配置下会生成10个测试账号，每个中有100ETH，一般可以通过 localhost:8545 来链接，值得注意
的是ganache会为我们管理这10个测试账号的私钥，这样我们可以在脚本中直接使用send_transaction而不必对其进行显式签名
 

- 建立项目，目录结构如下：
  - Project/
    - build/
    - contracts/
      - contract1.sol
      - contract2.sol
      - ...
    - scripts/
    - tests/
    - README.md
    - .gitignore
      
- 编译contracts中的智能合约，可以参考solidity官网的编译指南（各种框架都能很方便地编译，这里为了展示原始的步骤）

- 以ERC20代币发行为例来说明如何在ganache上发行一种代币，从[openZeppelin](https://github.com/OpenZeppelin/openzeppelin-contracts) 的网站上可以
下载模板程序，将其拷贝到相关目录结构中


## 参考链接
https://web3py.readthedocs.io/en/stable/quickstart.html  
