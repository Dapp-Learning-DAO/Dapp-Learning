pragma solidity ^0.8.17;

import "solidity-bytes-utils/contracts/BytesLib.sol";

contract ParseException {

    //This method can catch any kind of exceptions!
    function tryCatch() external{
        try ParseException(address(this)).whatever() {
        }
        catch(bytes memory exceptionData) {
            if (exceptionData.length == 0){
                //..
            } else{
                bytes4 exceptionSelector = bytes4(exceptionData);
                bytes memory payload = BytesLib.slice(exceptionData, 4, exceptionData.length-4);

                if (exceptionSelector == bytes4(keccak256("Error(string)"))){
                    string memory reason = abi.decode(payload, (string));
                    //reason is "bad call"
                    //..
                }
                if (exceptionSelector == bytes4(keccak256("CustomError(uint256,address,string)"))){
                    (uint256 code, address caller, string memory reason) = abi.decode(payload, (uint256, address, string));
                }
                if (exceptionSelector == bytes4(keccak256("Panic(uint256)"))){
                    uint256 code = abi.decode(payload, (uint256));
                }
            }
        }
    }

    //-----ignore these parts
    function whatever() public{
        //You can also try other types of exception
        revert("bad call");
    }
}

