// SPDX-License-Identifier: MIT
pragma solidity >0.5.0 <0.8.0;

interface WithdrawProxy {

    function withdraw(address _l2Token, uint256 _amount, uint32 _l1Gas, bytes memory _data) external payable;
}