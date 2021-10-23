# Configuration

## ReserveConfiguration

以 uint256 数值上的不同位的数值来表示资产不同的配置。

## UserConfiguration

以 uint256 数值上的不同位的数值来表示用户不同的配置，该配置仅限内部使用，用户无法外部更改。主要是用户对于资产的设置，对于所有特定资产，都有两位数来表示，是否有抵押，是否有借贷。

```js
// UserConfiguration.data类似以下二进制形式
// 每两位数代表一个资产的配置
// 第一位表示用户是否有该类资产抵押在协议中
// 第二位表示用户是否有该类资产的借贷
00 // 没有抵押，没有借贷
01 // 没有抵押，有借贷
10 // 有抵押，没有借贷
11 // 有抵押，有借贷
```

上述是示例，实际有256位，即最多表达 128 个资产的配置。

### setBorrowing

设置用户在某特定上资产有无借贷

```solidity
/**
  * @dev Sets if the user is borrowing the reserve identified by reserveIndex
  * @param self The configuration object
  * @param reserveIndex The index of the reserve in the bitmap
  * @param borrowing True if the user is borrowing the reserve, false otherwise
  **/
function setBorrowing(
  DataTypes.UserConfigurationMap storage self,
  uint256 reserveIndex, // 资产的序号
  bool borrowing  // 是否有借贷
) internal {
  require(reserveIndex < 128, Errors.UL_INVALID_INDEX);
  // 改变表示资产配置两位数的第二位
  self.data =
    (self.data & ~(1 << (reserveIndex * 2))) |
    (uint256(borrowing ? 1 : 0) << (reserveIndex * 2));
}
```

### setUsingAsCollateral

设置用户在某特定上资产有无抵押

```solidity
/**
  * @dev Sets if the user is using as collateral the reserve identified by reserveIndex
  * @param self The configuration object
  * @param reserveIndex The index of the reserve in the bitmap
  * @param usingAsCollateral True if the user is usin the reserve as collateral, false otherwise
  **/
function setUsingAsCollateral(
  DataTypes.UserConfigurationMap storage self,
  uint256 reserveIndex, // 资产的序号
  bool usingAsCollateral  // 是否有抵押
) internal {
  require(reserveIndex < 128, Errors.UL_INVALID_INDEX);
  // 改变表示资产配置两位数的第一位
  self.data =
    (self.data & ~(1 << (reserveIndex * 2 + 1))) |
    (uint256(usingAsCollateral ? 1 : 0) << (reserveIndex * 2 + 1));
}
```

### isBorrowingAny

用户是否有借贷过任何一个资产。

```solidity
// 每个资产第二位是1，第一位是0，即都是 01 的形式
uint256 internal constant BORROWING_MASK =
    0x5555555555555555555555555555555555555555555555555555555555555555;

/**
  * @dev Used to validate if a user has been borrowing from any reserve
  * @param self The configuration object
  * @return True if the user has been borrowing any reserve, false otherwise
  **/
function isBorrowingAny(DataTypes.UserConfigurationMap memory self) internal pure returns (bool) {
  return self.data & BORROWING_MASK != 0;
}
```
