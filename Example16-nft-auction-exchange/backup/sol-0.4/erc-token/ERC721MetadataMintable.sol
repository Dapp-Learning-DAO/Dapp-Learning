pragma solidity ^0.4.25;

import "./ERC721Metadata.sol";
import "./Roles.sol";

//contract MinterRole {
//    using Roles for Roles.Role;
//
//    event MinterAdded(address indexed account);
//    event MinterRemoved(address indexed account);
//
//    Roles.Role private _minters;
//
//    constructor () internal {
//        _addMinter(msg.sender);
//    }
//
//    modifier onlyMinter() {
//        require(isMinter(msg.sender), "MinterRole: caller does not have the Minter role");
//        _;
//    }
//
//    function isMinter(address account) public view returns (bool) {
//        return _minters.has(account);
//    }
//
//    function addMinter(address account) public onlyMinter {
//        _addMinter(account);
//    }
//
//    function renounceMinter() public {
//        _removeMinter(msg.sender);
//    }
//
//    function _addMinter(address account) internal {
//        _minters.add(account);
//        emit MinterAdded(account);
//    }
//
//    function _removeMinter(address account) internal {
//        _minters.remove(account);
//        emit MinterRemoved(account);
//    }
//}
/**
 * @title ERC721MetadataMintable
 * @dev ERC721 minting logic with metadata.
 */
contract ERC721MetadataMintable is  ERC721, ERC721Metadata {
    /**
     * @dev Function to mint tokens.
     * @param to The address that will receive the minted tokens.
     * @param tokenId The token id to mint.
     * @param tokenURI The token URI of the minted token.
     * @return A boolean that indicates if the operation was successful.
     */
    //!!! everyone can mint
//    function mintWithTokenURI(address to, uint256 tokenId, string memory tokenURI) public onlyMinter returns (bool) {
//        _mint(to, tokenId);
//        _setTokenURI(tokenId, tokenURI);
//        return true;
//    }
    Counters.Counter private _tokenIdTracker;

    function mintWithTokenURI(address to, string memory tokenURI) public  returns (bool) {
        _mint(to, _tokenIdTracker.current());
        _setTokenURI(_tokenIdTracker.current(), tokenURI);
        _tokenIdTracker.increment();
        return true;
    }
    


}
