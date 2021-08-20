pragma solidity =0.5.17;

import "@openzeppelinV2/contracts/token/ERC20/IERC20.sol";

contract EvilGauge {
    IERC20 token;
    address owner;

    constructor(address _token) public {
        owner = msg.sender;
        token = IERC20(_token);
    }

    function deposit(uint256 amount) public {
        token.transferFrom(msg.sender, owner, amount);
    }
}
