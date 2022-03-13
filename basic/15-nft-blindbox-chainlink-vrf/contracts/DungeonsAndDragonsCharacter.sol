// contracts/DungeonsAndDragonsCharacter.sol
// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./ERC721PresetMinterPauserAutoId.sol";
import "./extensions/Strings.sol";
import '@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol';
import '@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol';
import '@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol';

contract DungeonsAndDragonsCharacter is ERC721PresetMinterPauserAutoId, VRFConsumerBaseV2 {
    using Strings for string;

    event FulfillRandomness(uint256,uint256[]);
    event RequestId(address,uint256);

    VRFCoordinatorV2Interface COORDINATOR;
    LinkTokenInterface LINKTOKEN;

    // Your subscription ID.
    uint64 s_subscriptionId;

    // Rinkeby coordinator. For other networks,
    // see https://docs.chain.link/docs/vrf-contracts/#configurations
    address vrfCoordinator = 0x6168499c0cFfCaCD319c818142124B7A15E857ab;

    // Rinkeby LINK token contract. For other networks,
    // see https://docs.chain.link/docs/vrf-contracts/#configurations
    address link = 0x01BE23585060835E02B77ef475b0Cc51aA1e0709;

    // The gas lane to use, which specifies the maximum gas price to bump to.
    // For a list of available gas lanes on each network,
    // see https://docs.chain.link/docs/vrf-contracts/#configurations
    bytes32 keyHash = 0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc;

    // Depends on the number of requested values that you want sent to the
    // fulfillRandomWords() function. Storing each word costs about 20,000 gas,
    // so 100,000 is a safe default for this example contract. Test and adjust
    // this limit based on the network that you select, the size of the request,
    // and the processing of the callback request in the fulfillRandomWords()
    // function.
    uint32 callbackGasLimit = 100000;

    // The default is 3, but you can set this higher.
    uint16 requestConfirmations = 3;

    // For this example, retrieve 2 random values in one request.
    // Cannot exceed VRFCoordinatorV2.MAX_NUM_WORDS.
    uint32 numWords = 2;

    bool public flag;
    uint256 public tag;

    struct Character {
        uint256 strength;
        uint256 dexterity;
        uint256 constitution;
        uint256 intelligence;
        uint256 wisdom;
        uint256 charisma;
        uint256 experience;
        string name;
    }

    Character[] public characters;

    mapping(uint256 => string) requestToCharacterName;
    mapping(uint256 => address) requestToSender;
    mapping(uint256 => uint256) requestToRandnum;

    constructor(uint64 subscriptionId,string memory tokenURI)
    public
    VRFConsumerBaseV2(vrfCoordinator)
    ERC721PresetMinterPauserAutoId("DungeonsAndDragonsCharacter", "D&D",tokenURI)
    {
        COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator);
        LINKTOKEN = LinkTokenInterface(link);
        s_subscriptionId = subscriptionId;
    }

    function requestNewRandomCharacter(
        string memory name
    ) public returns (uint256) {
        // Will revert if subscription is not set and funded.
        uint256 requestId = COORDINATOR.requestRandomWords(keyHash, s_subscriptionId, requestConfirmations, callbackGasLimit, numWords);
        emit RequestId(msg.sender,requestId);

        requestToCharacterName[requestId] = name;
        requestToSender[requestId] = msg.sender;
        return requestId;
    }

    function setTokenURI(uint256 tokenId, string memory _tokenURI) public {
        require(
            _isApprovedOrOwner(_msgSender(), tokenId),
            "ERC721: transfer caller is not owner nor approved"
        );
        _setTokenURI(tokenId, _tokenURI);
    }

    function fulfillRandomWords(
        uint256 requestId, /* requestId */
        uint256[] memory randomWords)
    internal override
    {
        requestToRandnum[requestId] = randomWords[0];

        emit FulfillRandomness(requestId,randomWords);
    }

    function blindCharacter(uint256 requestId) public {
        uint256 randomNum = requestToRandnum[requestId];
        uint256 newId = characters.length;
        uint256 strength = (randomNum % 100);
        uint256 dexterity = ((randomNum % 10000) / 100 );
        uint256 constitution = ((randomNum % 1000000) / 10000 );
        uint256 intelligence = ((randomNum % 100000000) / 1000000 );
        uint256 wisdom = ((randomNum % 10000000000) / 100000000 );
        uint256 charisma = ((randomNum % 1000000000000) / 10000000000);
        uint256 experience = 0;

        characters.push(
            Character(
                strength,
                dexterity,
                constitution,
                intelligence,
                wisdom,
                charisma,
                experience,
                requestToCharacterName[requestId]
            )
        );
        _safeMint(requestToSender[requestId], newId);
    }

    function getLevel(uint256 tokenId) public view returns (uint256) {
        return sqrt(characters[tokenId].experience);
    }

    function getNumberOfCharacters() public view returns (uint256) {
        return characters.length;
    }

    function getCharacterOverView(uint256 tokenId)
    public
    view
    returns (
        string memory,
        uint256,
        uint256,
        uint256
    )
    {
        return (
        characters[tokenId].name,
        characters[tokenId].strength + characters[tokenId].dexterity + characters[tokenId].constitution + characters[tokenId].intelligence + characters[tokenId].wisdom + characters[tokenId].charisma,
        getLevel(tokenId),
        characters[tokenId].experience
        );
    }

    function sqrt(uint256 x) internal view returns (uint256 y) {
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }

// expand to more random
//    function expand(uint256 randomValue, uint256 n) public pure returns (uint256[] memory expandedValues) {
//        expandedValues = new uint256[](n);
//        for (uint256 i = 0; i < n; i++) {
//            expandedValues[i] = uint256(keccak256(abi.encode(randomValue, i)));
//        }
//        return expandedValues;
//    }
}
