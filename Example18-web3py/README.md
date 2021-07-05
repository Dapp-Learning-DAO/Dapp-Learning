# web3.py 的基本使用
web3.py是类似于web3.js的在ethereum client API上封装的一层api，熟悉使用它能够让我们对以太坊编程有更好的理解

## 相关依赖
- python语言的常用IDE：[PyCharm](https://www.jetbrains.com/pycharm/)
- python版本管理工具：[pyenv](https://github.com/pyenv/pyenv) ，可以用pyenv来安装anaconda或者其他版本的python环境
- node
- ganache-cli: 通过node来安装，快速构建在本地的区块链
- [brownie](https://eth-brownie.readthedocs.io/en/stable/toctree.html) ：作为python的软件包来安装，类似于truffle，使用它可以更方便编译或者生成项目文件，在这里为了演示web3.py的接口，不使用它的其他功能

## 安装 ganache-cli ( ganache-cli 已安装可跳过此步骤 )
- 使用 npm 安装 
```
npm install -g ganache-cli
```

## 安装 brownie
- 安装 pipenv
```
pip3 install pipenv
```

## 操作步骤
- 启动 ganache-cli
```
ganache-cli
```

- 安装 pip 依赖
```
pipenv install --skip-lock
```

- 进入 pipenv
```
pipenv shell
```

- 执行脚本
```
python 1_deploy_using_web3.py
```


## 参考链接
https://web3py.readthedocs.io/en/stable/quickstart.html  
https://github.com/pypa/pipx   
