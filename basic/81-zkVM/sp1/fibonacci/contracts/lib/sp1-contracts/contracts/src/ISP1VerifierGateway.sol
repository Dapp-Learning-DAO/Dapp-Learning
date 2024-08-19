// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ISP1Verifier} from "./ISP1Verifier.sol";

/// @dev A struct containing the address of a verifier and whether the verifier is frozen. A
/// frozen verifier cannot be routed to.
struct VerifierRoute {
    address verifier;
    bool frozen;
}

interface ISP1VerifierGatewayEvents {
    /// @notice Emitted when a verifier route is added.
    /// @param selector The verifier selector that was added.
    /// @param verifier The address of the verifier contract.
    event RouteAdded(bytes4 selector, address verifier);

    /// @notice Emitted when a verifier route is frozen.
    /// @param selector The verifier selector that was frozen.
    /// @param verifier The address of the verifier contract.
    event RouteFrozen(bytes4 selector, address verifier);
}

interface ISP1VerifierGatewayErrors {
    /// @notice Thrown when the verifier route is not found.
    /// @param selector The verifier selector that was specified.
    error RouteNotFound(bytes4 selector);

    /// @notice Thrown when the verifier route is found, but is frozen.
    /// @param selector The verifier selector that was specified.
    error RouteIsFrozen(bytes4 selector);

    /// @notice Thrown when adding a verifier route and the selector already contains a route.
    /// @param verifier The address of the verifier contract in the existing route.
    error RouteAlreadyExists(address verifier);

    /// @notice Thrown when adding a verifier route and the selector returned by the verifier is
    /// zero.
    error SelectorCannotBeZero();
}

/// @title SP1 Verifier Gateway Interface
/// @author Succinct Labs
/// @notice This contract is the interface for the SP1 Verifier Gateway.
interface ISP1VerifierGateway is
    ISP1VerifierGatewayEvents,
    ISP1VerifierGatewayErrors,
    ISP1Verifier
{
    /// @notice Mapping of 4-byte verifier selectors to verifier routes.
    /// @dev Only one verifier route can be added for each selector.
    /// @param selector The verifier selector, which is both the first 4 bytes of the VERIFIER_HASH
    /// and the first 4 bytes of the proofs designed for that verifier.
    /// @return verifier The address of the verifier contract.
    /// @return frozen Whether the verifier is frozen.
    function routes(bytes4 selector) external view returns (address verifier, bool frozen);

    /// @notice Adds a verifier route. This enable proofs to be routed to this verifier.
    /// @dev Only callable by the owner. The owner is responsible for ensuring that the specified
    /// verifier is correct with a valid VERIFIER_HASH. Once a route to a verifier is added, it
    /// cannot be removed.
    /// @param verifier The address of the verifier contract. This verifier MUST implement the
    /// ISP1VerifierWithHash interface.
    function addRoute(address verifier) external;

    /// @notice Freezes a verifier route. This prevents proofs from being routed to this verifier.
    /// @dev Only callable by the owner. Once a route to a verifier is frozen, it cannot be
    /// unfrozen.
    /// @param selector The verifier selector to freeze.
    function freezeRoute(bytes4 selector) external;
}
