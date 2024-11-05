// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SoulboundToken is ERC721Enumerable, Ownable {
    uint256 private _tokenIdCounter;

    // Mapping to track if a token is soulbound (non-transferable)
    mapping(uint256 => bool) private _soulboundTokens;

    constructor() ERC721("SoulboundToken", "SBT") {}

    function mint(address to) external onlyOwner {
        _tokenIdCounter++;
        uint256 newTokenId = _tokenIdCounter;

        _mint(to, newTokenId);
        _soulboundTokens[newTokenId] = true; // Mark token as soulbound
    }

    function isSoulbound(uint256 tokenId) external view returns (bool) {
        return _soulboundTokens[tokenId];
    }

    // Override transfer functions to prevent transfers of soulbound tokens
    function transferFrom(address from, address to, uint256 tokenId) public override(ERC721, IERC721) {
        require(!_soulboundTokens[tokenId], "This token is soulbound and cannot be transferred");
        super.transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public override(ERC721, IERC721) {
        require(!_soulboundTokens[tokenId], "This token is soulbound and cannot be transferred");
        super.safeTransferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory _data) public override(ERC721, IERC721) {
        require(!_soulboundTokens[tokenId], "This token is soulbound and cannot be transferred");
        super.safeTransferFrom(from, to, tokenId, _data);
    }
}
