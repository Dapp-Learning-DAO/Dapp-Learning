## 前言  
区块链信任基础的数据不可修改的特性, 让它传统应用程序有一个很大的不同的地方是一经发布于区块链上就无法修改.  
一方面正式由于智能合约的不可修改的特性, 因为只要规则确定之后, 没人能够修改它, 大家才能够信任它. 但另一方面, 如果规则的实现有Bug, 可能会造成代币被盗, 或是调用消耗大量的gas. 这时就需要我们去修复错误.  
这里介绍一种可升级的合约开发模式. 

## 合约功能说明  
- DataContract  
platform:     权限修饰器, 指定只有拥有权限的用户才能调用此合约  
allowAccess:  给其他用户增加权限  
denyAccess:   取消其他用户的权限  
setBlance:    设置一个用户的余额, 同时这个接口制定了只有用户权限的用户才能调用此接口  
getBlance:    这是一个公共的接口, 任何用户都可以调用此接口  

- ControlContract  
constructor:  在部署合约的时候需要传入 DataContract 的合约地址进行加载  
setBlance:    内部调用 DataContract 合约的 setBlance 接口, 中间可以加入对应的业务逻辑 
getBlance:    调用 DataContract 合约的 getBlance 接口获取账户余额  

## 测试步骤  
- 安装依赖  
```
yarn 
```

- 执行测试  
```
npx hardhat test
```

## controlContract_test.js 主逻辑说明 
controlContract_test.js 在 test 目录, 执行 "npx hardhat test" 的时候就会自动执行这个测试脚本 
脚本中有三个单元测试用例. 
第一个用例是 DataContract 合约的调用, 用于验证只有有权限的用户才能调用合约. 
第二个用例是 ControlContract 调用 DataContract 合约的接口, 用于验证没有权限的用户不能调用合约. 
第三个用例是 DataContract 合约的部署者赋权给 ControlContract 后, ControlContract 可以调用 DataContract 接口, 这样一来, 当业务逻辑有变动的时候, 只需要重新部署一个新的 ControlContract 合约, 然后进行赋权, 就可以实现合约的升级改造.


## 参考文档  
https://zhuanlan.zhihu.com/p/34690916  