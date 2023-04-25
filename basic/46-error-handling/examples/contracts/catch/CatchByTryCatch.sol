pragma solidity ^0.8.17;

contract CatchByTryCatch {

    //This method can catch any kind of exceptions!
    function tryCatch() external{
        try CatchByTryCatch(address(this)).whatever() {
            //If this block throws, it would not be caught. 
        }
        catch(bytes memory exceptionData) {
            //You can decode exceptionData like abi.decode(errorData, (string))
        }
    }

    //Specially, for error  with string
    function catchErrorWithString() external{
        try CatchByTryCatch(address(this)).whatever() {

        }
        catch Error(string memory reason){
            //Only for error with string. If called "revert()" it would not hit this code
        }
        catch(bytes memory exceptionData) {
            //Other exceptions
        }
    }

    //You may think the following code would work but indeed it doesn't
    function catchPanic() external{
        try CatchByTryCatch(address(this)).whatever() {

        }
        catch Panic(uint256 code){

        }
        catch(bytes memory exceptionData) {
            //Other exceptions
        }
    }
    
    //-----ignore these parts
    function whatever() public{
        //Throw Error With String
        revert("bad call");
        //Or Throw Error Without String like revert()
        //Or Throw Custom Error like revert CustomError(xxx,xxx..)
        //Or Panic like assert(condition)
    }
}

