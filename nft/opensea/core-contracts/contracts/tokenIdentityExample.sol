pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract TokenIdentifierExample {
    uint8 constant ADDRESS_BITS = 160;
    uint8 constant INDEX_BITS = 56;
    uint8 constant SUPPLY_BITS = 40;

    uint256 constant SUPPLY_MASK = (uint256(1) << SUPPLY_BITS) - 1; // 40个1
    uint256 constant INDEX_MASK =
        ((uint256(1) << INDEX_BITS) - 1) ^ SUPPLY_MASK; // 160个0+16个1+40个0

    constructor() {
        console.log("constructor created");
    }

    // 因为address是160位，我们以uint256(uint160(_address))开头，这意味着在位160之上的所有位均为0;
    // 先将address << 96位，那么高位256~96位上都是address，低位上都是0；
    // 再做_tokenIndex << 40，因为低40位上放了max_supply，左移40位后， 那么低位 39 ~ 0  位置上都是0；
    // 再做address | tokenIndex, 这样96 ~ 40位上放了_tokenIndex；
    // 最后做address | _maxSupply ，这样低位40 ~ 0 位置都是_maxSupply；

    // address |
    function generateTokenId(
        address _address,
        uint40 _maxSupply,
        uint56 _tokenIndex
    ) public view returns (uint256) {
        uint256 character = uint256(uint160(_address));
        character = character << (INDEX_BITS + SUPPLY_BITS);

        uint256 index = (_tokenIndex << 40);
        console.log("index = %s", index);
        console.logBytes(abi.encodePacked(index));
        character |= index;
        console.logBytes(abi.encodePacked(character));

        character |= _maxSupply;
        console.logBytes(abi.encodePacked(character));

        return character;
    }

    function getMaxSupply(uint256 _id) public view returns (uint256) {
        // & 与运算 两个位都是 1 时，结果才为 1
        // | 或运算 两个位都是 0 时，结果才为 0，否则为 1
        // ^ 异或运算，两个位相同则为 0，不同则为 1
        console.log("SUPPLY_MASK = %s", SUPPLY_MASK);
        console.logBytes(abi.encodePacked(SUPPLY_MASK));
        return _id & SUPPLY_MASK; // 相当于取了前40位
    }

    function getTokenIndex(uint256 _id) public view returns (uint256) {
        console.log("INDEX_MASK = %s", INDEX_MASK);
        console.logBytes(abi.encodePacked(INDEX_MASK));
        console.logBytes(abi.encodePacked(_id & INDEX_MASK));
        return _id & INDEX_MASK; // 相当于取了前56位，但是抛弃了低位的40个
    }

    function tokenCreator(uint256 _id) public pure returns (address) {
        return address(uint160(_id >> (INDEX_BITS + SUPPLY_BITS)));
    }

    mapping(uint256 => uint256) characters;

    function setCharacter(
        uint256 _id,
        address owner,
        uint256 creationTime,
        uint256 strength,
        uint256 race,
        uint256 class,
        uint256 dna
    ) external {
        uint256 character = uint256(uint160(owner)); // 160位之上都是0
        character |= creationTime << 160; // creationTime是48位，将creationTime插在160–207中
        character |= strength << 208;
        character |= race << 224;
        character |= class << 240;
        characters[_id] = character;
    }

    function getCharacter(uint256 _id)
        external
        view
        returns (
            address owner,
            uint256 creationTime,
            uint256 strength,
            uint256 race,
            uint256 class
        )
    {
        uint256 character = characters[_id];
        owner = address(uint160(character)); // address取到前面160位就可以
        creationTime = uint256(uint48(character >> 160)); // 低160位丢掉，得到48位的creationTime
        strength = uint256(uint16(character >> 208));
        race = uint256(uint16(character >> 224));
        class = uint256(uint16(character >> 240));
    }
}
