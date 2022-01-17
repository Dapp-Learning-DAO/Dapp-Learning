// SPDX-License-Identifier: MIT
pragma solidity >0.5.0 <0.8.0;

interface L1ChugSplashProxy {

    function depositETH(uint32 _l2Gas, bytes memory _data) external payable;
}