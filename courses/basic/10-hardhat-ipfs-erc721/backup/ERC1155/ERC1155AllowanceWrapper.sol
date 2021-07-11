pragma solidity ^0.5.0;

import "./IERC1155.sol";
import "./ERC165.sol";
import "./SafeMath.sol";

// Shows how you could wrap some allowance on top of ERC1155
// A user would setApprovalForAll(true) for this wrapper in the target contract,
// and the set the individual allowances here.
contract AllowanceWrapper is IERC1155, ERC165
{
    using SafeMath for uint256;

    IERC1155 targetContract;

    // from => operator => id => allowance
    mapping(address => mapping(address => mapping(uint256 => uint256))) allowances;

    /**
        @dev Pass in the target contract.
    */
    constructor(address _target) public {
        targetContract = IERC1155(_target);
    }

    /**
        @dev MUST emit on any successful call to approve(address _spender, uint256 _id, uint256 _currentValue, uint256 _value)
    */
    event Approval(address indexed _owner, address indexed _spender, uint256 indexed _id, uint256 _oldValue, uint256 _value);

    /**
        @notice Allow other accounts/contracts to spend tokens on behalf of msg.sender
        @dev MUST emit Approval event on success.
        To minimize the risk of the approve/transferFrom attack vector (see https://docs.google.com/document/d/1YLPtQxZu1UAvO9cZ1O2RPXBbT0mooh4DYKjA_jp-RLM/), this function will throw if the current approved allowance does not equal the expected _currentValue, unless _value is 0.
        @param _spender      Address to approve
        @param _id           ID of the Token
        @param _currentValue Expected current value of approved allowance.
        @param _value        Allowance amount
    */
    function approve(address _spender, uint256 _id, uint256 _currentValue, uint256 _value) external {

        require(allowances[msg.sender][_spender][_id] == _currentValue);
        allowances[msg.sender][_spender][_id] = _value;

        emit Approval(msg.sender, _spender, _id, _currentValue, _value);
    }

    /**
        @notice Queries the spending limit approved for an account
        @param _id       ID of the Token
        @param _owner    The owner allowing the spending
        @param _spender  The address allowed to spend.
        @return          The _spender's allowed spending balance of the Token requested
     */
    function allowance(address _owner, address _spender, uint256 _id) external view returns (uint256){
        return allowances[_owner][_spender][_id];
    }

    // ERC1155

    function supportsInterface(bytes4 _interfaceId)
    external
    view
    returns (bool) {
         ERC165(address(targetContract)).supportsInterface(_interfaceId);
    }

    /**
        @notice Transfers value amount of an _id from the _from address to the _to addresses specified. Each parameter array should be the same length, with each index correlating.
        @dev MUST emit Transfer event on success.
        Caller must have sufficient allowance by _from for the _id/_value pair, or isApprovedForAll must be true.
        Throws if `_to` is the zero address.
        Throws if `_id` is not a valid token ID.
        When transfer is complete, this function checks if `_to` is a smart contract (code size > 0). If so, it calls `onERC1155Received` on `_to` and throws if the return value is not `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))`.
        @param _from    source addresses
        @param _to      target addresses
        @param _id      ID of the Token
        @param _value   transfer amounts
        @param _data    Additional data with no specified format, sent in call to `_to`
    */
    function safeTransferFrom(address _from, address _to, uint256 _id, uint256 _value, bytes calldata _data) external /*payable*/  {
        if (msg.sender != _from) {
            allowances[_from][msg.sender][_id] = allowances[_from][msg.sender][_id].sub(_value);
        }
        targetContract.safeTransferFrom(_from, _to, _id, _value, _data);
    }

    /**
        @notice Send multiple types of Tokens from a 3rd party in one transfer (with safety call)
        @dev MUST emit Transfer event per id on success.
        Caller must have a sufficient allowance by _from for each of the id/value pairs.
        Throws on any error rather than return a false flag to minimize user errors.
        @param _from    Source address
        @param _to      Target address
        @param _ids     Types of Tokens
        @param _values  Transfer amounts per token type
        @param _data    Additional data with no specified format, sent in call to `_to`
    */
    function safeBatchTransferFrom(address _from, address _to, uint256[] calldata _ids, uint256[] calldata _values, bytes calldata _data) external /*payable*/ {
        if (msg.sender != _from) {
            for (uint256 i = 0; i < _ids.length; ++i) {
                allowances[_from][msg.sender][_ids[i]] = allowances[_from][msg.sender][_ids[i]].sub(_values[i]);
            }
        }
        targetContract.safeBatchTransferFrom(_from, _to, _ids, _values, _data);
    }

    /**
        @notice Get the balance of an account's Tokens
        @param _owner  The address of the token holder
        @param _id     ID of the Token
        @return        The _owner's balance of the Token type requested
     */
    function balanceOf(address _owner, uint256 _id) external view returns (uint256) {
        return targetContract.balanceOf(_owner, _id);
    }

    /**
        @notice Enable or disable approval for a third party ("operator") to manage all of `msg.sender`'s tokens.
        @dev MUST emit the ApprovalForAll event on success.
    */
    function setApprovalForAll(address /*_operator*/, bool /*_approved*/) external {
        // Do this on the wrapped contract directly. We can't do this here
        revert();
    }

    /**
        @notice Queries the approval status of an operator for a given Token and owner
        @param _owner     The owner of the Tokens
        @param _operator  Address of authorized operator
        @return           True if the operator is approved, false if not
    */
    function isApprovedForAll(address _owner, address _operator) view external returns (bool) {
        return targetContract.isApprovedForAll(_owner, _operator);
    }
}
