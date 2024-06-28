// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

import {IERC20} from './interfaces/IERC20.sol';
import {SafeMath} from './libraries/SafeMath.sol';
import "./interfaces/aave-v3/IPool.sol";
import "./interfaces/aave-v3/IPoolAddressesProvider.sol";
import "./interfaces/aave-v3/IPoolDataProvider.sol";
import "./interfaces/aave-v3/IPriceOracleGetter.sol";
import "./interfaces/uniswap-v3/ISwapRouter.sol";
import { DataTypes } from './libraries/DataTypes.sol';

contract AaveUniswapBase {

  IPoolAddressesProvider public immutable ADDRESSES_PROVIDER;
  ISwapRouter public immutable UNISWAP_ROUTER;
  address public immutable UNISWAP_ROUTER_ADDRESS;

  // bytes32 public constant PROTOCOL_DATA_PROVIDER_LOOKUP = 0x0100000000000000000000000000000000000000000000000000000000000000;

  constructor(address lendingPoolAddressesProviderAddress, address uniswapRouterAddress) {
    ADDRESSES_PROVIDER = IPoolAddressesProvider(lendingPoolAddressesProviderAddress);
    UNISWAP_ROUTER = ISwapRouter(uniswapRouterAddress);
    UNISWAP_ROUTER_ADDRESS = uniswapRouterAddress;
  }

  // address public immutable _lendingPoolAddress =0xE0fBa4Fc209b4948668006B2bE61711b7f465bAe; 
  function LENDING_POOL() public view returns (IPool) {
    address _lendingPoolAddress = ADDRESSES_PROVIDER.getPool();
    return IPool(_lendingPoolAddress);
  }

  function getPriceOracle() internal view returns (IPriceOracleGetter) {
    address _priceOracleAddress = ADDRESSES_PROVIDER.getPriceOracle();
    return IPriceOracleGetter(_priceOracleAddress);
  }

  function getProtocolDataProvider() internal view returns (IPoolDataProvider)  {
    return IPoolDataProvider(ADDRESSES_PROVIDER.getPoolDataProvider());
  }

  function getAaveAssetReserveData(address asset) public view returns (DataTypes.ReserveData memory) {
    return LENDING_POOL().getReserveData(asset);
  }
}
