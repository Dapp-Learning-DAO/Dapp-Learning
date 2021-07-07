
pragma solidity ^0.4.25;

import "./ERC721Enumerable.sol";
import "./ERC721Pausable.sol";
import "./ERC721Burnable.sol";
import "./ERC721MetadataMintable.sol";
import "./ERC721Holder.sol";

contract MYERC721 is ERC721MetadataMintable,ERC721Enumerable, ERC721Burnable,ERC721Pausable,ERC721Holder {
    constructor(string _name, string _symbol) public ERC721Metadata(_name, _symbol)
    {
    }
    
}