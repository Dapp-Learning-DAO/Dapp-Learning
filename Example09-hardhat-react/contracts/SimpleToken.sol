//  2019/10/15  //0xd2b7915d17e90771afd042ad403999167bf9abf8

// 用0。5。6编译器
pragma solidity ^0.8.0;

import "./presets/ERC20PresetMinterPauser.sol";


contract SimpleToken is ERC20PresetMinterPauser {


    /**
     * @dev Constructor that gives msg.sender all of existing tokens.
     */

    uint8 private _decimals;
    uint256 public  INITIAL_SUPPLY = 10000 * (10 ** uint256(18));


    function decimals() public view  override returns (uint8) {
        return _decimals;
    }

    constructor(string memory name, string memory symbol, uint8  decimals, uint256  initial_supply) public  ERC20PresetMinterPauser(name, symbol){
        
    
        _decimals = decimals;
        INITIAL_SUPPLY = initial_supply * (10 ** uint256(decimals)) ;
        _mint(msg.sender, INITIAL_SUPPLY);
    }

}
