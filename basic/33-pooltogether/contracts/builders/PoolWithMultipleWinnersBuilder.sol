// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts-upgradeable/utils/SafeCastUpgradeable.sol";
import "@pooltogether/yield-source-interface/contracts/IYieldSource.sol";

import "../registry/RegistryInterface.sol";
import "../prize-pool/compound/CompoundPrizePoolProxyFactory.sol";
import "../prize-pool/yield-source/YieldSourcePrizePoolProxyFactory.sol";
import "../prize-pool/stake/StakePrizePoolProxyFactory.sol";
import "./MultipleWinnersBuilder.sol";

contract PoolWithMultipleWinnersBuilder {
  using SafeCastUpgradeable for uint256;

  event CompoundPrizePoolWithMultipleWinnersCreated(
    CompoundPrizePool indexed prizePool,
    MultipleWinners indexed prizeStrategy
  );

  event YieldSourcePrizePoolWithMultipleWinnersCreated(
    YieldSourcePrizePool indexed prizePool,
    MultipleWinners indexed prizeStrategy
  );

  event StakePrizePoolWithMultipleWinnersCreated(
    StakePrizePool indexed prizePool,
    MultipleWinners indexed prizeStrategy
  );

  /// @notice The configuration used to initialize the Compound Prize Pool
  struct CompoundPrizePoolConfig {
    CTokenInterface cToken;
    uint256 maxExitFeeMantissa;
  }

  /// @notice The configuration used to initialize the Compound Prize Pool
  struct YieldSourcePrizePoolConfig {
    IYieldSource yieldSource;
    uint256 maxExitFeeMantissa;
  }

  struct StakePrizePoolConfig {
    IERC20Upgradeable token;
    uint256 maxExitFeeMantissa;
  }

  RegistryInterface public reserveRegistry;
  CompoundPrizePoolProxyFactory public compoundPrizePoolProxyFactory;
  YieldSourcePrizePoolProxyFactory public yieldSourcePrizePoolProxyFactory;
  StakePrizePoolProxyFactory public stakePrizePoolProxyFactory;
  MultipleWinnersBuilder public multipleWinnersBuilder;

  constructor (
    RegistryInterface _reserveRegistry,
    CompoundPrizePoolProxyFactory _compoundPrizePoolProxyFactory,
    YieldSourcePrizePoolProxyFactory _yieldSourcePrizePoolProxyFactory,
    StakePrizePoolProxyFactory _stakePrizePoolProxyFactory,
    MultipleWinnersBuilder _multipleWinnersBuilder
  ) public {
    require(address(_reserveRegistry) != address(0), "GlobalBuilder/reserveRegistry-not-zero");
    require(address(_compoundPrizePoolProxyFactory) != address(0), "GlobalBuilder/compoundPrizePoolProxyFactory-not-zero");
    require(address(_yieldSourcePrizePoolProxyFactory) != address(0), "GlobalBuilder/yieldSourcePrizePoolProxyFactory-not-zero");
    require(address(_stakePrizePoolProxyFactory) != address(0), "GlobalBuilder/stakePrizePoolProxyFactory-not-zero");
    require(address(_multipleWinnersBuilder) != address(0), "GlobalBuilder/multipleWinnersBuilder-not-zero");
    reserveRegistry = _reserveRegistry;
    compoundPrizePoolProxyFactory = _compoundPrizePoolProxyFactory;
    yieldSourcePrizePoolProxyFactory = _yieldSourcePrizePoolProxyFactory;
    stakePrizePoolProxyFactory = _stakePrizePoolProxyFactory;
    multipleWinnersBuilder = _multipleWinnersBuilder;
  }

  function createCompoundMultipleWinners(
    CompoundPrizePoolConfig memory prizePoolConfig,
    MultipleWinnersBuilder.MultipleWinnersConfig memory prizeStrategyConfig,
    uint8 decimals
  ) external returns (CompoundPrizePool) {
    CompoundPrizePool prizePool = compoundPrizePoolProxyFactory.create();
    MultipleWinners prizeStrategy = multipleWinnersBuilder.createMultipleWinners(
      prizePool,
      prizeStrategyConfig,
      decimals,
      msg.sender
    );
    prizePool.initialize(
      reserveRegistry,
      _tokens(prizeStrategy),
      prizePoolConfig.maxExitFeeMantissa,
      CTokenInterface(prizePoolConfig.cToken)
    );
    prizePool.setPrizeStrategy(prizeStrategy);
    prizePool.setCreditPlanOf(
      address(prizeStrategy.ticket()),
      prizeStrategyConfig.ticketCreditRateMantissa.toUint128(),
      prizeStrategyConfig.ticketCreditLimitMantissa.toUint128()
    );
    prizePool.transferOwnership(msg.sender);
    emit CompoundPrizePoolWithMultipleWinnersCreated(prizePool, prizeStrategy);
    return prizePool;
  }

  function createYieldSourceMultipleWinners(
    YieldSourcePrizePoolConfig memory prizePoolConfig,
    MultipleWinnersBuilder.MultipleWinnersConfig memory prizeStrategyConfig,
    uint8 decimals
  ) external returns (YieldSourcePrizePool) {
    YieldSourcePrizePool prizePool = yieldSourcePrizePoolProxyFactory.create();
    MultipleWinners prizeStrategy = multipleWinnersBuilder.createMultipleWinners(
      prizePool,
      prizeStrategyConfig,
      decimals,
      msg.sender
    );
    prizePool.initializeYieldSourcePrizePool(
      reserveRegistry,
      _tokens(prizeStrategy),
      prizePoolConfig.maxExitFeeMantissa,
      prizePoolConfig.yieldSource
    );
    prizePool.setPrizeStrategy(prizeStrategy);
    prizePool.setCreditPlanOf(
      address(prizeStrategy.ticket()),
      prizeStrategyConfig.ticketCreditRateMantissa.toUint128(),
      prizeStrategyConfig.ticketCreditLimitMantissa.toUint128()
    );
    prizePool.transferOwnership(msg.sender);
    emit YieldSourcePrizePoolWithMultipleWinnersCreated(prizePool, prizeStrategy);
    return prizePool;
  }

  function createStakeMultipleWinners(
    StakePrizePoolConfig memory prizePoolConfig,
    MultipleWinnersBuilder.MultipleWinnersConfig memory prizeStrategyConfig,
    uint8 decimals
  ) external returns (StakePrizePool) {
    StakePrizePool prizePool = stakePrizePoolProxyFactory.create();
    MultipleWinners prizeStrategy = multipleWinnersBuilder.createMultipleWinners(
      prizePool,
      prizeStrategyConfig,
      decimals,
      msg.sender
    );
    prizePool.initialize(
      reserveRegistry,
      _tokens(prizeStrategy),
      prizePoolConfig.maxExitFeeMantissa,
      prizePoolConfig.token
    );
    prizePool.setPrizeStrategy(prizeStrategy);
    prizePool.setCreditPlanOf(
      address(prizeStrategy.ticket()),
      prizeStrategyConfig.ticketCreditRateMantissa.toUint128(),
      prizeStrategyConfig.ticketCreditLimitMantissa.toUint128()
    );
    prizePool.transferOwnership(msg.sender);
    emit StakePrizePoolWithMultipleWinnersCreated(prizePool, prizeStrategy);
    return prizePool;
  }

  function _tokens(MultipleWinners _multipleWinners) internal view returns (ControlledTokenInterface[] memory) {
    ControlledTokenInterface[] memory tokens = new ControlledTokenInterface[](2);
    tokens[0] = ControlledTokenInterface(address(_multipleWinners.ticket()));
    tokens[1] = ControlledTokenInterface(address(_multipleWinners.sponsorship()));
    return tokens;
  }

}
