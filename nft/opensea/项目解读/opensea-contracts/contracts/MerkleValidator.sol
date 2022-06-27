/**
 *Submitted for verification at Etherscan.io on 2022-02-02
 */

pragma solidity 0.8.11;

interface IERC721 {
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external;

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external;
}

interface IERC1155 {
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        uint256 amount,
        bytes calldata data
    ) external;
}

/// @title MerkleValidator enables matching trait-based and collection-based orders for ERC721 and ERC1155 tokens.
/// @author 0age
/// @dev This contract is intended to be called during atomicMatch_ via DELEGATECALL.
contract MerkleValidator {
    /// @dev InvalidProof is thrown on invalid proofs.
    error InvalidProof();

    /// @dev UnnecessaryProof is thrown in cases where a proof is supplied without a valid root to match against (root = 0)
    error UnnecessaryProof();

    /// @dev Match an ERC721 order, ensuring that the supplied proof demonstrates inclusion of the tokenId in the associated merkle root.
    /// @param from The account to transfer the ERC721 token from — this token must first be approved on the seller's AuthenticatedProxy contract.
    /// @param to The account to transfer the ERC721 token to.
    /// @param token The ERC721 token to transfer.
    /// @param tokenId The ERC721 tokenId to transfer.
    /// @param root A merkle root derived from each valid tokenId — set to 0 to indicate a collection-level or tokenId-specific order.
    /// @param proof A proof that the supplied tokenId is contained within the associated merkle root. Must be length 0 if root is not set.
    /// @return A boolean indicating a successful match and transfer.
    function matchERC721UsingCriteria(
        address from,
        address to,
        IERC721 token,
        uint256 tokenId,
        bytes32 root,
        bytes32[] calldata proof
    ) external returns (bool) {
        // Proof verification is performed when there's a non-zero root.
        if (root != bytes32(0)) {
            _verifyProof(tokenId, root, proof);
        } else if (proof.length != 0) {
            // A root of zero should never have a proof.
            revert UnnecessaryProof();
        }

        // Transfer the token.
        token.transferFrom(from, to, tokenId);

        return true;
    }

    /// @dev Match an ERC721 order using `safeTransferFrom`, ensuring that the supplied proof demonstrates inclusion of the tokenId in the associated merkle root.
    /// @param from The account to transfer the ERC721 token from — this token must first be approved on the seller's AuthenticatedProxy contract.
    /// @param to The account to transfer the ERC721 token to.
    /// @param token The ERC721 token to transfer.
    /// @param tokenId The ERC721 tokenId to transfer.
    /// @param root A merkle root derived from each valid tokenId — set to 0 to indicate a collection-level or tokenId-specific order.
    /// @param proof A proof that the supplied tokenId is contained within the associated merkle root. Must be length 0 if root is not set.
    /// @return A boolean indicating a successful match and transfer.
    // 提供一个merkle proof、一个merkle root，来证明tokenId是属于你的
    function matchERC721WithSafeTransferUsingCriteria(
        address from,
        address to,
        IERC721 token,
        uint256 tokenId,
        bytes32 root,
        bytes32[] calldata proof
    ) external returns (bool) {
        // Proof verification is performed when there's a non-zero root.
        if (root != bytes32(0)) {
            _verifyProof(tokenId, root, proof);
        } else if (proof.length != 0) {
            // A root of zero should never have a proof.
            revert UnnecessaryProof();
        }

        // Transfer the token.
        token.safeTransferFrom(from, to, tokenId);

        return true;
    }

    /// @dev Match an ERC1155 order, ensuring that the supplied proof demonstrates inclusion of the tokenId in the associated merkle root.
    /// @param from The account to transfer the ERC1155 token from — this token must first be approved on the seller's AuthenticatedProxy contract.
    /// @param to The account to transfer the ERC1155 token to.
    /// @param token The ERC1155 token to transfer.
    /// @param tokenId The ERC1155 tokenId to transfer.
    /// @param amount The amount of ERC1155 tokens with the given tokenId to transfer.
    /// @param root A merkle root derived from each valid tokenId — set to 0 to indicate a collection-level or tokenId-specific order.
    /// @param proof A proof that the supplied tokenId is contained within the associated merkle root. Must be length 0 if root is not set.
    /// @return A boolean indicating a successful match and transfer.
    function matchERC1155UsingCriteria(
        address from,
        address to,
        IERC1155 token,
        uint256 tokenId,
        uint256 amount,
        bytes32 root,
        bytes32[] calldata proof
    ) external returns (bool) {
        // Proof verification is performed when there's a non-zero root.
        if (root != bytes32(0)) {
            _verifyProof(tokenId, root, proof);
        } else if (proof.length != 0) {
            // A root of zero should never have a proof.
            revert UnnecessaryProof();
        }

        // Transfer the token.
        token.safeTransferFrom(from, to, tokenId, amount, "");

        return true;
    }

    /// @dev Ensure that a given tokenId is contained within a supplied merkle root using a supplied proof.
    /// @param leaf The tokenId.
    /// @param root A merkle root derived from each valid tokenId.
    /// @param proof A proof that the supplied tokenId is contained within the associated merkle root.
    function _verifyProof(
        uint256 leaf,
        bytes32 root,
        bytes32[] memory proof
    ) private pure {
        bytes32 computedHash = bytes32(leaf);
        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];
            if (computedHash <= proofElement) {
                // Hash(current computed hash + current element of the proof)
                computedHash = _efficientHash(computedHash, proofElement);
            } else {
                // Hash(current element of the proof + current computed hash)
                computedHash = _efficientHash(proofElement, computedHash);
            }
        }
        if (computedHash != root) {
            revert InvalidProof();
        }
    }

    /// @dev Efficiently hash two bytes32 elements using memory scratch space.
    /// @param a The first element included in the hash.
    /// @param b The second element included in the hash.
    /// @return value The resultant hash of the two bytes32 elements.
    function _efficientHash(bytes32 a, bytes32 b)
        private
        pure
        returns (bytes32 value)
    {
        assembly {
            mstore(0x00, a)
            mstore(0x20, b)
            value := keccak256(0x00, 0x40)
        }
    }
}
