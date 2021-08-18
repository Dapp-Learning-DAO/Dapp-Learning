
pragma solidity ^0.4.25;

import "./ERC20.sol";
import "./ERC865Token.sol";

contract DToken is ERC865Token, ERC20Detailed {
    uint8 public constant DECIMALS = 18;
    uint256 public  INITIAL_SUPPLY = 10000 * (10 ** uint256(18));

    /**
     * @dev Constructor that gives msg.sender all of existing tokens.
     */
    constructor(string memory name, string memory symbol, uint8  decimals, uint256  initial_supply) public  ERC20Detailed(name, symbol, decimals){



        INITIAL_SUPPLY = initial_supply * (10 ** uint256(decimals)) ;
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    function () external {
        revert();
    }


}