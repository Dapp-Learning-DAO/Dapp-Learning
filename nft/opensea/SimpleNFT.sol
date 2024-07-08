// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.24;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';

contract SimpleNFT is ERC721 {
    error SimpleNFT__TokenUriNotFound();

    uint256 private s_tokenCounter;
    mapping(uint256 tokenID => string tokenURI) private s_tokenIdToUri;

    constructor() ERC721('Resume', 'RE') {
        s_tokenCounter = 0;
    }

    function mintNft(string memory _tokenURI) public {
        s_tokenIdToUri[s_tokenCounter] = _tokenURI;
        _safeMint(msg.sender, s_tokenCounter);
        s_tokenCounter++;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (ownerOf(tokenId) == address(0)) {
            revert SimpleNFT__TokenUriNotFound();
        }
        return s_tokenIdToUri[tokenId];
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }
}
