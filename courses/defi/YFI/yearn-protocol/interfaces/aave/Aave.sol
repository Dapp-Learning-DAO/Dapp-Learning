pragma solidity ^0.5.17;

interface Aave {
    function borrow(
        address _reserve,
        uint256 _amount,
        uint256 _interestRateModel,
        uint16 _referralCode
    ) external;

    function setUserUseReserveAsCollateral(address _reserve, bool _useAsCollateral) external;

    function repay(
        address _reserve,
        uint256 _amount,
        address payable _onBehalfOf
    ) external payable;

    function getUserAccountData(address _user)
        external
        view
        returns (
            uint256 totalLiquidityETH,
            uint256 totalCollateralETH,
            uint256 totalBorrowsETH,
            uint256 totalFeesETH,
            uint256 availableBorrowsETH,
            uint256 currentLiquidationThreshold,
            uint256 ltv,
            uint256 healthFactor
        );

    function getUserReserveData(address _reserve, address _user)
        external
        view
        returns (
            uint256 currentATokenBalance,
            uint256 currentBorrowBalance,
            uint256 principalBorrowBalance,
            uint256 borrowRateMode,
            uint256 borrowRate,
            uint256 liquidityRate,
            uint256 originationFee,
            uint256 variableBorrowIndex,
            uint256 lastUpdateTimestamp,
            bool usageAsCollateralEnabled
        );
}
