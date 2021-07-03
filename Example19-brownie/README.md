# Brownie的使用

[Brownie官方网站](https://eth-brownie.readthedocs.io/en/stable/toctree.html)

## Brownie的安装
- Brownie其实就是一个python的安装包，可以通过pip install eth-brownie直接安装，或者[根据教程](https://eth-brownie.readthedocs.io/en/stable/install.html)
- 同时需要安装ganache来配合使用

## Brownie的基础命令
- brownie init生成新的项目文件
- brownie bake something 类似于truffle的box，从已有的模板生成项目
- brownie compile: 编译contracts中所有的solidity文件

## Brownie的方便的功能
- 可以导入非常多的类，如accounts, Contract, web3等，这些类比web3.py更加方便
- 比如accounts还具有一些特殊的功能，自由添加某个账户，通过private key来添加账户等，为账户设置金额等

## Brownie的test
它使用的是pytest，与之对比，truffle中使用了mocha？本Example以uniswapv1的test代码为例展示brownie中test是
如何进行的

- conftest是一个pytest的特殊文件，它会为它的同级目录及子目录进行初始化等操作
- 具体运行方式即 brownie test 非常简洁明了，代码中的内容见注释，详细原理需要阅读uniswapv1的白皮书


