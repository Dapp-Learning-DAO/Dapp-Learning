import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";


interface IInterface {
    function hello1(uint256 x) external view returns(bool);

    function hello2(uint256 x) external view returns(bool);
}

// demo: using ERC-165

contract ImplementerCase1 is IInterface, IERC165 {
    function hello1() external view returns(bool) {
        return true;
    }
    function hello2() external view returns(bool) {
        return true;
    }

    function supportsInterface(bytes4 interfaceId) external view returns(bool) {
        return interfaceId == type(IERC165).interfaceId ||
                interfaceId == this.hello1.selector ^ this.hello2.selector;
    }
}

contract ImplementerCase2 is IInterface ,ERC165{
    function hello1() external view returns(bool) {
        return true;
    }
    function hello2() external view returns(bool) {
        return true;
    }

    function supportsInterface(bytes4 interfaceId) public override view returns(bool) {
        return super.supportsInterface(interfaceId) || 
        interfaceId == this.hello1.selector ^ this.hello2.selector;
    }
}
