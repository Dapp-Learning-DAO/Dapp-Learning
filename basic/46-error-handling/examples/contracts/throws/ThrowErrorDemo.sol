pragma solidity ^0.8.17;

contract ThrowErrorDemo {

    function throwByRequireSilencely() external view{
        require(msg.sender == address(0xdeadbeaf));    
    }

    function throwByRevertSilencely() external view{
        if (msg.sender != address(0xdeadbeaf)){
            revert();
        }
    }

    function throwByInsufficientFund() external{
        payable(address(0xdeadbeaf)).transfer(1000);
    }

    function throwByInsufficientGas() external{
        this.whatever{gas: 1}();
    }


    //-----ignore these parts
    function whatever() public{

    }
}

