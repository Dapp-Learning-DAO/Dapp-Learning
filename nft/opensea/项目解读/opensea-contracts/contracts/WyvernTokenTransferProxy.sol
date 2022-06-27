/*

  << Project Wyvern Token Transfer Proxy >.

*/

pragma solidity ^0.4.23;

import "./registry/TokenTransferProxy.sol";

/**
  用户需要授权转账给这个合约地址
 */
contract WyvernTokenTransferProxy is TokenTransferProxy {
    constructor(ProxyRegistry registryAddr) public {
        registry = registryAddr;
    }
}
