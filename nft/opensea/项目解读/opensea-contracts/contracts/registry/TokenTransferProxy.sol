/*

  Token transfer proxy. Uses the authentication table of a ProxyRegistry contract to grant ERC20 `transferFrom` access.
  This means that users only need to authorize the proxy contract once for all future protocol versions.

*/

pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

import "./ProxyRegistry.sol";

contract TokenTransferProxy {
    /* Authentication registry. */
    ProxyRegistry public registry;

    /**
     * Call ERC20 `transferFrom`
     *
     * @dev Authenticated contract only
     * @param token ERC20 token address
     * @param from From address
     * @param to To address
     * @param amount Transfer amount
     */
    function transferFrom(
        address token,
        address from,
        address to,
        uint256 amount
    ) public returns (bool) {
        require(registry.contracts(msg.sender));
        return ERC20(token).transferFrom(from, to, amount);
    }
}
