// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.6.12;

import "./ControlledToken.sol";
import "../external/openzeppelin/ProxyFactory.sol";

/// @title Controlled ERC20 Token Factory
/// @notice Minimal proxy pattern for creating new Controlled ERC20 Tokens
contract ControlledTokenProxyFactory is ProxyFactory {

  /// @notice Contract template for deploying proxied tokens
  ControlledToken public instance;

  /// @notice Initializes the Factory with an instance of the Controlled ERC20 Token
  constructor () public {
    instance = new ControlledToken();
  }

  /// @notice Creates a new Controlled ERC20 Token as a proxy of the template instance
  /// @return A reference to the new proxied Controlled ERC20 Token
  function create() external returns (ControlledToken) {
    return ControlledToken(deployMinimal(address(instance), ""));
  }
}
