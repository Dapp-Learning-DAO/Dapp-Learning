/*

  Token recipient. Modified very slightly from the example on http://ethereum.org/dao (just to index log parameters).

*/

pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

/**
    就主要用来收钱的
 * @title TokenRecipient
 * @author Project Wyvern Developers
 */
contract TokenRecipient {
    event ReceivedEther(address indexed sender, uint256 amount);
    event ReceivedTokens(
        address indexed from,
        uint256 value,
        address indexed token,
        bytes extraData
    );

    /**
     * @dev Receive tokens and generate a log event
     * @param from Address from which to transfer tokens
     * @param value Amount of tokens to transfer
     * @param token Address of token
     * @param extraData Additional data to log
     */
    function receiveApproval(
        address from,
        uint256 value,
        address token,
        bytes extraData
    ) public {
        ERC20 t = ERC20(token);
        require(t.transferFrom(from, this, value));
        emit ReceivedTokens(from, value, token, extraData);
    }

    /**
     * @dev Receive Ether and generate a log event
     */
    function() public payable {
        emit ReceivedEther(msg.sender, msg.value);
    }
}
