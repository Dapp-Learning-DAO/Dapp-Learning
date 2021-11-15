# cryptovoxels网站功能
1. 首页或Explore
是简介和cryptovoxels的入口, 点击play进入cryptovoxels
2. Map
cryptovoxels的平面全景图
3. Buy Parcels
地块购买
4. marketplace
市场, 其中商品包括, 玩家制作的各种3D NFT, 地块
5. Support
论坛
6. wiki地址:
https://wiki.cryptovoxels.com/


# cryptovoxels的主要元素
## parcel
parcel是cryptovoxels的主体结构, parcel被官方创造出来, 定期在opensea进行拍卖. parcel是含有权限控制的空间, 可设置能私人访问, 或特定玩家访问.
与之对应的是Spaces, Spaces是个虚拟的空间, 它不在cryptovoxels宇宙中.
除了权限控制, 拥有parcel才能使用The Grid脚本系统.

## Feature
parcel里包含feature, 比如:
button, nft-image, video等.

## Player
类似Roblox中的Character


# cryptovoxels的vox脚本系统
主要为Feature提供功能支持, 比如支持button点击的行为等.
## vox的脚本
类似roblox的client script, 运行在本地.参考https://wiki.cryptovoxels.com/en/Scripting/Scripting.
## The Grid
类似roblox的server script, 运行在服务器, 参考https://wiki.cryptovoxels.com/en/Scripting/TheGrid.


# cryptovoxels代码库的分析
cryptovoxels代码库和实际并不相符, 但是通过分析其代码库, 可以看到他大概的技术链构成.

## construct:https://github.com/cryptovoxels/construct
cryptovoxels的展示模板
```
npm install
npm start
```
报错TS7016, 将tsconfig.json中的"noImplicitAny"改为false.
再次运行npm start, 会看到一个渲染出来最基本的场景和块, 可以使用wasd建控制方向.


## contract(https://github.com/cryptovoxels/contracts)
区块链合约, 其中包括
1. Parcel
Parcel是ERC721Token, 可以mint, buy, burn, 可以设置Price和contentURI.

2. Name
ERC721Token, 应该是支持玩家对Parcel或Player命名的

3. Color
ERC20, Parcel的颜色


## parcel-market-subgraph
监听cryptovoxels的opensea市场交易事件


## maps:https://github.com/cryptovoxels/maps

为cryptovoxels的预览小地图和全景图, 提供切片.
map-server-production.js为服务脚本
里面路由包括:
1. /
返回preview.html, 地图html页面
2. parcel
根据parcel的三维位置中的xy, 转化成球面墨卡托位置的bbox, 返回bbox的tile.
为什么要用墨卡托投影呢? 可能作者想最终做成非常大的地图.

那么如何渲染tile的呢?请看map-template.xml.
map-template.xml为服务器配置脚本, 其中include了文件db-connection.xml, 这说明, 地图数据源为数据库, 很可能使用的是PostGis.
map-template.xml中包含四个Layer, 分别是:
1. properties
其sql是, select * from properties where visible = true
2. streets
其sql是, select * from streets where visible = true
3. property-names
其sql是, select * from properties where name is not null
4. suburb-names
其sql是, select * from suburbs

参照Layer的显示样式, 再结合cryptovoxels网站平面全景图, 猜测:
suburbs是不同的城区, streets是不同街道, property-names是城区名称, properties是街道名称
