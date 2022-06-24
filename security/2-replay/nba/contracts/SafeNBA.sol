pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SafeNBA is ERC721, Ownable{
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
        address recovered = recover(proof);
        require(whitelists[recovered], "Not in whitelist");
        require(!minted[recovered], "already minted!");
        minted[recovered] = true;
        _mint(recovered, counter);
        counter++;
        emit batchWhitelistMint();
    }


    function recover(VData memory info) internal view returns(address){
        //must have the prefix: "\x19Ethereum Signed Message:\n" ‖ len(b) ‖ b
        bytes32 data =
            keccak256(
                abi.encodePacked("\x19Ethereum Signed Message:\n32", info.message)
            );
        //console.log(hash);
        address recovered = ecrecover(data, info.v, info.r, info.s);
        return recovered;
    }
}