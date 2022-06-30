pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BuggyNBA is ERC721, Ownable{
    event batchWhitelistMint();

    struct VData {
        bytes32 message;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    mapping(address=>bool) private whitelists;

    mapping(address=>bool) private minted;
    
    uint256 private counter;

    constructor() ERC721("NBA", "NBA"){
        
    }

    function setWhitelist(address[] memory users) external onlyOwner{
        for (uint256 i=0;i<users.length;i++) {
            whitelists[users[i]] = true;
        }
    }

    function mint_approved(VData memory proof) external {
        require(verify(proof), "Not in whitelist");
        require(!minted[msg.sender], "already minted!");
        minted[msg.sender] = true;
        _mint(msg.sender, counter);
        counter++;
        emit batchWhitelistMint();
    }


    function verify(VData memory info) internal view returns(bool){
        //must have the prefix: "\x19Ethereum Signed Message:\n" ‖ len(b) ‖ b
        bytes32 data =
            keccak256(
                abi.encodePacked("\x19Ethereum Signed Message:\n32", info.message)
            );
        //console.log(hash);
        address recovered = ecrecover(data, info.v, info.r, info.s);
        return whitelists[recovered];
    }
}