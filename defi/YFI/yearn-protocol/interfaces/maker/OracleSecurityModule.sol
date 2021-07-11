pragma solidity ^0.5.17;

interface OracleSecurityModule {
    function peek() external view returns (bytes32, bool);

    function peep() external view returns (bytes32, bool);

    function bud(address) external view returns (uint256);
}
