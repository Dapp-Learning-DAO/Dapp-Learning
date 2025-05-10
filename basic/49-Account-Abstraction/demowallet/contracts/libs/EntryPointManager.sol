pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/Context.sol";

contract EntryPointManager is Context {

    error InvalidSender(address sender);

    event SetEntryPoint(address prevEp, address newEp);

    address public entryPoint;

    constructor(address _entryPoint) {
        _setEntryPoint(_entryPoint);
    }

    modifier onlyEntryPoint() {
        _requireEntryPoint();
        _;
    }

    function _setEntryPoint(address _entryPoint) internal{
        address prevEp = entryPoint;
        entryPoint =  _entryPoint;
        emit SetEntryPoint(prevEp, _entryPoint);
    }

    function _requireEntryPoint() internal view {
        address sender = _msgSender();
        if (sender != entryPoint) {
            revert InvalidSender(sender);            
        }
    }
}