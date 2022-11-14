// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract DummyNFT is ERC721{

    constructor() ERC721("Dummy", "DUMMY"){
        _mint(msg.sender, 1);
    }
}