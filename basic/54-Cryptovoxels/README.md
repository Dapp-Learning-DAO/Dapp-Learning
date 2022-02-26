## cryptovoxels 网站功能(TO DELETE))

1. 首页或 Explore
   是简介和 cryptovoxels 的入口, 点击 play 进入 cryptovoxels
2. Map
   cryptovoxels 的平面全景图
3. Buy Parcels
   地块购买
4. marketplace
   市场, 其中商品包括, 玩家制作的各种 3D NFT, 地块
5. Support
   论坛
6. wiki 地址: <https://wiki.cryptovoxels.com/>

## cryptovoxels 的主要元素

### parcel

parcel 是 cryptovoxels 的主体结构, parcel 被官方创造出来, 定期在 opensea 进行拍卖. parcel 是含有权限控制的空间, 可设置能私人访问, 或特定玩家访问.
与之对应的是 Spaces, Spaces 是个虚拟的空间, 它不在 cryptovoxels 宇宙中.
除了权限控制, 拥有 parcel 才能使用 The Grid 脚本系统.

### Feature

parcel 里包含 feature, 比如:
button, nft-image, video 等.

### Player

类似 Roblox 中的 Character

## cryptovoxels 的 vox 脚本系统

主要为 Feature 提供功能支持, 比如支持 button 点击的行为等.

### vox 的脚本

类似 roblox 的 client script, 运行在本地.参考https://wiki.cryptovoxels.com/en/Scripting/Scripting.

### The Grid

类似 roblox 的 server script, 运行在服务器, 参考https://wiki.cryptovoxels.com/en/Scripting/TheGrid.

## cryptovoxels 代码库的分析

cryptovoxels 代码库和实际并不相符, 但是通过分析其代码库, 可以看到他大概的技术链构成.

### construct: https://github.com/cryptovoxels/construct

cryptovoxels 的展示模板

```bash
npm install
npm start
```

报错 TS7016, 将 tsconfig.json 中的"noImplicitAny"改为 false.
再次运行 npm start, 会看到一个渲染出来最基本的场景和块, 可以使用 wasd 建控制方向.

### contract(https://github.com/cryptovoxels/contracts)

区块链合约, 其中包括

1. Parcel
   Parcel 是 ERC721Token, 可以 mint, buy, burn, 可以设置 Price 和 contentURI.

2. Name
   ERC721Token, 应该是支持玩家对 Parcel 或 Player 命名的

3. Color
   ERC20, Parcel 的颜色

### parcel-market-subgraph

监听 cryptovoxels 的 opensea 市场交易事件

### maps: https://github.com/cryptovoxels/maps

为 cryptovoxels 的预览小地图和全景图, 提供切片.
map-server-production.js 为服务脚本
里面路由包括:

1. /  
   返回 preview.html, 地图 html 页面
2. parcel  
   根据 parcel 的三维位置中的 xy, 转化成球面墨卡托位置的 bbox, 返回 bbox 的 tile.
   为什么要用墨卡托投影呢? 可能作者想最终做成非常大的地图.

那么如何渲染 tile 的呢?请看 map-template.xml.
map-template.xml 为服务器配置脚本, 其中 include 了文件 db-connection.xml, 这说明, 地图数据源为数据库, 很可能使用的是 PostGis.
map-template.xml 中包含四个 Layer, 分别是:

1. properties  
   其 sql 是, select \* from properties where visible = true
2. streets  
   其 sql 是, select \* from streets where visible = true
3. property-names  
   其 sql 是, select \* from properties where name is not null
4. suburb-names  
   其 sql 是, select \* from suburbs

参照 Layer 的显示样式, 再结合 cryptovoxels 网站平面全景图, 猜测:  
suburbs 是不同的城区, streets 是不同街道, property-names 是城区名称, properties 是街道名称
