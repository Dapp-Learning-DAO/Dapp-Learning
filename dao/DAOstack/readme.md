# 什么是DAOstack

DAOstack是一套软件栈，它用于构建与运行DAOs(Decentralized Autonomous Organizations)，即去中心化自治组织。

所谓的去中心化自治组织，就是它们的运作，是建立在P2P软件基础上，并遵循无层级的决策。这些决策往往是针对大家共同拥有的资源，比如资金。DAOstack做的这些工作，正是其相信DAOs的结构，将改变我们的世界，因为它会让人与人之间的协作，更加容易、直接，也更容易规模化。

DAOstack瞄准了构建DAOs的全流程，因此在它的软件栈中包括了从P2P决策模块，到全功能的用户接口的所有构件。如果通过该栈的UI，甚至不需要太多的技术知识储备，就可以构建用户所需要的DAO。而且DAOstack还包含了将这些自治组织链接在一起的工具，因此随着该DAOs网络的成长，所有基于DAOstack的各DAO也将会随着拥有更强的组织治理能力。

# DAOstack架构

## 综述

下面中DAOstack的架构图：

![1645971935048](.\images\DAOstack架构.png)

从下往上看，架构图中构件分别是：

1. Infra，它是完成通用去中心化决策的基础组件；它是一组以太坊智能合约库，包括投票机（voting machines）和声誉系统（Reputation system）。
2. Arc，它是以太坊智能合约，用于注册DAO的构建模块和标准组件等，以实现我们想要类型的DAO；
3. Subgraph；它是基于TheGraph协议实现的，用来查询DAOs状态与信息的高速缓存（Caching Layer）。
4. Arc.js，它是一个Javascript的库，方便Dapps来访问Arc里的智能合约。
5. Dapps，它就是各DAO呈现给用户具体的去中心化应用，比如去中心化选举系统等。
6. DAOs，这其实已不是DAOstack的组成部分，而代表着遵行DAOstack机制运行着的一个个DAO。

## 智能合约（Smart Contracts）

### Infra

Infra是一个用Solidity编写的智能合约库，它包含了DAOstack协议的2个主要组件：

1. 投票机（Voting Machines）：它是一个通用型合约（所有的DAO都可以调用），将用于处理投票事务。每一个投票机都要遵循它自己预先设定的决策规则；根据DAOstack的共识协议，决策可以依据简单的绝大多数同意通过规则，也可以更加复杂的逻辑。
2. 投票权限管理（Voting Rights Management）：该系统就是一个智能合约，它用于确定投票权限是如何分布的；该系统会记录每个投票参与方的投票权限大小；运行在DAOstack的DAOs，会用声誉（reputation）来计量参与方的投票权限；这“声誉”就是数字，将跟随参与方参与提案投票的成功与失败，而增长或减少。

### Arc

Arc也是一个智能合约库，它用于构建DAOs。它会调用Infra的投票机和投票权限管理系统，以向用户提供去中心化的自治组织（DAOs）。除了调用Infra合约，用Arc构建的DAOs还会用到以下的基础合约组件：

1. Avatar：它是DAO的账户，这个合约代表了DAO的地址，并掌管着它的资产。

2. Token：DAO原生的ERC20代币，DAO根据协议可以铸币，并向它的成员发币。

3. Plugins：插件，它们将为DAOs提供丰富的功能，可以各种方式扩展DAO的能力，例如：在Uniswap上做交易，授予投票参与方声誉，升级DAO的合约，注册新的插件和限制等等。

4. 全局限制（Global Constraints）：通过插件用于规范一个DAO的行为，当DAO执行来自调用者的指令时，控制器（Controller）会检查相应的限制，看看该调用是会违反，如有违反，将阻止这些调用的执行；这些限制将限定一个提案要花费多少，一个用户可以拥有多少声誉等等。

5. 控制器（Controller）：它用于完成DAO的访问控制；它将管理谁可以访问DAO的哪个功能，也是DAO的限制控制的落地组件。

   Arc V1中提出了通用型合约（uinversal contracts）的概念：合约只被部署一次，但可以被所有的DAOs使用或访问。这样可以节省gas费和部署的费用。插件和限制都可以是此类通用型合约。

## 子图（Subgraph）

DAOstack目前基于 The Graph 协议，实现了一个子图（subgraph），用于索引区块链的事件（events），使得应用程序通过GraphQL的查询语句，可以访问这些events的信息。我们可以从[这里](https://thegraph.com/docs/en)获取更多关于The Graph的文档，也可以在[Graph Explorer](https://thegraph.com/hosted-service/subgraph/daostack/master)中找到我们定制的子图。

## Arc.js（Javascript库）

Arc.js是一个Javascript的库，将方便我们访问Arc中的智能合约。它提供了方法，来与以下构件交互：

1. Arc智能合约：投票，创建提案，投注与执行提案等等。

2. DAOstack子图：查询DAO中的数据。

   通过Arc.js，Javascript/Typescript的开发者可能编写脚本和程序，来与已存在的DAOs进行交互，向DAOs发布提案，为提案投票或投注，执行决策结果，管理用户的声誉等，这些对于想要获得基于区块链去中心治理各种好处的开发者而言，特别有帮助，因为这样不用直接面对智能合约的开发语言了。

## 去中心化应用（Dapps）

去中心化应用（dapps），其实也是典型的Web应用程序，但它与传统Web应用程序最大的不同，是建立在去中心化的框架（例如区块链）上。DAOstack目前自己创建并维护了两个dapps：Common和Alchemy。

Alchemy是建立在DAOstack的全栈上：Arc.js，DAOstack的子图，Arc和Infra。该应用将给用户部署新的DAOs，查阅存在的DAOs，并与已存在的DAOs交互，比如投票，创建提案等等，带来更加方便的途径。

# 全息共识

全息共识这个词主要意味着，识别一组人的共同意愿，不需要组织里绝大多数人都要参与共识这种活动。用另外一句话来讲，全息共识是指代那些决策的技术，通过这些技术可以准确地代表组织整体的意见，但是又不需要组织中的个体都来参与投票或决策。这与传统区块链PoW等共识机制，要求所有有资格的人都要参与，是有本质不同的。

## 规模化问题

全息共识是DAOstack去中心化治理实现的关键点，因为它解决了去中心化系统中规模化的问题：它让决议时，很好地在代表与大量的成员之间，做到了很好的平衡。我们都知道，一般治理系统中，如果决策更快，则意味着想要精确地代表系统中代表的意愿，就更加困难。

我们[这里](https://medium.com/daostack/holographic-consensus-part-1-116a73ba1e1c)和[这里](https://medium.com/daostack/on-the-utility-of-the-gen-token-eb4f341d770e)来更多地了解这个规模化问题，以及全息共识是如何应对这个问题的。

## 共识协议

所谓的共识协议，这里是指DAOstack实现的所有技术，这些技术为DAOs实现了一个特殊的算法，基于这个算法或协议，再实现了DAOs中的投票机（Voting Machine）

这个共识协议，是全息共识基于智能合约的一个实现，它为运行在Infra层的投票机所遵循。

### 概览

所有的提案是要提交到DAO。一旦提交，这些提案就成为了常规提案（regular proposals）。常规提案要想成功通过，就要获得绝大多数（>50%）的投票。这个票数往往很难达到。

而遵循共识协议的每个提案，则还会有一个预测市场与之相关联。在该预测市场中使用GEN代币。DAO的成员，或一般公众，可以使用GEN来对这些提案进行投注，他们可以押提案通过，也可以押提案不通过。押注对的，将获得奖励。缺省情况下，DAO也会投注GEN（它被称作DAOstake），并押提案不通过。DAO这样做，其实是提供经济激励，让对提案是好的预测者，有积极性来预测该提案会通过。

当提案押注通过的GEN总数达到一定的门槛，就会被提速。也就是这类提案，只要相对多数（赞成票数多于反对票数）就可以通过。当然，这个条件相对需要绝对大多数来讲，就更容易达到。

总的来讲，这让DAO可以更快地通过提案，并拥有高可信性，同时还不需要众多的投票人参与。因为预测者都被激励着来确保这些提案拥有较高的代表性。

### 协议状态

一个打开着的提案（也就是还没有被决策的提案），可以是以下状态中的一种：

1. Queued：所有的提案一提交，缺省就会进入queued状态，并会有一注押反对的（由DAO押的）；该投注的数额由minimumDaoBounty参数设置，此种状态下的提案，在有绝对大数的投票，才能获得最终决策（根据>50%的票数属于哪方，而确定该提案是通过，还是不通过）。
2. Pre-boosted：在满足S~u~/S~d~ > C^b^时，提案就会从Queued状态变迁到Pre-boosted状态；其中S~u~是支持提案的投注数，而S~d~则是反对提案的投注数，C是一个常量，而b是当前已提速的提案数量；在这个状态下，提案将对所有成员打开，开始接收投注；而当反对的投注数增长较快，并且不满足上述的不等式时，该提案将回退到Queued状态。
3. Boosted：当提案持续待在Pre-boosted状态一段时间（这个时间由preBoostedPeriodLimit参数来确定），就会进入这个boosted状态；在这种状态下的提案，则只要求相对多数就可以通过（例如赞成票多于反对票）；在这种状态下，该提案将打开大家投票通道，而关闭投注通道；因此，一旦提案进入到了Boosted状态，就再也回不到Queued或Pre-boosted状态；这种状态会持续boostedVotedPeriodLimit参数所设定的时间。
4. QuietEndingPeriod：这种状态代表提案被决策的最后阶段；在这个阶段里，提案可能由通过变成不通过，也可能由不通过变成通过；只有当提案保持通过或不通过情形超过由quietEndingPeriod参数确定时间时，提案才处于最终被决策（采纳或放弃）；这个状态主要用来规避最后时刻投票没有被统计到的情形。

### 投注与奖励

以下是一个提案可能结果：

1. 提案在队列中，在规定的时间内，未能获得任何决议；这种情况下，所有的押注将退回给相应的投注人。

2. 该提交被采纳或被否决；投注失败者，将失去他们的押注，而胜出者将收回他们的押注，并按比例分享失败者的押注；反对者的押注中还包括了DAOstake，只要DAO有GEN，每次提案提交，它会自动投注这注反对押注。

   要注意的是，对于一个给出的提案，来自同一个地址的投注人可以进行多次投注。但是后面的投注要与前面的投注一致。也就是讲如果你开始投注了赞成，那在后面的投注中也只能投赞成；不能投注两方。

### 参数

下面是关于该共识协议中用到若干参数的解释：

1. Address：这些参数存放的以太坊地址（不是该协议自己的地址）；例如：*0x332b8c9734b4097de50f302f7d9f273ffdb45b84*。
2. Activation Time：提案第一次提交的日期与时间（遵循 [Unix time](https://en.wikipedia.org/wiki/Unix_time)格式）；例如：*12:00 PM UTC*   *on July 14th, 2019 (active)*。
3. Boosted Vote Period Limit：提案处于boosted状态的时间跨度；例如：*7 days (604800 seconds)*。
4. DAO Bounty Constant：它是一个常量，被处于boosted状态提案的平均反对押注数额所乘，用于计算出DAO自动投注的反对投注应该是多少；例如：*10*。
5. Proposal Reputation Reward：对通过的提案进行奖励的数额；这个数额代表着投票的能力；例如：*500 REP*
6. Minimum DAO Bounty：指一个DAO针对每个提案最少要押注GEN的数量；这个押注是押提案不通过；例如：*250 GEN*
7. Pre-Boosted Vote Period Limit：是指一个提案保持某个可信分数（ upstake / downstake > boosting threshold）的时间长度；只有达到这个时间，才可能从Pre-Boosted状态进入Boosted状态。例如：*1 day (86400 seconds)*
8. Queued Vote Period Limit：这个参数用于设置非boosted态的提案（pre-boosted态或regular queue态），开放用于投票的时间量；例如：*45 days (3888000 seconds)* 
9. Queued Vote Required：它用于设置所有声誉（投票能力）在yes或no中的占比；该占比用来裁决一个non-boosted的提案是通过，还是被否决；例如：*50%* 
10. Quiet Ending Period：它是一个时间跨度；它是因投票存在潜在结果而需要的；这个时间是要求维持同样的结果一定时间，以确认该结果可以是正式的结果；例如：*2 days (172800 seconds)*
11. Threshold Constant：该参数控制着进入boosted状态的速度，因为它设定了达到可信分数的门槛；而门槛将随着当前处于boosted状态提案数量的上升，而变得更高（threshold = threshold constant ^ 当前boosted提案数量）；例如：*1.2*
12. Voters Reputation Loss：它用来设置一个投票人投票能力如果在非boosted提案投票中失败，将损失的投票能力占比；假如你有100个声誉，而这个参数被设置为4%，就意味着你将因为投票失败，而损失4个声誉。

# 参考

- [https://daostack.io/](https://daostack.io/)
- [https://github.com/daostack](https://github.com/daostack)

