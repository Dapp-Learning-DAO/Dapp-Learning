//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract A {
    address public sender;
    uint256 public i;

    function callInc(address _e) public returns (uint256) {
        (bool success, bytes memory result) = _e.call(
            abi.encodeWithSignature("inc()")
        );
        return abi.decode(result, (uint256));
    }

    function delegateCallInc(address _e) public returns (uint256) {
        console.log("A.msg.sender", msg.sender);
        (bool success, bytes memory result) = _e.delegatecall(
            abi.encodeWithSignature("inc()")
        );
        return abi.decode(result, (uint256));
    }
}

contract B {
    address public sender;
    uint256 public i;
    uint256 public n;

    function callSetN(address _e, uint256 _n) public {
        (bool success, bytes memory result) = _e.call(
            abi.encodeWithSignature("setN(uint256)", _n)
        );
    }

    // 按道理，调用delegatecallSetN，e合约里读取到的msg.sender是user；

    function delegatecallSetN(address _e, uint256 _n) external {
        console.log("B-delegatecallSetN:msg.sender", msg.sender);
        (bool success, bytes memory returndata) = _e.delegatecall(
            abi.encodeWithSelector(E.setN.selector, _n)
        );
        if (success == false) {
            // if there is a return reason string
            if (returndata.length > 0) {
                // bubble up any reason for revert
                assembly {
                    let returndata_size := mload(returndata)
                    revert(add(32, returndata), returndata_size)
                }
            } else {
                revert("Function call reverted");
            }
        }
    }
}

// 如果c调用d, d来调用e.delegatecall方法，那么在e里的msg.sender应该是c;
contract C {
    function foo(
        B _d,
        E _e,
        uint256 _n
    ) external {
        console.log("C-foo:msg.sender", msg.sender);
        _d.delegatecallSetN(address(_e), _n);
    }
}

contract E {
    address public sender;
    uint256 public i;
    uint256 public n;

    function inc() public returns (uint256) {
        console.log("E.msg.sender", msg.sender);
        sender = msg.sender;
        i = i + 1;
        return i;
    }

    function setN(uint256 _n) public {
        console.log("E-setN:msg.sender", msg.sender);
        console.log("E-setN", _n);
        sender = msg.sender;
        n = _n;
    }
}
