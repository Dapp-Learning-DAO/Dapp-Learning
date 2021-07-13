
## 简介
在 TheGraph 成功创建 SubGraph 后，我们就可以去抓取相应的数据，并存入本地数据库中，以便后续进行加工处理

## 相关依赖说明
本样例测试通过环境如下:
- mysql : 8.0.22
- node  : v14.16.1

## 操作流程
- 启动 mysql
在此假设使用的是本地 mysql, 执行后续流程前需要启动本地 mysql 

- 创建表

在 mysql 中执行如下的 sql 语句

```
CREATE TABLE IF NOT EXISTS `swap_positions`(
   `id` INT UNSIGNED,
   `owner` VARCHAR(50) NOT NULL,
   `liquidity` INT UNSIGNED,
   `pool_createdAtTimestamp` INT UNSIGNED,
   `pool_id` VARCHAR(50) NOT NULL,
   `depositedToken0` double(30,20),
   `depositedToken1` double(30,20),
   `token0_symbol` VARCHAR(10) NOT NULL,
   `token1_symbol` VARCHAR(10) NOT NULL,
   `withdrawnToken0` double(30,20),
   `withdrawnToken1` double(30,20),
   PRIMARY KEY ( `id` )
)ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

- 安装相关依赖
```
yarn 
```

- 修改 mysql 连接配置
修改 mysql_conf.json 配置文件中的配置，包括 user, password, database

- 获取数据
```
node fetch_data.js
```

- 查看数据
登录 mysql 数据库，执行如下 sql 语句，查看数据是否保存成功
```
select * from swap_positions \G;
```

- graph 事件订阅
```
node subscription.js
```

- 触发事件，观察订阅结果
触发对应地址上的事件，观察输出结果

PS: 成功创建自己的 graph 后, 修改订阅的代码，订阅地址指向自己的 graph， 然后触发相应的事件, 就可以观察到成功收到通知

## 参考文档
https://blog.csdn.net/luxinghong199106/article/details/103471633  
https://thegraph.com/docs/graphql-api#pagination 
https://www.freecodecamp.org/news/get-started-with-graphql-and-nodejs/ 
https://github.com/hasura/nodejs-graphql-subscriptions-boilerplate  