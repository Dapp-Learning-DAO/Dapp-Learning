pragma solidity ^0.6.6;

import "@chainlink/contracts/src/v0.6/VRFConsumerBase.sol";

contract RandomNumberVRF is VRFConsumerBase {

    bytes32 internal keyHash;
    uint256 internal fee;
    uint256 public randomResult;
    address public VRFCoordinator;
    // rinkeby: 0xb3dCcb4Cf7a26f6cf6B120Cf5A73875B7BBc655B
    address public LinkToken;
    // rinkeby: 0x01BE23585060835E02B77ef475b0Cc51aA1e0709a


    mapping(bytes32=>uint256) private resultMap;
    mapping(bytes32=>bool) private validIds;

    /**
       * Constructor inherits VRFConsumerBase
       *
       * Network: goerli
       * Chainlink VRF Coordinator address: 0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D
       * LINK token address:                0x326C977E6efc84E512bB9C30f76E30c160eD06FB
       * Key Hash: 0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15
       */
    constructor(address _VRFCoordinator, address _LinkToken, bytes32 _keyhash)
    public
    VRFConsumerBase(_VRFCoordinator, _LinkToken)
    {
        VRFCoordinator = _VRFCoordinator;
        LinkToken = _LinkToken;
        keyHash = _keyhash;
        fee = 0.1 * 10**18; // 0.1 LINK
    }

    function requestRandomNumber(uint256 userProvidedSeed) public returns (bytes32) {
        require(
            LINK.balanceOf(address(this)) >= fee,
            "Not enough LINK - fill contract with faucet"
        );
        bytes32 requestId = requestRandomness(keyHash, fee, userProvidedSeed);
        validIds[requestId] = true;
        return requestId;
    }

    function fulfillRandomness(bytes32 requestId, uint256 randomNumber) internal override
    {
        require(validIds[requestId], "id must be not used!") ;
        randomResult = randomNumber;
        resultMap[requestId]=  randomResult;
        delete validIds[requestId];
    }

    function get()  public view  returns(uint256){
        return randomResult;
    }

    function getById(bytes32 id)  public view  returns(uint256){
        return resultMap[id];
    }

    function checkIdFulfilled(bytes32 id)  public view  returns(bool){
        return validIds[id];
    }

}