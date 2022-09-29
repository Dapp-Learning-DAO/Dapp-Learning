import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";


contract CheckerDemo {

    function transfer(address nftContract, bytes memory args) external {
        if (ERC165Checker.supportsInterface(nftContract, type(IERC721).interfaceId)) {
            //transfer my asset to ERC721
        } 
        if (ERC165Checker.supportsInterface(nftContract, type(IERC1155).interfaceId)) {
            //transfer my asset to ERC1155
        }
    }
}