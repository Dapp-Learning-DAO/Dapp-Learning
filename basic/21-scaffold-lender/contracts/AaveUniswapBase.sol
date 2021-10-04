// SPDX-License-Identifier: agpl-3.0
pragma solidity >=0.6.0 <0.9.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol"; //https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol
import "@openzeppelin/contracts/math/SafeMath.sol"; //https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol
import "./interfaces/ILendingPool.sol";
import "./interfaces/ILendingPoolAddressesProvider.sol";
import "./interfaces/IProtocolDataProvider.sol";
import "./interfaces/IPriceOracle.sol";
import "./interfaces/IUniswapV2Router02.sol";
import { DataTypes } from './libraries/DataTypes.sol';

contract AaveUniswapBase {

  using SafeMath for uint256;

  constructor(address lendingPoolAddressesProviderAddress, address uniswapRouterAddress) public {
    ADDRESSES_PROVIDER = ILendingPoolAddressesProvider(lendingPoolAddressesProviderAddress);
    UNISWAP_ROUTER = IUniswapV2Router02(uniswapRouterAddress);
    UNISWAP_ROUTER_ADDRESS = uniswapRouterAddress;
  }

  ILendingPoolAddressesProvider public immutable ADDRESSES_PROVIDER;
  IUniswapV2Router02 public immutable UNISWAP_ROUTER;
  address public immutable UNISWAP_ROUTER_ADDRESS;

  bytes32 public constant PROTOCOL_DATA_PROVIDER_LOOKUP = 0x0100000000000000000000000000000000000000000000000000000000000000;

  function LENDING_POOL() public view returns (ILendingPool) {
    address _lendingPoolAddress = ADDRESSES_PROVIDER.getLendingPool();
    return ILendingPool(_lendingPoolAddress);
  }

  function getPriceOracle() internal view returns (IPriceOracleGetter) {
    address _priceOracleAddress = ADDRESSES_PROVIDER.getPriceOracle();
    return IPriceOracleGetter(_priceOracleAddress);
  }

  function getProtocolDataProvider() internal view returns (IProtocolDataProvider)  {
    return IProtocolDataProvider(ADDRESSES_PROVIDER.getAddress(PROTOCOL_DATA_PROVIDER_LOOKUP));
  }

  function getAaveAssetReserveData(address asset) public view returns (DataTypes.ReserveData memory) {
    return LENDING_POOL().getReserveData(asset);
  }

}
