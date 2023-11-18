// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.0;

contract ReturnsTooLittleToken {
    /*///////////////////////////////////////////////////////////////
                                  EVENTS
    //////////////////////////////////////////////////////////////*/

    event Transfer(address indexed from, address indexed to, uint256 amount);

    event Approval(address indexed owner, address indexed spender, uint256 amount);

    /*///////////////////////////////////////////////////////////////
                             METADATA STORAGE
    //////////////////////////////////////////////////////////////*/

    string public constant name = "ReturnsTooLittleToken";

    string public constant symbol = "RTLT";

    uint8 public constant decimals = 18;

    /*///////////////////////////////////////////////////////////////
                              ERC20 STORAGE
    //////////////////////////////////////////////////////////////*/

    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;

    mapping(address => mapping(address => uint256)) public allowance;

    /*///////////////////////////////////////////////////////////////
                               CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor() {
        totalSupply = type(uint256).max;
        balanceOf[msg.sender] = type(uint256).max;
    }

    /*///////////////////////////////////////////////////////////////
                              ERC20 LOGIC
    //////////////////////////////////////////////////////////////*/

    function approve(address, uint256) public virtual {
        assembly {
            mstore(0, 0x0100000000000000000000000000000000000000000000000000000000000000)
            return(0, 8)
        }
    }

    function transfer(address, uint256) public virtual {
        assembly {
            mstore(0, 0x0100000000000000000000000000000000000000000000000000000000000000)
            return(0, 8)
        }
    }

    function transferFrom(
        address,
        address,
        uint256
    ) public virtual {
        assembly {
            mstore(0, 0x0100000000000000000000000000000000000000000000000000000000000000)
            return(0, 8)
        }
    }
}
