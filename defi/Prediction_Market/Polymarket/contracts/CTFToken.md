# CTF Token

### 概述
Polymarket 利用Gnosis 的条件代币框架（Conditional Tokens Framework, CTF）为用户提供了一个独特且动态的预测方式。这些结果代币为二元结果，代表“YES”和“NO”，使用 ERC1155 代币实现。以下将深入介绍如何使用条件代币框架（CTF）进行代币的拆分（Split）、合并（Merge）和赎回（Redeem）。

### 条件代币原理

条件代币基于ERC1155标准，它允许在单一合约中管理多种类型的代币。每个条件代币都由一个独特的`positionId`标识，它是根据抵押品代币和特定条件的结果集合（`collectionId`）生成的。`collectionId`则是由父集合（`parentCollectionId`），条件ID（`conditionId`）和索引集（`indexSet`）组合而成。

这些条件代币可以根据不同的结果进行拆分和合并。通过这种机制，用户可以在特定条件下根据事件的结果进行预测和参与市场活动。

### 切分（Split）


在 Polymarket 平台上，分裂操作是将一种基础代币（通常是 USDC）拆分为两个或多个代表不同结果的条件代币。例如，一个 USDC 可以拆分为 1 个代表 "YES" 结果的代币和 1 个代表 "NO" 结果的代币。这一操作允许用户在预测市场中对不同结果进行投资。

#### 操作流程

在合约中，`splitPosition`函数用于执行拆分操作。其关键参数包括：

- `collateralToken`: 担保代币的地址，用于支持拆分后的条件代币。
- `parentCollectionId`: 父集合ID，通常在简单场景下为空。
- `conditionId`: 需要拆分的条件ID。
- `partition`: 表示结果槽的索引集数组，每个元素表示结果集合中的某个子集。
- `amount`: 拆分的数量，表示从担保品中拆分出的条件代币数量。


通过调用 `splitPosition` 函数，用户可以将他们的基础代币拆分为多个不同的条件代币。每个条件代币代表一个特定的结果，这些代币可以在预测市场中进行交易或持有。

这一行为主要目的其实是给polymarket的某个预测提供初始代币流动性。

#### 示例代码

```solidity
function splitPosition(
    IERC20 collateralToken,
    bytes32 parentCollectionId,
    bytes32 conditionId,
    uint[] calldata partition,
    uint amount
) external {
    require(partition.length > 1, "got empty or singleton partition");
    uint outcomeSlotCount = payoutNumerators[conditionId].length;
    require(outcomeSlotCount > 0, "condition not prepared yet");

    uint fullIndexSet = (1 << outcomeSlotCount) - 1;
    uint freeIndexSet = fullIndexSet;
    uint[] memory positionIds = new uint[](partition.length);
    uint[] memory amounts = new uint[](partition.length);
    for (uint i = 0; i < partition.length; i++) {
        uint indexSet = partition[i];
        require(indexSet > 0 && indexSet < fullIndexSet, "got invalid index set");
        require((indexSet & freeIndexSet) == indexSet, "partition not disjoint");
        freeIndexSet ^= indexSet;
        positionIds[i] = CTHelpers.getPositionId(collateralToken, CTHelpers.getCollectionId(parentCollectionId, conditionId, indexSet));
        amounts[i] = amount;
    }

    if (freeIndexSet == 0) {
        if (parentCollectionId == bytes32(0)) {
            require(collateralToken.transferFrom(msg.sender, address(this), amount), "could not receive collateral tokens");
        } else {
            _burn(
                msg.sender,
                CTHelpers.getPositionId(collateralToken, parentCollectionId),
                amount
            );
        }
    } else {
        _burn(
            msg.sender,
            CTHelpers.getPositionId(collateralToken,
                CTHelpers.getCollectionId(parentCollectionId, conditionId, fullIndexSet ^ freeIndexSet)),
            amount
        );
    }

    _batchMint(
        msg.sender,
        positionIds,
        amounts,
        ""
    );
    emit PositionSplit(msg.sender, collateralToken, parentCollectionId, conditionId, partition, amount);
}
```


当调用 `splitPosition` 函数时，合约内部会发生以下步骤：

1. **参数验证与准备**：
   - 合约首先检查输入的 `partition` 数组是否合法。
   - 验证 `conditionId` 代表的条件是否已经被准备（通过检查 `payoutNumerators` 映射），确保该条件已经在系统中注册。

2. **生成 Position ID**：
   - 根据输入的 `collateralToken`、`parentCollectionId` 和 `conditionId` 生成对应的 `positionId`，这是一个 ERC1155 代币 ID，表示拆分出的具体条件代币。

3. **代币转移与铸造**：
   - 合约会根据 `parentCollectionId` 的值决定是否从用户那里直接转移 `collateralToken` 或是销毁已有的 `positionId`。
   - 根据 `partition` 数组中的值，合约将为用户铸造一系列新的 ERC1155 条件代币。

4. **事件触发**：
   - 合约在成功拆分代币后，会触发 `PositionSplit` 事件，记录此次操作的细节，包括拆分的用户、条件 ID、拆分的代币数量等。


### 合并（Merge）

#### 背景

合并操作是将多个代表不同结果的条件代币重新合并为一个基础代币。这个操作通常在预测事件进行中进行。通过合并，用户可以将持有的不同结果代币转换回基础代币(一般是USDT)。

这个过程实际上是用户提前退出并降低杠杆或者流动性提供方退出流动性提供的过程。

#### 操作流程

在智能合约中，`mergePosition` 函数用于执行合并操作。其关键参数与 `splitPosition` 类似：

- `collateralToken`: 支持条件代币的基础代币。
- `parentCollectionId`: 父集合 ID，通常在简单场景下为空。
- `conditionId`: 需要合并的条件 ID。
- `partition`: 一个表示结果槽的索引集数组。
- `amount`: 合并的数量，表示要合并的条件代币数量。

通过调用 `mergePosition` 函数，用户可以将他们的条件代币合并为基础代币用于退出流动性。

#### 示例代码

```solidity
function mergePositions(
    IERC20 collateralToken,
    bytes32 parentCollectionId,
    bytes32 conditionId,
    uint[] calldata partition,
    uint amount
) external {
    require(partition.length > 1, "got empty or singleton partition");
    uint outcomeSlotCount = payoutNumerators[conditionId].length;
    require(outcomeSlotCount > 0, "condition not prepared yet");

    uint fullIndexSet = (1 << outcomeSlotCount) - 1;
    uint freeIndexSet = fullIndexSet;
    uint[] memory positionIds = new uint;
    uint[] memory amounts = new uint;
    for (uint i = 0; i < partition.length; i++) {
        uint indexSet = partition[i];
        require(indexSet > 0 && indexSet < fullIndexSet, “got invalid index set”);
        require((indexSet & freeIndexSet) == indexSet, “partition not disjoint”);
        freeIndexSet ^= indexSet;
        positionIds[i] = CTHelpers.getPositionId(collateralToken, CTHelpers.getCollectionId(parentCollectionId, conditionId, indexSet));
        amounts[i] = amount;
    }
    _batchBurn(
        msg.sender,
        positionIds,
        amounts
    );
    if (freeIndexSet == 0) {
        if (parentCollectionId == bytes32(0)) {
            require(collateralToken.transfer(msg.sender, amount), "could not send collateral tokens");
        } else {
            _mint(
                msg.sender,
                CTHelpers.getPositionId(collateralToken, parentCollectionId),
                amount,
                ""
            );
        }
    } else {
        _mint(
            msg.sender,
            CTHelpers.getPositionId(collateralToken,
                CTHelpers.getCollectionId(parentCollectionId, conditionId, fullIndexSet ^ freeIndexSet)),
            amount,
            ""
        );
    }

    emit PositionsMerge(msg.sender, collateralToken, parentCollectionId, conditionId, partition, amount);
}
```
当调用 `mergePositions` 函数时，合约内部会发生以下步骤：

1. **参数验证与准备**：
   - 合约首先检查输入的 `partition` 数组是否合法。
   - 验证 `conditionId` 是否已经被准备，确保该条件已经在系统中注册。

2. **生成 Position ID**：
   - 根据 `collateralToken`、`parentCollectionId` 和 `conditionId` 生成对应的 `positionId`，表示将要合并的具体条件代币。

3. **代币销毁与转移**：
   - 合约会销毁用户持有的多个条件代币（`positionId`），并计算出需要返还给用户的基础代币（如 USDC）的数量。
   - 根据 `parentCollectionId` 的值，合约可能会直接将对应数量的 `collateralToken` 转移给用户，或者铸造新的 `positionId` 代表合并后的结果。

4. **事件触发**：
   - 合约在成功合并代币后，会触发 `PositionsMerge` 事件，记录此次操作的细节，包括合并的用户、条件 ID、合并的代币数量等。

### 赎回（Redeem）

#### 背景

赎回操作是指当条件的结果被报告后，用户可以将持有的条件代币兑换为基础抵押品。这个操作通常发生在某个事件的结果已经确定，并且用户希望将持有的代币转换为实际的抵押品代币。

这个过程基本都是发生在胜利方兑现奖金时发生。

#### 操作流程

在合约中，`redeemPositions`函数用于执行赎回操作。其关键参数包括：

- `collateralToken`: 担保代币的地址，用于赎回操作。
- `parentCollectionId`: 父集合ID，通常在简单场景下为空。
- `conditionId`: 需要赎回的条件ID。
- `indexSets`: 表示结果槽的索引集数组，表示要赎回的条件代币。

#### 示例代码

```solidity
function redeemPositions(IERC20 collateralToken, bytes32 parentCollectionId, bytes32 conditionId, uint[] calldata indexSets) external {
    uint den = payoutDenominator[conditionId];
    require(den > 0, "result for condition not received yet");
    uint outcomeSlotCount = payoutNumerators[conditionId].length;
    require(outcomeSlotCount > 0, "condition not prepared yet");

    uint totalPayout = 0;

    uint fullIndexSet = (1 << outcomeSlotCount) - 1;
    for (uint i = 0; i < indexSets.length; i++) {
        uint indexSet = indexSets[i];
        require(indexSet > 0 && indexSet < fullIndexSet, "got invalid index set");
        uint positionId = CTHelpers.getPositionId(collateralToken,
            CTHelpers.getCollectionId(parentCollectionId, conditionId, indexSet));

        uint payoutNumerator = 0;
        for (uint j = 0; j < outcomeSlotCount; j++) {
            if (indexSet & (1 << j) != 0) {
                payoutNumerator = payoutNumerator.add(payoutNumerators[conditionId][j]);
            }
        }

        uint payoutStake = balanceOf(msg.sender, positionId);
        if (payoutStake > 0) {
            totalPayout = totalPayout.add(payoutStake.mul(payoutNumerator).div(den));
            _burn(msg.sender, positionId, payoutStake);
        }
    }

    if (totalPayout > 0) {
        if (parentCollectionId == bytes32(0)) {
            require(collateralToken.transfer(msg.sender, totalPayout), "could not transfer payout to message sender");
        } else {
            _mint(msg.sender, CTHelpers.getPositionId(collateralToken, parentCollectionId), totalPayout, "");
        }
    }
    emit PayoutRedemption(msg.sender, collateralToken, parentCollectionId, conditionId, indexSets, totalPayout);
}
```

当调用 `redeemPositions` 函数时，合约内部会发生以下步骤：

1. **参数验证与准备**：
   - 合约首先检查 `conditionId` 对应的条件是否已经有明确的结果（通过检查 `payoutDenominator`）。
   - 验证输入的 `indexSets` 数组是否合法，确保这些索引集是有效的并且与条件结果相匹配。

2. **计算用户的应得奖励**：
   - 合约根据用户持有的 `positionId` 代币数量，按照 `payoutNumerators` 和 `payoutDenominator` 的值计算用户应得的基础代币（如 USDC）数量。
   - 对于每个 `positionId`，合约会销毁用户持有的代币，并累计应发放的奖励总额。

3. **代币转移**：
   - 合约将计算出的奖励金额以 `collateralToken` 的形式转移给用户。如果条件的 `parentCollectionId` 为零，意味着用户将直接获得基础代币；否则，用户将获得代表结果的 `positionId` 代币。

4. **事件触发**：
   - 合约在成功赎回代币后，会触发 `PayoutRedemption` 事件，记录此次操作的细节，包括赎回的用户、条件 ID、赎回的代币数量等。

### 总结

CTF代币通过这三个操作过程为用户提供了灵活的工具来管理他们在polymarket中的投资，既可以根据市场变化调整头寸，又可以在结果确定后获得最终的收益。