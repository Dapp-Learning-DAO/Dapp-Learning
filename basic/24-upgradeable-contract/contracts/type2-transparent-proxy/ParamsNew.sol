pragma solidity ^0.8.0;

import "./utils/Initializable.sol";
import "./utils/OwnableUpgradeable.sol";

contract ParamsNew is Initializable,OwnableUpgradeable {
	function initialize()public initializer{
		__Context_init_unchained();
		__Ownable_init_unchained();
	}
    mapping(string => uint256) private uint256Params;

    event Uint256ParamSetted(string indexed _key,uint256 _value);

    function SetUint256Param(string memory _key,uint256 _value) external onlyOwner{
        uint256Params[_key] = _value;
        emit Uint256ParamSetted(_key,_value);
    }


   function GetUint256Param(string memory _key)public view returns(uint256){
        uint256 v = uint256Params[_key];
        return v+1;
    }

}
