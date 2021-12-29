pragma solidity 0.6.12;

library TokenListenerLibrary {
  /*
    *     bytes4(keccak256('beforeTokenMint(address,uint256,address,address)')) == 0x4d7f3db0
    *     bytes4(keccak256('beforeTokenTransfer(address,address,uint256,address)')) == 0xb2210957
    *
    *     => 0x4d7f3db0 ^ 0xb2210957 == 0xff5e34e7
    */
  bytes4 public constant ERC165_INTERFACE_ID_TOKEN_LISTENER = 0xff5e34e7;
}