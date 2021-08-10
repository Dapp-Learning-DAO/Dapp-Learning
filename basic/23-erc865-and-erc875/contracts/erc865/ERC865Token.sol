pragma solidity ^0.4.25;

import "./initializable.sol";
import "./ERC20.sol";
import { ECDSA } from "./ECDSA.sol";
import "./IERC865.sol";

/**
 * @title ERC865Token Token
 *
 * ERC865Token allows users paying transfers in tokens instead of gas
 * https://github.com/ethereum/EIPs/issues/865
 *
 */

contract ERC865Token is Initializable, ERC20, IERC865 {

    /* hashed tx of transfers performed */
    mapping(bytes32 => bool) hashedTxs;
    /**
     * @dev Submit a presigned transfer
     * @notice fee will be given to sender if it's a smart contract make sure it can accept funds
     * @param _signature bytes The signature, issued by the owner.
     * @param _to address The address which you want to transfer to.
     * @param _value uint256 The amount of tokens to be transferred.
     * @param _fee uint256 The amount of tokens paid to msg.sender, by the owner.
     * @param _nonce uint256 Presigned transaction number.
     */
    function transferPreSigned(
        bytes _signature,
        address _to,
        uint256 _value,
        uint256 _fee,
        uint256 _nonce
    )
    public
    returns (bool)
    {
        require(_to != address(0), "Invalid _to address");

        bytes32 hashedParams = getTransferPreSignedHash(address(this), _to, _value, _fee, _nonce);
        address from = ECDSA.recover(ECDSA.toEthSignedMessageHash(hashedParams), _signature);
        require(from != address(0), "Invalid from address recovered");
        bytes32 hashedTx = keccak256(abi.encodePacked(from, hashedParams));
        require(hashedTxs[hashedTx] == false,"Transaction hash was already used");
        hashedTxs[hashedTx] = true;
        _transfer(from, _to, _value);
        _transfer(from, msg.sender, _fee);

        emit TransferPreSigned(from, _to, msg.sender, _value, _fee);
        return true;
    }

    /**
     * @dev Submit a presigned approval
     * @notice fee will be given to sender if it's a smart contract make sure it can accept funds
     * @param _signature bytes The signature, issued by the owner.
     * @param _spender address The address which will spend the funds.
     * @param _value uint256 The amount of tokens to allow.
     * @param _fee uint256 The amount of tokens paid to msg.sender, by the owner.
     * @param _nonce uint256 Presigned transaction number.
     */
    function approvePreSigned(
        bytes _signature,
        address _spender,
        uint256 _value,
        uint256 _fee,
        uint256 _nonce
    )
    public
    returns (bool)
    {
        require(_spender != address(0),"Invalid _spender address");

        bytes32 hashedParams = getApprovePreSignedHash(address(this), _spender, _value, _fee, _nonce);
        address from = ECDSA.recover(ECDSA.toEthSignedMessageHash(hashedParams), _signature);
        require(from != address(0),"Invalid from address recovered");
        bytes32 hashedTx = keccak256(abi.encodePacked(from, hashedParams));
        require(hashedTxs[hashedTx] == false,"Transaction hash was already used");
        hashedTxs[hashedTx] = true;
        _approve(from, _spender, _value);
        _transfer(from, msg.sender, _fee);

        emit ApprovalPreSigned(from, _spender, msg.sender, _value, _fee);
        return true;
    }

    /**
     * @dev Increase the amount of tokens that an owner allowed to a spender.
     * @notice fee will be given to sender if it's a smart contract make sure it can accept funds
     * @param _signature bytes The signature, issued by the owner.
     * @param _spender address The address which will spend the funds.
     * @param _addedValue uint256 The amount of tokens to increase the allowance by.
     * @param _fee uint256 The amount of tokens paid to msg.sender, by the owner.
     * @param _nonce uint256 Presigned transaction number.
     */
    function increaseAllowancePreSigned(
        bytes _signature,
        address _spender,
        uint256 _addedValue,
        uint256 _fee,
        uint256 _nonce
    )
    public
    returns (bool)
    {
        require(_spender != address(0),"Invalid _spender address");

        bytes32 hashedParams = getIncreaseAllowancePreSignedHash(address(this), _spender, _addedValue, _fee, _nonce);
        address from = ECDSA.recover(ECDSA.toEthSignedMessageHash(hashedParams), _signature);
        require(from != address(0),"Invalid from address recovered");
        bytes32 hashedTx = keccak256(abi.encodePacked(from, hashedParams));
        require(hashedTxs[hashedTx] == false,"Transaction hash was already used");
        hashedTxs[hashedTx] = true;
        _approve(from, _spender, allowance(from, _spender).add(_addedValue));
        _transfer(from, msg.sender, _fee);

        emit ApprovalPreSigned(from, _spender, msg.sender, allowance(from, _spender), _fee);
        return true;
    }

    /**
     * @dev Decrease the amount of tokens that an owner allowed to a spender.
     * @notice fee will be given to sender if it's a smart contract make sure it can accept funds
     * @param _signature bytes The signature, issued by the owner
     * @param _spender address The address which will spend the funds.
     * @param _subtractedValue uint256 The amount of tokens to decrease the allowance by.
     * @param _fee uint256 The amount of tokens paid to msg.sender, by the owner.
     * @param _nonce uint256 Presigned transaction number.
     */
    function decreaseAllowancePreSigned(
        bytes _signature,
        address _spender,
        uint256 _subtractedValue,
        uint256 _fee,
        uint256 _nonce
    )
    public
    returns (bool)
    {
        require(_spender != address(0),"Invalid _spender address");

        bytes32 hashedParams = getDecreaseAllowancePreSignedHash(address(this), _spender, _subtractedValue, _fee, _nonce);
        address from = ECDSA.recover(ECDSA.toEthSignedMessageHash(hashedParams), _signature);
        require(from != address(0),"Invalid from address recovered");
        bytes32 hashedTx = keccak256(abi.encodePacked(from, hashedParams));
        require(hashedTxs[hashedTx] == false,"Transaction hash was already used");
        // if substractedValue is greater than allowance will fail as allowance is uint256
        hashedTxs[hashedTx] = true;
        _approve(from, _spender, allowance(from,_spender).sub(_subtractedValue));
        _transfer(from, msg.sender, _fee);

        emit ApprovalPreSigned(from, _spender, msg.sender, allowance(from, _spender), _fee);
        return true;
    }

    /**
     * @dev Transfer tokens from one address to another
     * @notice fee will be given to sender if it's a smart contract make sure it can accept funds
     * @param _signature bytes The signature, issued by the spender.
     * @param _from address The address which you want to send tokens from.
     * @param _to address The address which you want to transfer to.
     * @param _value uint256 The amount of tokens to be transferred.
     * @param _fee uint256 The amount of tokens paid to msg.sender, by the spender.
     * @param _nonce uint256 Presigned transaction number.
     */
    function transferFromPreSigned(
        bytes _signature,
        address _from,
        address _to,
        uint256 _value,
        uint256 _fee,
        uint256 _nonce
    )
    public
    returns (bool)
    {
        require(_to != address(0),"Invalid _to address");

        bytes32 hashedParams = getTransferFromPreSignedHash(address(this), _from, _to, _value, _fee, _nonce);

        address spender = ECDSA.recover(ECDSA.toEthSignedMessageHash(hashedParams), _signature);
        require(spender != address(0),"Invalid spender address recovered");
        bytes32 hashedTx = keccak256(abi.encodePacked(spender, hashedParams));
        require(hashedTxs[hashedTx] == false,"Transaction hash was already used");
        hashedTxs[hashedTx] = true;
        _transfer(_from, _to, _value);
        _approve(_from, spender, allowance(_from, spender).sub(_value));
        _transfer(spender, msg.sender, _fee);

        emit TransferPreSigned(_from, _to, msg.sender, _value, _fee);
        return true;
    }


    /**
     * @dev Hash (keccak256) of the payload used by transferPreSigned
     * @notice fee will be given to sender if it's a smart contract make sure it can accept funds
     * @param _token address The address of the token.
     * @param _to address The address which you want to transfer to.
     * @param _value uint256 The amount of tokens to be transferred.
     * @param _fee uint256 The amount of tokens paid to msg.sender, by the owner.
     * @param _nonce uint256 Presigned transaction number.
     */
    function getTransferPreSignedHash(
        address _token,
        address _to,
        uint256 _value,
        uint256 _fee,
        uint256 _nonce
    )
    public
    pure
    returns (bytes32)
    {
        /* "0d98dcb1": getTransferPreSignedHash(address,address,uint256,uint256,uint256) */
        return keccak256(abi.encodePacked(bytes4(0x0d98dcb1), _token, _to, _value, _fee, _nonce));
    }

    /**
     * @dev Hash (keccak256) of the payload used by approvePreSigned
     * @notice fee will be given to sender if it's a smart contract make sure it can accept funds
     * @param _token address The address of the token
     * @param _spender address The address which will spend the funds.
     * @param _value uint256 The amount of tokens to allow.
     * @param _fee uint256 The amount of tokens paid to msg.sender, by the owner.
     * @param _nonce uint256 Presigned transaction number.
     */
    function getApprovePreSignedHash(
        address _token,
        address _spender,
        uint256 _value,
        uint256 _fee,
        uint256 _nonce
    )
    public
    pure
    returns (bytes32)
    {
        /* "79250dcf": getApprovePreSignedHash(address,address,uint256,uint256,uint256) */
        return keccak256(abi.encodePacked(bytes4(0x79250dcf), _token, _spender, _value, _fee, _nonce));
    }

    /**
     * @dev Hash (keccak256) of the payload used by increaseAllowancePreSigned
     * @notice fee will be given to sender if it's a smart contract make sure it can accept funds
     * @param _token address The address of the token
     * @param _spender address The address which will spend the funds.
     * @param _addedValue uint256 The amount of tokens to increase the allowance by.
     * @param _fee uint256 The amount of tokens paid to msg.sender, by the owner.
     * @param _nonce uint256 Presigned transaction number.
     */
    function getIncreaseAllowancePreSignedHash(
        address _token,
        address _spender,
        uint256 _addedValue,
        uint256 _fee,
        uint256 _nonce
    )
    public
    pure
    returns (bytes32)
    {
        /* "138e8da1": getIncreaseAllowancePreSignedHash(address,address,uint256,uint256,uint256) */
        return keccak256(abi.encodePacked(bytes4(0x138e8da1), _token, _spender, _addedValue, _fee, _nonce));
    }

    /**
     * @dev Hash (keccak256) of the payload used by decreaseAllowancePreSigned
     * @notice fee will be given to sender if it's a smart contract make sure it can accept funds
     * @param _token address The address of the token
     * @param _spender address The address which will spend the funds.
     * @param _subtractedValue uint256 The amount of tokens to decrease the allowance by.
     * @param _fee uint256 The amount of tokens paid to msg.sender, by the owner.
     * @param _nonce uint256 Presigned transaction number.
     */
    function getDecreaseAllowancePreSignedHash(
        address _token,
        address _spender,
        uint256 _subtractedValue,
        uint256 _fee,
        uint256 _nonce
    )
    public
    pure
    returns (bytes32)
    {
        /* "5229c56f": getDecreaseAllowancePreSignedHash(address,address,uint256,uint256,uint256) */
        return keccak256(abi.encodePacked(bytes4(0x5229c56f), _token, _spender, _subtractedValue, _fee, _nonce));
    }

    /**
     * @dev Hash (keccak256) of the payload used by transferFromPreSigned
     * @notice fee will be given to sender if it's a smart contract make sure it can accept funds
     * @param _token address The address of the token
     * @param _from address The address which you want to send tokens from.
     * @param _to address The address which you want to transfer to.
     * @param _value uint256 The amount of tokens to be transferred.
     * @param _fee uint256 The amount of tokens paid to msg.sender, by the spender.
     * @param _nonce uint256 Presigned transaction number.
     */
    function getTransferFromPreSignedHash(
        address _token,
        address _from,
        address _to,
        uint256 _value,
        uint256 _fee,
        uint256 _nonce
    )
    public
    pure
    returns (bytes32)
    {
        /* "a70c41b4": getTransferFromPreSignedHash(address,address,address,uint256,uint256,uint256) */
        return keccak256(abi.encodePacked(bytes4(0xa70c41b4), _token, _from, _to, _value, _fee, _nonce));
    }



    //   address spender = ECDSA.recover(hashedParams, _signature);
    function getAddressFromSig( bytes _signature, bytes32 hashedParams)  public view returns (address){
        address signer =  ECDSA.recover(hashedParams, _signature);

        return signer;
    }

}
