/**
 *Submitted for verification at Etherscan.io on 2021-03-31
 */

/**
 *Submitted for verification at Etherscan.io on 2018-06-12
 */

pragma solidity ^0.4.13;

import "./registry/ProxyRegistry.sol";
import "./registry/AuthenticatedProxy.sol";

contract WyvernProxyRegistry is ProxyRegistry {
    string public constant name = "Project Wyvern Proxy Registry";

    /* Whether the initial auth address has been set. */
    bool public initialAddressSet = false;

    constructor() public {
        delegateProxyImplementation = new AuthenticatedProxy();
    }

    /**
     * Grant authentication to the initial Exchange protocol contract
     * 初始化添加authAddress作为白名单
     * @dev No delay, can only be called once - after that the standard registry process with a delay must be used
     * @param authAddress Address of the contract to grant authentication
     */
    function grantInitialAuthentication(address authAddress) public onlyOwner {
        require(!initialAddressSet);
        initialAddressSet = true;
        contracts[authAddress] = true;
    }
}
