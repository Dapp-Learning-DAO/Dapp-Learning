
pragma solidity ^0.8.0;

import "./ERC721PresetMinterPauserAutoId.sol";

contract MYERC721 is ERC721PresetMinterPauserAutoId {
    constructor(string memory _name, string memory _symbol, string memory _baseTokenURI) public ERC721PresetMinterPauserAutoId(_name, _symbol,_baseTokenURI)
    {
    }
    
}