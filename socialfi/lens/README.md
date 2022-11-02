# 介绍

Lens是面向社交的基础设施。使用Lens提交的协议，用户可以：

- 创建Profile
- 关注Profile
- 发表内容
- 转发内容

此外，用户还可以参与治理，自己定制相关的逻辑

# 概念

- Profile NFT: 每一个Profile都用一个NFT来表示。
- Follow NFT：每一个用户关注Profile，这种关注关系用follow NFT来表示
- Publications：用户发表的内容，它们自身的内容用contentURI表示，通常存储在分布式存储上。包括三种：
    - post：发布帖子。这是最基本的Publications。它
    - comment：用户对publications的评论。
    - mirror：类似retweet。

- Modules：一个模块是一个合约，它类似于勾子，决定了特定行为的定制化逻辑。
    - Follow Module：Profile可以指定别人follow自己时的逻辑，比如支付特定的代币才可以关注自己等等
    - Reference Module：Profile可以指定别人引用自己创作时的逻辑，比如支付多少钱才可以引用等。

# 应用
目前的一些应用包括：
- LensFrens：官网的lens推特
- Lenster：去中心化的推特
- Sepena：基于lens的搜索引擎，可以根据关键字搜索lenster等网站上的内容
- MadFinance：一个reference 模块，可以根据流支付协议来给创作者资助
- 0xRig：一个基于lens的通信，无需号码，直接给对方拨打电话
- lensCollectionAuctions：一个collect模块，通过拍卖的方式获取价格
- AuraReputation：一个reference模块，结合chainlink提供的用户信誉信息，只允许有足够信誉的用户引用自己的内容。


# 参考
[lens源码](https://github.com/lens-protocol/core)
[lens文档](https://docs.lens.xyz/docs/deploying-the-protocol)
[lens介绍](https://www.youtube.com/watch?v=2ex8Ns4MzZk)
