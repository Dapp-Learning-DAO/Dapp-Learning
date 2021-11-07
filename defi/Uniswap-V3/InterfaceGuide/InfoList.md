# 相关信息列表

## 演示环境

- rinkeby 测试网络
- V3SwapRouter `0xE592427A0AEce92De3Edee1F18E0157C05861564`
- PositionManager `0xC36442b4a4522E871399CD717aBDD847Ab11FE88`
- 自定义 token HEHE(HH) `0x6583989a0b7b86b026e50C4D0fa0FE1C5e3e8f85`
- HHH-WETH-Pool `0x2c0bd19fc5f7e8e01530f2822bf1a2fb15d3d70b`
- HHH-WETH-NFT, position id: `5264`, price range: 90.168 - 109.91 (HH per ETH)
- HHH-WETH-NFT, position id: `5266`, price range: 100.45 - 101.06 (HH per ETH)
- 测试网 DAI `0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735`

## 相关合约的 Methodid

### PositionManager(NFT/ERC721)

| method name                                                                                     | method id  |
| ----------------------------------------------------------------------------------------------- | ---------- |
| DOMAIN_SEPARATOR()                                                                              | 0x3644e515 |
| PERMIT_TYPEHASH()                                                                               | 0x30adf81f |
| WETH9()                                                                                         | 0x4aa4a4fc |
| approve(address,uint256)                                                                        | 0x095ea7b3 |
| balanceOf(address)                                                                              | 0x70a08231 |
| baseURI()                                                                                       | 0x6c0360eb |
| burn(uint256)                                                                                   | 0x42966c68 |
| collect(tuple(uint256,address,uint128,uint128))                                                 | 0xfc6f7865 |
| createAndInitializePoolIfNecessary(address,address,uint24,uint160)                              | 0x13ead562 |
| decreaseLiquidity(tuple(uint256,uint128,uint256,uint256,uint256))                               | 0x0c49ccbe |
| factory()                                                                                       | 0xc45a0155 |
| getApproved(uint256)                                                                            | 0x081812fc |
| increaseLiquidity(tuple(uint256,uint256,uint256,uint256,uint256,uint256))                       | 0x219f5d17 |
| isApprovedForAll(address,address)                                                               | 0xe985e9c5 |
| mint(tuple(address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256)) | 0x88316456 |
| multicall(bytes[])                                                                              | 0xac9650d8 |
| name()                                                                                          | 0x06fdde03 |
| ownerOf(uint256)                                                                                | 0x6352211e |
| permit(address,uint256,uint256,uint8,bytes32,bytes32)                                           | 0x7ac2ff7b |
| positions(uint256)                                                                              | 0x99fbab88 |
| refundETH()                                                                                     | 0x12210e8a |
| safeTransferFrom(address,address,uint256)                                                       | 0x42842e0e |
| safeTransferFrom(address,address,uint256,bytes)                                                 | 0xb88d4fde |
| selfPermit(address,uint256,uint256,uint8,bytes32,bytes32)                                       | 0xf3995c67 |
| selfPermitAllowed(address,uint256,uint256,uint8,bytes32,bytes32)                                | 0x4659a494 |
| selfPermitAllowedIfNecessary(address,uint256,uint256,uint8,bytes32,bytes32)                     | 0xa4a78f0c |
| selfPermitIfNecessary(address,uint256,uint256,uint8,bytes32,bytes32)                            | 0xc2e3140a |
| setApprovalForAll(address,bool)                                                                 | 0xa22cb465 |
| supportsInterface(bytes4)                                                                       | 0x01ffc9a7 |
| sweepToken(address,uint256,address)                                                             | 0xdf2ab5bb |
| symbol()                                                                                        | 0x95d89b41 |
| tokenByIndex(uint256)                                                                           | 0x4f6ccce7 |
| tokenOfOwnerByIndex(address,uint256)                                                            | 0x2f745c59 |
| tokenURI(uint256)                                                                               | 0xc87b56dd |
| totalSupply()                                                                                   | 0x18160ddd |
| transferFrom(address,address,uint256)                                                           | 0x23b872dd |
| uniswapV3MintCallback(uint256,uint256,bytes)                                                    | 0xd3487997 |
| unwrapWETH9(uint256,address)                                                                    | 0x49404b7c |

### ERC20

| method name        | method id  |
| ------------------ | ---------- |
| DEFAULT_ADMIN_ROLE | 0xa217fddf |
| INITIAL_SUPPLY     | 0x2ff2e9dc |
| MINTER_ROLE        | 0xd5391393 |
| PAUSER_ROLE        | 0xe63ab1e9 |
| allowance          | 0xdd62ed3e |
| approve            | 0x095ea7b3 |
| balanceOf          | 0x70a08231 |
| burn               | 0x42966c68 |
| burnFrom           | 0x79cc6790 |
| decimals           | 0x313ce567 |
| decreaseAllowance  | 0xa457c2d7 |
| getRoleAdmin       | 0x248a9ca3 |
| getRoleMember      | 0x9010d07c |
| getRoleMemberCount | 0xca15c873 |
| grantRole          | 0x2f2ff15d |
| hasRole            | 0x91d14854 |
| increaseAllowance  | 0x39509351 |
| mint               | 0x40c10f19 |
| name               | 0x06fdde03 |
| pause              | 0x8456cb59 |
| paused             | 0x5c975abb |
| renounceRole       | 0x36568abe |
| revokeRole         | 0xd547741f |
| supportsInterface  | 0x01ffc9a7 |
| symbol             | 0x95d89b41 |
| totalSupply        | 0x18160ddd |
| transfer           | 0xa9059cbb |
| transferFrom       | 0x23b872dd |
| unpause            | 0x3f4ba83a |

### SwapRouter(V3)

| method name                                                                              | method id  |
| ---------------------------------------------------------------------------------------- | ---------- |
| WETH9()                                                                                  | 0x4aa4a4fc |
| exactInput(tuple(bytes,address,uint256,uint256,uint256))                                 | 0xc04b8d59 |
| exactInputSingle(tuple(address,address,uint24,address,uint256,uint256,uint256,uint160))  | 0x414bf389 |
| exactOutput(tuple(bytes,address,uint256,uint256,uint256))                                | 0xf28c0498 |
| exactOutputSingle(tuple(address,address,uint24,address,uint256,uint256,uint256,uint160)) | 0xdb3e2198 |
| factory()                                                                                | 0xc45a0155 |
| multicall(bytes[])                                                                       | 0xac9650d8 |
| refundETH()                                                                              | 0x12210e8a |
| selfPermit(address,uint256,uint256,uint8,bytes32,bytes32)                                | 0xf3995c67 |
| selfPermitAllowed(address,uint256,uint256,uint8,bytes32,bytes32)                         | 0x4659a494 |
| selfPermitAllowedIfNecessary(address,uint256,uint256,uint8,bytes32,bytes32)              | 0xa4a78f0c |
| selfPermitIfNecessary(address,uint256,uint256,uint8,bytes32,bytes32)                     | 0xc2e3140a |
| sweepToken(address,uint256,address)                                                      | 0xdf2ab5bb |
| sweepTokenWithFee(address,uint256,address,uint256,address)                               | 0xe0e189a0 |
| uniswapV3SwapCallback(int256,int256,bytes)                                               | 0xfa461e33 |
| unwrapWETH9(uint256,address)                                                             | 0x49404b7c |
| unwrapWETH9WithFee(uint256,address,uint256,address)                                      | 0x9b2c0a37 |
