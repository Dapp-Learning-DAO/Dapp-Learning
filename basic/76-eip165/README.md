# EIP-165

ERC-165 allows a smart contract to convey which interface it implements through a "supportsInterface(bytes4)" function call.

## Background concepts
EIP-165 strongly depends on basic concepts of **selector** and **interfaceId**.

### selector
Each function has a corresponding selector, which is equivalent to the first 4 bytes of function signature:

```solidity
contract SelectorDemo  {
    function hello(uint256 x) external view returns(bool) {
        return true;
    }

    function checkSelector() external view returns(bytes4, bytes4) {
        SelectorDemo instance = SelectorDemo(address(this));
        return (instance.hello.selector, bytes4(keccak256("hello(uint256)")));
    }
}
```

### interfaceId
Each interface has a corresponding interfaceId, which is XOR sum of selectors of all functions it contains:

```solidity
contract SelectorDemo  {
    function hello(uint256 x) external view returns(bool) {
        return true;
    }

    function checkSelector() external view returns(bytes4, bytes4) {
        return (this.hello.selector, bytes4(keccak256("hello(uint256)")));
    }
}


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

```

Also note that keyword **type** only supports interface, not contract.

## Usage
When some contract or DAPP wants to know whether a contract supports some interface, it is often achieved with ERC-165. How do we write these contracts?

### Contract Implementer

For a contract, if it wants to tell others what interface it carries, it should implement IERC-165. Basiclly, there can be two situations.

#### case1: this contract implementes some interface directly.

```solidity
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

interface IInterface {
    function hello1() external view returns(bool);    
    function hello2() external view returns(bool);    
}

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
```

Please note that in "supportsInterface" the contract also conveys that it supports "IERC165" as well as its own interfaces. This express that queriers could use ERC165 to check its interfaces.



Also, we can write a simpler version thanks to openzeppelin, which already encapsulates self-checking of UERC165 into ERC165.sol:

```solidity
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
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

```

#### case2: contract inherits one or more contracts, which also implements ERC165. 

```solidity
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

```

Though supportsInterface of Child contract calls one line of code (super.supportsInterface) beside its own, it still supports all following interface ids:
- IERC165(supportsInterface)
- IInterface1(hello1)
- IInterface2(hello2)
- Child(myFunc)

Why we don't have to specifiy parents' implementation one by one? This is because solidity takes C3 linearization inheritation rule, where multiple inheritants could be serialized into linearized inheritance from left to right. In this case, the linearized inheritance is:

            ERC165->Parent1->Parent2->Child

In other words, Child's supportsInterface contains the implentation from Parent2, which also contains that of Parent1 till ERC165.


## Query

For those to query, basiclly it has two separates steps.

- Decide whether target contracts supports ERC165. This can be done by checking target.supportsInterface(type(IERC165).interfaceId)

- Decode whether target contracts supports specified interface.

Openzeppelin already contains such logic in ERC165Checker:

```solidity
function supportsInterface(address account, bytes4 interfaceId) internal view returns (bool) {
        // query support of both ERC165 as per the spec and support of _interfaceId
        return supportsERC165(account) && supportsERC165InterfaceUnchecked(account, interfaceId);
    }
```

With the help of ERC165Checker, it is far more easier to check interface. Take a scenerio where a NFT market wants to move NFT it stored to some buyer, it must know what of kind of NFT it is transfering before the tranfer:

```solidity
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
```

## Referrence
[EIP-165](https://eips.ethereum.org/EIPS/eip-165)

[OZ](https://github.com/OpenZeppelin/openzeppelin-contracts/tree/master/contracts/utils/introspection)
