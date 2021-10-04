pragma solidity ^0.4.25;

import "./IERC875.sol";

contract ERC875Token is IERC875 {
    uint totalTickets;
    mapping(address => uint256[]) inventory;
    uint16 ticketIndex = 0; //to track mapping in tickets
    uint expiryTimeStamp;
    address owner;   // the address that calls selfdestruct() and takes fees
    address admin;
    uint transferFee;
    uint numOfTransfers = 0;
    string public name;
    string public symbol;
    uint8 public constant decimals = 0; //no decimals as tickets cannot be split

    event Transfer(address indexed _from, address indexed _to, uint256[] tokenIndices);
    event TransferFrom(address indexed _from, address indexed _to, uint _value);

    modifier adminOnly()
    {
        if(msg.sender != admin) revert();
        else _;
    }

    function() public { revert(); } //should not send any ether directly

    // example: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], "MJ comeback", 1603152000, "MJC", "0x007bEe82BDd9e866b2bd114780a47f2261C684E3"
    function ERC875Token(
        uint256[] numberOfTokens,
        string evName,
        uint expiry,
        string eventSymbol,
        address adminAddr) public
    {
        totalTickets = numberOfTokens.length;
        //assign some tickets to event admin
        expiryTimeStamp = expiry;
        owner = msg.sender;
        admin = adminAddr;
        inventory[admin] = numberOfTokens;
        symbol = eventSymbol;
        name = evName;
    }

    function getDecimals() public pure returns(uint)
    {
        return decimals;
    }

    // price is 1 in the example and the contract address is 0xfFAB5Ce7C012bc942F5CA0cd42c3C2e1AE5F0005
    // example: 0, [3, 4], 27, "0x2C011885E2D8FF02F813A4CB83EC51E1BFD5A7848B3B3400AE746FB08ADCFBFB", "0x21E80BAD65535DA1D692B4CEE3E740CD3282CCDC0174D4CF1E2F70483A6F4EB2"
    // price is encoded in the server and the msg.value is added to the message digest,
    // if the message digest is thus invalid then either the price or something else in the message is invalid
    function trade(uint256 expiry,
        uint256[] tokenIndices,
        uint8 v,
        bytes32 r,
        bytes32 s) public payable
    {
        //checks expiry timestamp,
        //if fake timestamp is added then message verification will fail
        require(expiry > block.timestamp || expiry == 0);
        //id 1 for mainnet
        bytes12 prefix = "ERC800-CNID1";
        bytes32 message = encodeMessage(prefix, msg.value, expiry, tokenIndices);
        address seller = ecrecover(message, v, r, s);

        for(uint i = 0; i < tokenIndices.length; i++)
        { // transfer each individual tickets in the ask order
            uint index = uint(tokenIndices[i]);
            require((inventory[seller][index] > 0)); // 0 means ticket sold.
            inventory[msg.sender].push(inventory[seller][index]);
            inventory[seller][index] = 0; // 0 means ticket sold.
        }
        seller.transfer(msg.value);
    }

    function verify(uint256 expiry,
        uint256[] tokenIndices,
        uint8 v,
        bytes32 r,
        bytes32 s) public payable
        {
            bytes12 prefix = "ERC800-CNID1";
            bytes32 message = encodeMessage(prefix, msg.value, expiry, tokenIndices);
            address seller = ecrecover(message, v, r, s);
        }


    //must also sign in the contractAddress
    //prefix must contain ERC and chain id
    function encodeMessage(bytes12 prefix, uint value,
        uint expiry, uint256[] tokenIndices)
        internal view returns (bytes32)
    {
        bytes memory message = new bytes(96 + tokenIndices.length * 2);
        address contractAddress = getContractAddress();
        for (uint i = 0; i < 32; i++)
        {   // convert bytes32 to bytes[32]
            // this adds the price to the message
            message[i] = byte(bytes32(value << (8 * i)));
        }

        for (i = 0; i < 32; i++)
        {
            message[i + 32] = byte(bytes32(expiry << (8 * i)));
        }

        for(i = 0; i < 12; i++)
        {
            message[i + 64] = byte(prefix << (8 * i));
        }

        for(i = 0; i < 20; i++)
        {
            message[76 + i] = byte(bytes20(bytes20(contractAddress) << (8 * i)));
        }

        for (i = 0; i < tokenIndices.length; i++)
        {
            // convert int[] to bytes
            message[96 + i * 2 ] = byte(tokenIndices[i] >> 8);
            message[96 + i * 2 + 1] = byte(tokenIndices[i]);
        }

        return keccak256(message);
    }

    function name() public view returns(string)
    {
        return name;
    }

    function symbol() public view returns(string)
    {
        return symbol;
    }

    function getAmountTransferred() public view returns (uint)
    {
        return numOfTransfers;
    }

    function supportsInterface(bytes4 interfaceID) external view returns (bool)
    {
        return false;
    }

    function isContractExpired() public view returns (bool)
    {
        if(block.timestamp > expiryTimeStamp)
        {
            return true;
        }
        else return false;
    }

    function balanceOf(address _owner) public view returns (uint256[])
    {
        return inventory[_owner];
    }

    function myBalance() public view returns(uint256[])
    {
        return inventory[msg.sender];
    }

    function transfer(address _to, uint256[] tokenIndices) public
    {
        for(uint i = 0; i < tokenIndices.length; i++)
        {
            require(inventory[msg.sender][i] != 0);
            //pushes each element with ordering
            uint index = uint(tokenIndices[i]);
            inventory[_to].push(inventory[msg.sender][index]);
            inventory[msg.sender][index] = 0;
        }
    }

    function transferFrom(address _from, address _to, uint256[] tokenIndices)
        adminOnly public
    {
        bool isadmin = msg.sender == admin;
        for(uint i = 0; i < tokenIndices.length; i++)
        {
            require(inventory[_from][i] != 0 || isadmin);
            //pushes each element with ordering
            uint index = uint(tokenIndices[i]);
            inventory[_to].push(inventory[_from][index]);
            inventory[_from][index] = 0;
        }
    }

    function endContract() public
    {
        if(msg.sender == owner)
        {
            selfdestruct(owner);
        }
        else revert();
    }

    function getContractAddress() public view returns(address)
    {
        return this;
    }
}

