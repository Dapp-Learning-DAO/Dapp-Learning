// SPDX-License-Identifier: MIT

pragma solidity ^0.5.17;

interface IWrappedVault {
    function token() external view returns (address);

    function name() external view returns (string memory);

    function symbol() external view returns (string memory);

    function decimals() external view returns (uint8);

    function governance() external view returns (address);

    function vault() external view returns (address);

    function getPricePerFullShare() external view returns (uint256);
}
