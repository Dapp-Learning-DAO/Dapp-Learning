# Graph 请求解析

## GraphQuery

Interface 实际上只用到两个 graph 查询

- allV3Ticks 查询给定地址的 Pool 上，所有 ticks 的状态
- feeTierDistribution 查询交易对每种费率水平各自的 TVL
- [UniswapV3 官方 subgraph](https://thegraph.com/explorer/subgraph?id=0x9bde7bf4d5b13ef94373ced7c8ee0be59735a298-2)

```ts
export const api = createApi({
  reducerPath: 'dataApi',
  baseQuery: graphqlRequestBaseQuery(),
  endpoints: (builder) => ({
    allV3Ticks: builder.query({
      query: ({ poolAddress, skip = 0 }) => ({
        document: gql`
          query allV3Ticks($poolAddress: String!, $skip: Int!) {
            ticks(first: 1000, skip: $skip, where: { poolAddress: $poolAddress }, orderBy: tickIdx) {
              tickIdx
              liquidityNet
              price0
              price1
            }
          }
        `,
        variables: {
          poolAddress,
          skip,
        },
      }),
    }),
    feeTierDistribution: builder.query({
      query: ({ token0, token1 }) => ({
        document: gql`
          query feeTierDistribution($token0: String!, $token1: String!) {
            _meta {
              block {
                number
              }
            }
            asToken0: pools(orderBy: totalValueLockedToken0, orderDirection: desc, where: { token0: $token0, token1: $token1 }) {
              feeTier
              totalValueLockedToken0
              totalValueLockedToken1
            }
            asToken1: pools(orderBy: totalValueLockedToken0, orderDirection: desc, where: { token0: $token1, token1: $token0 }) {
              feeTier
              totalValueLockedToken0
              totalValueLockedToken1
            }
          }
        `,
        variables: {
          token0,
          token1,
        },
      }),
    }),
  }),
});
```

## feeTierDistribution

根据交易对的 token 地址，查询有几种费率的交易池子，返回详细信息。这里查询了 WETH 和 USDC 的交易对，由于没有对地址排序，所以直接请求两种排序的数据，返回的结果一般只有一种排序，即 token 地址升序排列的情况。

查询示例

```graphql
{
  _meta {
    block {
      number
    }
  }
  asToken0: pools(
    orderBy: totalValueLockedToken0
    orderDirection: desc
    where: { token0: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", token1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" }
  ) {
    feeTier
    totalValueLockedToken0
    totalValueLockedToken1
  }
  asToken1: pools(
    orderBy: totalValueLockedToken0
    orderDirection: desc
    where: { token0: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", token1: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" }
  ) {
    feeTier
    totalValueLockedToken0
    totalValueLockedToken1
  }
}
```

返回示例

```js
{
  "data": {
    "_meta": {
      "block": {
        "number": 13143132
      }
    },
    // ETH-USDC
    "asToken0": [],
    // USDC-ETH
    "asToken1": [
      {
        "feeTier": "3000",    // 费率 0.3%
        "totalValueLockedToken0": "253659824.397486",
        "totalValueLockedToken1": "25022.130545691318210375"
      },
      {
        "feeTier": "500",    // 费率 0.05%
        "totalValueLockedToken0": "100058813.483093",
        "totalValueLockedToken1": "6623.543370809900944755"
      },
      {
        "feeTier": "10000",    // 费率 1%
        "totalValueLockedToken0": "1097829.415669",
        "totalValueLockedToken1": "248.996442830368151426"
      }
    ]
  }
}
```

拿到每个费率池子的锁仓量 TVL 之后，计算每种池子的 TVL 占比，在界面上会显示百分之多少的流动性选择了哪个等级的分率

## allV3Ticks

查询给定地址的 Pool 上，所有 ticks 的状态

查询示例

```graphql
{
  ticks(
    first: 1000,
    skip: 0,
    where: {
      // USDC-WETH 0.3%
      poolAddress: "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640"
    },
    orderBy: tickIdx
  ) {
    tickIdx
    liquidityNet
    price0
    price1
  }
}
```

返回示例 tickIdx 从 -887270 到 201400 升序排列

```js
{
  "data": {
    "ticks": [
      {
        "liquidityNet": "0",
        "price0": "0.000000000000000000000000000000000000002939544628336670031698378204689082",
        "price1": "340188745685363564484273285553137100000",
        "tickIdx": "-887270"
      },
      {
        "liquidityNet": "0",
        "price0": "0.00000000000000355174820366365708320222765548087",
        "price1": "281551490324818.6029024621894650913",
        "tickIdx": "-332730"
      },
      ...
      {
        "liquidityNet": "-1544280459011946",
        "price0": "556953948.7168119249654500816462514",
        "price1": "0.000000001795480582019284128971952747346669",
        "tickIdx": "201390"
      },
      {
        "liquidityNet": "-11794625",
        "price0": "557511153.3616518307383631680060072",
        "price1": "0.000000001793686088556707568330086674308272",
        "tickIdx": "201400"
      }
    ]
  }
}
```