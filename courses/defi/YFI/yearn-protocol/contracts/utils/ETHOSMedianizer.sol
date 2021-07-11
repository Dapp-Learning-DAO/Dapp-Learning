pragma solidity ^0.5.17;

import "../../interfaces/maker/OracleSecurityModule.sol";

interface Medianizer {
    function read() external view returns (bytes32);
}

contract ETHOSMedianizer {
    mapping(address => bool) public authorized;
    address public governance;

    OracleSecurityModule public constant OSM = OracleSecurityModule(0x81FE72B5A8d1A857d176C3E7d5Bd2679A9B85763);
    Medianizer public constant MEDIANIZER = Medianizer(0x729D19f657BD0614b4985Cf1D82531c67569197B);

    constructor() public {
        governance = msg.sender;
    }

    function setGovernance(address _governance) external {
        require(msg.sender == governance, "!governance");
        governance = _governance;
    }

    function setAuthorized(address _authorized) external {
        require(msg.sender == governance, "!governance");
        authorized[_authorized] = true;
    }

    function revokeAuthorized(address _authorized) external {
        require(msg.sender == governance, "!governance");
        authorized[_authorized] = false;
    }

    function read() external view returns (uint256 price, bool osm) {
        if (authorized[msg.sender]) {
            if (OSM.bud(address(this)) == 1) {
                (bytes32 _val, ) = OSM.peek();
                return (uint256(_val), true);
            }
        }
        return (uint256(MEDIANIZER.read()), false);
    }

    function foresight() external view returns (uint256 price, bool osm) {
        if (authorized[msg.sender]) {
            if (OSM.bud(address(this)) == 1) {
                (bytes32 _val, ) = OSM.peep();
                return (uint256(_val), true);
            }
        }
        return (uint256(MEDIANIZER.read()), false);
    }
}
