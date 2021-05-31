pragma solidity ^0.4.25;
import "./IERC721Enumerable.sol";
import "./IERC721Metadata.sol";

/**
 * @title ERC721 Non-Fungible Token Standard basic interface
 * @dev see https://eips.ethereum.org/EIPS/eip-721
 */
contract IMyERC721 is IERC721Enumerable, IERC721Metadata {
    function mintWithTokenURI(address to, string memory tokenURI) public  returns (bool);
}
