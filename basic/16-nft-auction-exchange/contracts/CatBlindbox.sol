// contracts/DungeonsAndDragonsCharacter.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./IRandomNumberVRF.sol";
import "./erc-token/extensions/Ownable.sol";
import "./erc-token/ERC721.sol";


contract CatBlindbox is ERC721, Ownable {
    event ResultOfNewBlindboxCat(address sender,string catName,bytes32 requestId);
    event SurpriseCat(bytes32 requestId,string name,string series,uint256 birthTime,address owner,string images);

    //American Shorthair 美短   British Shorthair  英短   Japanese Bobtail 日本短尾猫   Chinese Orange 中华橘猫    Russian Blue 俄罗斯蓝猫    Persian 波斯猫   Ragdoll 布偶猫
    string[7] catsSpecies = ["American Shorthair", "British Shorthair", "Japanese Bobtail", "Chinese Orange", "Russian Blue", "Persian", "Ragdoll"];

    string[7] catImagesUri=[
    "https://pic1.zhimg.com/80/v2-33f59a4343abb6a49b352789377ff5d8_1440w.jpg",
    "https://pic2.zhimg.com/80/v2-6838d36654876924d75e8cc11545399d_1440w.jpg",
    "https://pic1.zhimg.com/80/v2-25e8bb0321b78da95990bcdedb692c0c_1440w.jpg",
    "https://pic1.zhimg.com/v2-82c6c9ea312eb5eeb93d7f53c8e3259a_1440w.jpg",
    "https://pic1.zhimg.com/80/v2-ce3a26ff6f96c222a9ee93d8179328dc_1440w.jpg",
    "https://pic4.zhimg.com/80/v2-7a4f80d774519b1cf4be4bcfd5641427_1440w.jpg",
    "https://pic1.zhimg.com/80/v2-f8d012397a26872df456291ae1772b58_1440w.jpg"];

    struct CatSpecies{
        string species;
        string images;
    }

    struct Cat {
        uint256 catId;
        string name;
        string species;
        uint256 birthTime;
        address owner;
        string images;
    }


    CatSpecies[] catSpeciesPool;//猫池，所有盲盒中，还剩下的猫类型
    Cat[] public generatedCats;//已经产生的猫
    mapping(bytes32 => string)  requestToCatName;
    mapping(bytes32 => address) requestToSender;
    IRandomNumberVRF private oracle;

    constructor(address randomOracle) public ERC721("CatBlindBoxSeries", "Cat"){
        oracle = IRandomNumberVRF(randomOracle);
        for(uint i=0;i<catsSpecies.length;i++){
            catSpeciesPool.push(CatSpecies(catsSpecies[i],catImagesUri[i]));
        }
    }

    function requestNewBlindboxCat(
        uint256 userProvidedSeed,
        string memory name
    ) public returns (bytes32) {
        require(catSpeciesPool.length >0 , "There are no blind box cats!");
        bytes32  requestId = oracle.requestRandomNumber(userProvidedSeed);
        requestToCatName[requestId] = name;
        requestToSender[requestId] = msg.sender;
        emit ResultOfNewBlindboxCat(msg.sender,name,requestId);
        return requestId;
    }


    function generateBlindBoxCat(bytes32 requestId) public {
        require(catSpeciesPool.length >0 , "There are no blind box cats!");
        require(oracle.checkIdFulfilled(requestId) == false, " oracle query has not been fulfilled!");
        uint256 randomness  = oracle.getById(requestId);
        uint8 index = uint8((randomness) % catSpeciesPool.length);
        string memory name =  requestToCatName[requestId];
        // string  images = catImagesUri[index];
        CatSpecies memory catSpecies = catSpeciesPool[index];
        _removeCatSpeciesByIndex(index);
        uint256 birthTime = block.timestamp;
        uint256 nftId = generatedCats.length;
        generatedCats.push(Cat(nftId,name, catSpecies.species, birthTime, requestToSender[requestId], catSpecies.images));
        _mint(requestToSender[requestId], nftId );
       // issueWithAssetURI(requestToSender[requestId], nftId, catSpecies.images, "");
        emit SurpriseCat(requestId, name,catSpecies.species, birthTime,requestToSender[requestId], catSpecies.images);
    }


    function getCatInfo(uint256 catId)
    public
    view
    returns (uint256,string memory,string memory, uint256 , address , string memory)
    {
        Cat memory cat = generatedCats[catId];
        return (cat.catId,
        cat.name,
        cat.species,
        cat.birthTime,
        cat.owner,
        cat.images);
    }

    function _removeCatSpeciesByIndex(uint8 index)internal{
        catSpeciesPool[index]=catSpeciesPool[catSpeciesPool.length-1];
        catSpeciesPool.pop();
    }

    function getLength()public view returns(uint256){
        return catSpeciesPool.length;
    }
}
