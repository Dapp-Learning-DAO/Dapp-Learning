[中文](./README-CN.md) / English
# Basic usage of web3.py
web3.py is a wrapped API based on the ethereum client API similar to web3.js. Familiarity with using it can give us a better understanding of programming on ethereum 

## Related tools
- Common IDE for python: [PyCharm](https://www.jetbrains.com/pycharm/) [Visual Studio Code](https://code.visualstudio.com/)
- python version management tool: [pyenv](https://github.com/pyenv/pyenv), you can use pyenv to install anaconda or other versions of python environment
- ganache-cli: Install through node, quickly build a local blockchain
- [brownie](https://eth-brownie.readthedocs.io/en/stable/toctree.html): Installed as a python package, similar to truffle, it can be used to compile or generate projects more easily, in Here, just to demonstrate the interface of web3.py, its other functions are not used

## Version dependencies
python: version 3.x and above
env environment support `todo`

## Install ganache-cli (If ganache-cli is already installed, skip this)
- Install using npm
```
npm install -g ganache-cli
```

## install web3
```
pip3 install web3
```

## Steps
- start ganache-cli
```
ganache-cli
```

- execute script
```
If the following command cannot be executed after installing Python 3 or above, use "python3" instead of "python"“
## Demonstrate contract construction and deployment
python scripts/1_deploy_using_web3.py

## Construct a contract instance based on the existing contract address
python scripts/2_play_around_on_existing_contract.py

## Demo of transfer using openzeppelin contract
python scripts/3_use_openzeppelin.py

## Demonstrate the call of the ERC20 contract
python scripts/4_use_openzeppelin_mintable_contract.py

## Demonstrate ERC20 dynamic Mint call
python scripts/5_use_openzeppelin_dynamic_mintable_contract.py
```


## Reference link
https://web3py.readthedocs.io/en/stable/quickstart.html
https://github.com/pypa/pipx