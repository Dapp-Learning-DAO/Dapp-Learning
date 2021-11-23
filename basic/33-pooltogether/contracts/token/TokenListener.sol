pragma solidity ^0.6.4;

import "./TokenListenerInterface.sol";
import "./TokenListenerLibrary.sol";
import "../Constants.sol";

abstract contract TokenListener is TokenListenerInterface {
  function supportsInterface(bytes4 interfaceId) external override view returns (bool) {
    return (
      interfaceId == Constants.ERC165_INTERFACE_ID_ERC165 || 
      interfaceId == TokenListenerLibrary.ERC165_INTERFACE_ID_TOKEN_LISTENER
    );
  }
}
