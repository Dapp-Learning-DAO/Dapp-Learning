中文 / [English](./README.md)
# web3.py 的基本使用
web3.py是类似于web3.js的在ethereum client API上封装的一层api，熟悉使用它能够让我们对以太坊编程有更好的理解

## 相关工具 
- python语言的常用IDE：[PyCharm](https://www.jetbrains.com/pycharm/) [Visual Studio Code](https://code.visualstudio.com/)
- python版本管理工具：[pyenv](https://github.com/pyenv/pyenv) ，可以用pyenv来安装anaconda或者其他版本的python环境
- ganache-cli: 通过node来安装，快速构建在本地的区块链
- [brownie](https://eth-brownie.readthedocs.io/en/stable/toctree.html) ：作为python的软件包来安装，类似于truffle，使用它可以更方便编译或者生成项目文件，在这里为了演示web3.py的接口，不使用它的其他功能

## 版本依赖 
python: 3.x 版本以上 
env环境支持 `todo`

## 安装 ganache-cli ( ganache-cli 已安装可跳过此步骤 )
- 使用 npm 安装 
```
npm install -g ganache-cli
```

## 安装 web3  
```
pip3 install web3  
```

## 操作步骤
- 启动 ganache-cli
```
ganache-cli
```

- 执行脚本
```
如果安装完python 3 以上版本，以下命令执不通时，使用 “python3" 代替 "python"
## 演示合约构造及部署
python scripts/1_deploy_using_web3.py


## 根据已存在的合约地址构造合约实例
python scripts/2_play_around_on_existing_contract.py

## 使用 openzeppelin 合约演示转账
python scripts/3_use_openzeppelin.py

## 演示 ERC20 合约的调用
python scripts/4_use_openzeppelin_mintable_contract.py

## 演示 ERC20 动态 Mint 调用
python scripts/5_use_openzeppelin_dynamic_mintable_contract.py
```


## 参考链接
https://web3py.readthedocs.io/en/stable/quickstart.html  
https://github.com/pypa/pipx   
