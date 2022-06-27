/**
 *Submitted for verification at Etherscan.io on 2022-04-23
 */

/**
 *Submitted for verification at Etherscan.io on 2022-02-01
 */
pragma solidity ^0.4.23;
import "./exchange/Exchange.sol";
import "./registry/TokenTransferProxy.sol";
import "./registry/ProxyRegistry.sol";

contract WyvernExchangeWithBulkCancellations is Exchange {
    string public constant codename = "";

    /**
     * @dev Initialize a WyvernExchange instance
     * @param registryAddress Address of the registry instance which this Exchange instance will use
     * @param tokenAddress Address of the token used for protocol fees
     */
    constructor(
        ProxyRegistry registryAddress,
        TokenTransferProxy tokenTransferProxyAddress,
        ERC20 tokenAddress,
        address protocolFeeAddress
    ) public {
        registry = registryAddress;
        tokenTransferProxy = tokenTransferProxyAddress;
        exchangeToken = tokenAddress;
        protocolFeeRecipient = protocolFeeAddress;
        owner = msg.sender;
    }
}
