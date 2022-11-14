import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";

interface IInterface1 {
    function hello1() external view returns(bool);    
}

interface IInterface2 {
    function hello2() external view returns(bool);    
}

contract Parent1 is IInterface1 ,ERC165{
    function hello1() external view returns(bool) {
        return true;
    }

    function supportsInterface(bytes4 interfaceId) public virtual override view returns(bool) {
        return super.supportsInterface(interfaceId) || 
        interfaceId == this.hello1.selector;
    }
}

contract Parent2 is IInterface2 ,ERC165{
    function hello2() external view returns(bool) {
        return true;
    }

    function supportsInterface(bytes4 interfaceId) public virtual override view returns(bool) {
        return super.supportsInterface(interfaceId) || 
        interfaceId == this.hello2.selector;
    }
}


contract Child is Parent1, Parent2 {
    function myFunc() external view returns(bool) {
        return true;
    }

    function supportsInterface(bytes4 interfaceId) public override(Parent1, Parent2) view returns(bool) {
        return super.supportsInterface(interfaceId) || interfaceId == this.myFunc.selector;
    }
}