pragma solidity ^0.8.17;

contract CatchCall {

    //This method can catch any kind of exceptions!
    function catchCall() external{
        (bool success, bytes memory returnData) = address(this).call(abi.encodeWithSignature("whatever()"));
        if (!success){
            //returnData now is error. handle it!
            //...
        }
    }

    //You may think the following code would work but indeed it doesn't
    function catchPanic() external{

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

