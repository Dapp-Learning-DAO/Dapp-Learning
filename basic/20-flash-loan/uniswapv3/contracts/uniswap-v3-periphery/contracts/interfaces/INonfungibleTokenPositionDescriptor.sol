// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.5.0;

import './INonfungiblePositionManager.sol';

/// @title Describes position NFT tokens via URI
interface INonfungibleTokenPositionDescriptor {
    /// @notice Emitted when a token is given a new priority order in the displayed price ratio
    /// @param token The token being given priority order
    /// @param priority Represents priority in ratio - higher integers get numerator priority
    event UpdateTokenRatioPriority(address token, int256 priority);

    /// @notice Produces the URI describing a particular token ID for a position manager
    /// @dev Note this URI may be a data: URI with the JSON contents directly inlined
    /// @param positionManager The position manager for which to describe the token
    /// @param tokenId The ID of the token for which to produce a description, which may not be valid
    /// @return The URI of the ERC721-compliant metadata
    function tokenURI(INonfungiblePositionManager positionManager, uint256 tokenId)
        external
        view
        returns (string memory);
}
