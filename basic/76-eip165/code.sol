// demo: selector
contract SelectorDemo  {
    function hello(uint256 x) external view returns(bool) {
        return true;
    }

    function checkSelector() external view returns(bytes4, bytes4) {
        return (this.hello.selector, bytes4(keccak256("hello(uint256)")));
    }
}


// demo: interfaceId
interface IInterface {
    function hello1(uint256 x) external view returns(bool);

    function hello2(uint256 x) external view returns(bool);
}

contract Tests {
    function checkInterfaceId() external view returns(bool) {
        IInterface instance = IInterface(address(0));
        return type(IInterface).interfaceId == 
            instance.hello1.selector ^ instance.hello2.selector;
    } 
}

import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";

// demo: using ERC-165

contract Implementer1 is IInterface, IERC165 {
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

contract Implementer1 is IInterface ,ERC165{
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