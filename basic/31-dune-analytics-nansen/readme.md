# duneanalytics & nansen

## 介绍
DuneAnalytics 是一个研究以太坊智能合约数据的强大工具，它可以查询，提取和可视化以太坊区块链上的数据。你在 DuneAnalytics 可以通过 Sql 查询 eth 的线上数据信息，这不需要你运行 Eth 节点，也不需要了解 RPC api，跟在普通数据库使用 Sql 体验一样。

## 通俗解释

简单来说，DuneAnalytics = PostgreSQL + Ethereum 的组合，PostgreSQL 是世界上非常知名的数据库软件，比 Mysql 更加强大，是贫民版的 Oracle 数据库（甲骨文数据库，跟预言机关系不大）。

DuneAnalytics 是把 Eth 的链上数据，已结构化的形式存放到数据库中，只要你会用 Sql，就可以构造不同的查询条件进行灵活的查询。

## PostgreSQL

### 严格的sql格式

pgsql对Sql语法的要求非常严苛，更接近 Sql 标准，比mysql要严格。

```sql
author= 'bob' -- 正确

author= "bob" -- 错误
```

### 系统函数表
关键字：`information_schema` `pg_catalog`

```sql
-- 查询 duneanalytics 所有数据库的所有表
SELECT * FROM pg_catalog.pg_tables
WHERE schemaname != 'pg_catalog' AND
    schemaname != 'information_schema';
```

```sql
-- https://duneanalytics.com/queries/50446
-- 查询表结构
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns WHERE table_name = 'blocks';
```

```sql
-- 查询 uniswap_v2 数据库的所有表
SELECT * FROM pg_catalog.pg_tables
  WHERE schemaname = 'uniswap_v2';

-- 模糊查询，查询数据库名类似 aave 的数据库
SELECT DISTINCT(schemaname) FROM pg_catalog.pg_tables
  WHERE schemaname LIKE '%aave%';

-- 模糊查询，查询表名类似 evt 的表
SELECT DISTINCT(tablename) FROM pg_catalog.pg_tables
  WHERE tablename LIKE '%evt%';

-- 模糊查询，查询uniswap_v2数据库中表名类似 evt 的表
SELECT DISTINCT(tablename) FROM pg_catalog.pg_tables
  WHERE tablename LIKE '%evt%' and schemaname = 'uniswap_v2';
```

## DuneAnalytics 常见表的数据结构

### blocks

记录区块数据

```sql
-- https://duneanalytics.com/queries/50446

select * from ethereum.blocks order by time desc limit 1;
```


### transactions

记录交易数据

```sql
select * from ethereum.transactions order by block_time desc limit 1;

-- https://duneanalytics.com/queries/50439
```

### contracts

记录合约数据

```sql
-- https://duneanalytics.com/queries/50448

select * from  ethereum.contracts order by created_at desc limit 1;

SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns WHERE table_name = 'contracts';
```

### logs

记录 eth 所有的事件，包括 transfer、mint、burn 等

```sql
-- https://duneanalytics.com/queries/50451

SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns WHERE table_name = 'logs';

select * from ethereum.logs limit 1;
```

### prices.layer1_usd 表

以分钟为单位的 ETH 和许多其他流行代币的价格表

```sql
SELECT * FROM pg_catalog.pg_tables
  WHERE schemaname = 'prices';

select * from prices.layer1_usd order by minute desc limit 1;

select * from prices.layer1_usd where symbol='ETH' order by minute desc limit 5;

SELECT DISTINCT(symbol) from prices.layer1_usd limit 10;
```

### erc20."ERC20_evt_Transfer" 表

记录发送 token 时触发的所有转账事件

```sql
SELECT * FROM pg_catalog.pg_tables
  WHERE schemaname = 'erc20';

select * from erc20.tokens limit 10;

select * from erc20."ERC20_evt_Transfer" limit 10;

select * from erc20."ERC20_evt_Transfer" order by evt_block_time limit 10; -- 表名必须是 erc20."ERC20_evt_Transfer"

```

---

## 重点说说 logs 表相关的内容

### 如何得到 event logs hash

请看以下连接，这里不做过多介绍

https://medium.com/mycrypto/understanding-event-logs-on-the-ethereum-blockchain-f4ae7ba50378

https://etherscan.io/tx/0xe64069acd123ec94b8a3316378183ba8bf42b40979df3b0bb57b0e7b9e47ef38#eventlog

### uniswap 常见的 event logs hash

```sql
PairCreated(address,address,address,uint256) 0x0d3648bd0f6ba80134a33ba9275ac585d9d315f0ad8355cddefde31afa28d0e9

Swap() 0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822

Sync() 0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1

Mint() 0x4c209b5fc8ad50758f13e2e1088ba56a560dff690a1c6fef26394f4c03821c4f

Burn() 0xdccd412f0b1252819cb1fd330b93224ca42612892bb3f4f789976e6d81936496
```

### eth-usdt 交易对 为例

详细数据请看 https://v2.info.uniswap.org/pair/0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852

我们找到 eth-usdt 交易对的合约地址是 `0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852`。

```sql
-- 交易对产生了多少事件？
-- 结果 6124700
select count(*) from ethereum.logs where
  "contract_address"= '\x0d4a11d5eeaac28ec3f61d100daf4d40471f1852';
```


```sql
-- 合约创建日期
-- 运行了10分钟 还没有结果
select block_time, block_number, tx_index from ethereum.logs
  where "contract_address"= '\x0d4a11d5eeaac28ec3f61d100daf4d40471f1852'
  order by "block_time" asc limit 1;
```

```sql
-- pair 添加流动性次数
-- 结果 37176
select count(*) from ethereum.logs
  where "contract_address"= '\x0d4a11d5eeaac28ec3f61d100daf4d40471f1852'
  and "topic1" = '\x4c209b5fc8ad50758f13e2e1088ba56a560dff690a1c6fef26394f4c03821c4f';
```

## Parameter

Parameter 是变量替换

https://docs.duneanalytics.com/about/tutorials/dune-guides/tips#filter-queries-and-dashboards-with-parameters

```sql
select count(*) from ethereum.logs where
  "contract_address"= CONCAT('\x', substring('{{token_addr}}' from 3))::bytea;
```

## 例子

### 过去10天 每天发送的ETH的总量
```sql
select date_trunc('day', block_time) as "Date", sum(value/1e18) as "Value"
from ethereum."transactions"
where block_time > now() - interval '10 days'
group by 1 order by 1

--group by 1 按照 第1个字段分组
--order by 1 按照 第1个字段排序
```

### Top 10 token holders 查询代币的分配情况

```sql
WITH transfers AS (
  SELECT
    evt_block_time,
    tr."from" AS address,
    -tr.value AS amount,
    contract_address
     FROM erc20."ERC20_evt_Transfer" tr
    WHERE contract_address = CONCAT('\x', substring('{{Token Address}}' from 3))::bytea -- Allow user to input 0x... format and convert to \x... format

UNION ALL

    SELECT
    evt_block_time,
    tr."to" AS address,
    tr.value AS amount,
      contract_address
     FROM erc20."ERC20_evt_Transfer" tr
     WHERE contract_address = CONCAT('\x', substring('{{Token Address}}' from 3))::bytea -- Allow user to input 0x... format and convert to \x... format
)

SELECT
  address,
  sum(amount/10^decimals) as balance
  FROM transfers tr
  LEFT JOIN erc20.tokens tok ON tr.contract_address = tok.contract_address
  GROUP BY 1
  ORDER BY 2 DESC
  LIMIT 10
```

### 查询 uniswapV3 nft 添加流动性信息

关键是找到表 `NonfungibleTokenPositionManager_evt_IncreaseLiquidity`


```sql
-- 查询 uniswap_v3 数据库的所有表
SELECT * FROM pg_catalog.pg_tables
  WHERE schemaname = 'uniswap_v3';

  -- 模糊查询，查询表名类似 evt 的表
SELECT DISTINCT(tablename) FROM pg_catalog.pg_tables
  WHERE tablename LIKE '%evt%' and schemaname = 'uniswap_v3';

 select * from  uniswap_v3."NonfungibleTokenPositionManager_evt_IncreaseLiquidity" where
   contract_address = '\xc36442b4a4522e871399cd717abdd847ab11fe88';
```

## 参考链接

- 视频：https://www.bilibili.com/video/BV1ZK4y137Ce
- nansen说明书： https://github.com/rebase-network/Dapp-Learning-Arsenal/blob/main/papers/7-tool/nansen中文说明书.pdf

- https://qiita.com/shooter/items/3b66fc6400bc49854ffe

- https://learnblockchain.cn/article/1746

- https://docs.duneanalytics.com/data-tables/data-tables/raw-data/ethereum-data

- https://duneanalytics.com/browse/queries?user_name=shooter

- https://app.flipsidecrypto.com/velocity

- https://glassnode.com/