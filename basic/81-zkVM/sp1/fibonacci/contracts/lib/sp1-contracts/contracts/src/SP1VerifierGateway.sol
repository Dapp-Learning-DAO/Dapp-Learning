// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ISP1Verifier, ISP1VerifierWithHash} from "./ISP1Verifier.sol";
import {ISP1VerifierGateway, VerifierRoute} from "./ISP1VerifierGateway.sol";
import {Ownable} from "lib/openzeppelin-contracts/contracts/access/Ownable.sol";

/// @title SP1 Verifier Gateway
/// @author Succinct Labs
/// @notice This contract verifies proofs by routing to the correct verifier based on the verifier
/// selector contained in the first 4 bytes of the proof. It additionally checks that to see that
/// the verifier route is not frozen.
contract SP1VerifierGateway is ISP1VerifierGateway, Ownable {
    /// @inheritdoc ISP1VerifierGateway
    mapping(bytes4 => VerifierRoute) public routes;

    constructor(address initialOwner) Ownable(initialOwner) {}

    /// @inheritdoc ISP1Verifier
    function verifyProof(
        bytes32 programVKey,
        bytes calldata publicValues,
        bytes calldata proofBytes
    ) external view {
        bytes4 selector = bytes4(proofBytes[:4]);
        VerifierRoute memory route = routes[selector];
        if (route.verifier == address(0)) {
            revert RouteNotFound(selector);
        } else if (route.frozen) {
            revert RouteIsFrozen(selector);
        }

        ISP1Verifier(route.verifier).verifyProof(programVKey, publicValues, proofBytes);
    }

    /// @inheritdoc ISP1VerifierGateway
    function addRoute(address verifier) external onlyOwner {
        bytes4 selector = bytes4(ISP1VerifierWithHash(verifier).VERIFIER_HASH());
        if (selector == bytes4(0)) {
            revert SelectorCannotBeZero();
        }

        VerifierRoute storage route = routes[selector];
        if (route.verifier != address(0)) {
            revert RouteAlreadyExists(route.verifier);
        }

        route.verifier = verifier;

        emit RouteAdded(selector, verifier);
    }

    /// @inheritdoc ISP1VerifierGateway
    function freezeRoute(bytes4 selector) external onlyOwner {
        VerifierRoute storage route = routes[selector];
        if (route.verifier == address(0)) {
            revert RouteNotFound(selector);
        }
        if (route.frozen) {
            revert RouteIsFrozen(selector);
        }

        route.frozen = true;

        emit RouteFrozen(selector, route.verifier);
    }
}
