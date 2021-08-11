# Brownie的使用
本项目使用Brownie来运行uniswapv1的test cases，基于brownie的特性对原有的uniswapv1项目
的test进行了重新编写，并且加入了详细的注释

## 安装 Brownie 
- 安装 pipx 
``` 
python3 -m pip install --user pipx
python3 -m pipx ensurepath
``` 

PS: pipx 安装成功后, 需要重启终端命令行窗口  

- 安装 brownie  
```
pipx install eth-brownie
``` 

## 编译合约 
```
brownie compile
```

## 测试合约 
```
brownie test 
```

## 参考链接
- https://eth-brownie.readthedocs.io/en/stable/toctree.html
- https://github.com/Uniswap/old-solidity-contracts 
- https://github.com/Uniswap/uniswap-v1/tree/master/tests
- https://readthedocs.org/projects/eth-brownie/downloads/pdf/v1.3.1_a/