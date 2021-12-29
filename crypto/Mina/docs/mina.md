# Mina

## 什么是Mina?
Mina 是第一个支持精简区块链概念的加密货币协议。当前的加密货币区块链存储了数百GB的数据, 同时随着时间的推移，区块链的大小会不断增长。然而，无论使用量增长多少，Mina区块链可以始终保持同样的大小 - 大概 22kb。这意味着参与者可以快速同步和验证区块网络。

支持Mina实现精简区块的关键是zk-SNARKs(一种精简的加密证明)。每次 Mina 节点生成一个新的区块时，它同样会生成一个SNARK证明，用于验证该区块是否有效。然后所有节点可以存储这个占比很小的SNARK证明，而不是存储整个区块链数据。由于不再担心区块的大小，Mina 协议支持区块链在扩展时同样保持着去中心化特性。

默认情况下，Mina 节点是非常精简的, 它们并不需要存储关于网络、区块、交易相关的历史信息。但对于某些情况下，我们需要存储这些历史信息，这时我们可以通过运行 Mina 档案节点来实现它。

Mina 档案节点是在普通的Mina节点守护进程上，连接一个运行着的档案进程。Mina守护进程会定时持续发送区块链数据给档案进程，档案进程再将此数据保存在 [Postgres](https://www.postgresql.org/) 数据库内。

因此，运行一个档案节点会需要您了解如何管理Postgres数据库实例。 若是想了解如何设置Postgres数据库，运行档案节点，可以查看[如何运行一个档案节点](https://docs.minaprotocol.com/en/advanced/archive-node)。

对于如何开始搭建Mina, 生成密钥对，连接至主区块网络进行付款等具体操作命令，可以查看以下链接:

* [安装搭建Mina](https://docs.minaprotocol.com/en/getting-started)
* [如何生成密钥对](https://docs.minaprotocol.com/en/using-mina/keypair)
* [连接至主区块网络](https://docs.minaprotocol.com/en/using-mina/connecting)
* [使用Mina进行交易付款](https://docs.minaprotocol.com/en/using-mina/send-payment)
* [赌注Mina参与共识](https://docs.minaprotocol.com/en/using-mina/staking)
* [命令行界面](https://docs.minaprotocol.com/en/using-mina/cli-reference)

接下来，将从Mina协议的架构简要介绍，再到协议的具体相关实现，最后讲述基于Mina链上的Snapps概念。

## Mina协议架构

Mina协议架构中包含几个关键的模块, 分别为区块(Block), 区块生产者(Block Producer), 共识机制(Consensus), Snark工作者(Snark Workers), 扫描状态(Scan State), 和代币(Token)。 这些模块共同协作支持整个协议的正常运行。

### 区块(Block)
区块链中的每个区块包含了许多交易信息和共识信息，共同组合成当前状态的区块链。Mina的区块中还包含了一个证明(zkSnark proof), 以证明当前区块链的状态是有效的。

当一个Mina节点接收到来自于另一个节点(Peer)的新区块时，这个区块会首先被验证，然后再更新当前区块状态，最后添加至这个节点的区块本地存储内, 又名过渡边界结构内(Transition Frontier)。如果基于共识规则，此区块导致当前区块链的长度增加，那么这个节点的链上数据将被更新，区块边界指标将上移，保持着区块边界结构内始终只包含k个区块。

目前，每个Mina区块由以下部分组成：
* 协议状态
    
    协议状态由先前的协议状态哈希和包含以下内容的数据结构组成：

    * 创世状态哈希(Genesis State Hash): 创世状态哈希是创世协议状态的协议状态哈希。
    * 区块链状态: 包括 1) 分阶段的账本哈希(Staged ledger hash), 2) Snarked 账本哈希(Snarked ledger hash), 3) Snarked 下一个可用令牌(Snarked next available token), 4) 创世账本哈希, 5) 时间戳。
    * 共识状态: 包括 1) 区块链长度, 2) 纪元计数(Epoch count), 3) 最小窗口密度, 4) 子窗口密度, 5) 最后一个 VRF 输出, 6) 总货币, 7) 当前全局插槽, 8) 自创世以来的全球插槽, 9) 质押纪元数据, 10) 下一个纪元数据, 11) 在同一个检查点窗口中是否有祖先, 12) 区块质押赢家, 13) 区块创建者, 14) 币库接收者, 15) 增压币库。
    * 共识常数: 参考 [共识参数](https://docs.minaprotocol.com/en/architecture/whats-in-a-block#consensus_state) 查看具体的常数列表。

    每个区块都包含前一个区块的协议状态哈希，这样区块即可链接在一起形成一个不可变的区块链。协议状态哈希是根据前一个状态的哈希列表和主体进行再次哈希而确定的，同时它是作为每个区块的唯一标识符。
* 协议状态证明

    协议状态证明是证明区块生产者生成的新协议状态有效的区块链证明。由于使用了递归 SNARK，这个协议状态证明证明了整个链的历史是有效的。
* 分阶段账本差异

    当区块生产者赢得一个槽(Slot)来生产一个区块时，他们会从交易列表池和snark池中选择所需的交易列表和snark。他们会产生一个待定的区块链下一状态，其中包括创建分阶段分类账的差异。这些差异包含：
    * 区块中包含的交易
    * 添加了由snark 工作人员为先前交易生成的 SNARK 证明列表
    * 待定的币库(coinbase)

    分阶段账本可以被视为一个待处理的账户数据库，其中的交易列表（比如支付、币和证明费用支付）暂无SNARK证明。换言之，它包括账户状态(账本)和一个没有SNARK证明的交易队列, 这个交易队列又名为扫描状态。
* Delta 过渡链证明

    通常，在网络中同步新产生的区块时，基于会出现不良好的网络条件的考虑，Mina会允许一定的网络延迟。而Delta过渡链证明证明该块是在分配的时间段内产生的。
* 当前协议版本
* 提议的协议版本

以下举例一个具体的块实例:

    {
        "external_transition": {
            "protocol_state": {
            "previous_state_hash": "3NLKJLNbD7rBAbGdjZz3tfNBPYxUJJaLmwCP9jMKR65KSz4RKV6b",
            "body": {
                "genesis_state_hash": "3NLxYrjb7zmHdoFgBrubCN8ijM8v7eT8kvLiPLc9DHt3M8XrDDEG",
                "blockchain_state": {
                "staged_ledger_hash": {
                    "non_snark": {
                    "ledger_hash": "jxV4SS44wHUVrGEucCsfxLisZyUC5QddsiokGH3kz5xm2hJWZ25",
                    "aux_hash": "UmosfM82dH5xzqdckXgA1JoAvJ5tLxch2wsty4sXmiEPKnPTPq",
                    "pending_coinbase_aux": "WLo8mDN6oBUTSyBkFCy7Fky7Na5fN4R6oGq4HMf3YoHCAj4cwY"
                    },
                    "pending_coinbase_hash": "2mze7iXKwA9JAqVDC1MVvgWfJDgvbgSexKtuShdkgqMfv1tjATQQ"
                },
                "snarked_ledger_hash": "jx9171AbMApHNG1guAcKct1E6nyUFweA7M4ZPCjBZpgNNrE21Nj",
                "genesis_ledger_hash": "jxX6VJ84HaafrKozFRA4qjnni4aPXqXC2H5vQLKSryNpKTXuz1R",
                "snarked_next_available_token": "2",
                "timestamp": "1611691710000"
                },
                "consensus_state": {
                "blockchain_length": "3852",
                "epoch_count": "1",
                "min_window_density": "1",
                "sub_window_densities": [
                    "3","1","3","1","4","2","1","2","2","4","5"
                ],
                "last_vrf_output": "g_1vrXSXLhvn1e4Ap1Ey5e8yh3PFMJT0vZyhZLlTBAA=",
                "total_currency": "167255800000001000",
                "curr_global_slot": {
                    "slot_number": "12978",
                    "slots_per_epoch": "7140"
                },
                "global_slot_since_genesis": "12978",
                "staking_epoch_data": {
                    "ledger": {
                    "hash": "jxX6VJ84HaafrKozFRA4qjnni4aPXqXC2H5vQLKSryNpKTXuz1R",
                    "total_currency": "165950000000001000"
                    },
                    "seed": "2vb1Mjvydod6sEwn7qpbejKCfRqugMgyG3MHXXRKcAkwQLRs9fj8",
                    "start_checkpoint": "3NK2tkzqqK5spR2sZ7tujjqPksL45M3UUrcA4WhCkeiPtnugyE2x",
                    "lock_checkpoint": "3NK5G8Xqn1Prh3XoTyZ2tqntJC6X2nVwruv5mEJCL3GaTk7jKUNo",
                    "epoch_length": "1769"
                },
                "next_epoch_data": {
                    "ledger": {
                    "hash": "jx7XXjRfJj2mGXmiHQmpm6ZgTxz14udpugyFtw4DefJFpie7apN",
                    "total_currency": "166537000000001000"
                    },
                    "seed": "2vavBR2GfJWvWkpC7yGJQFnts18nHaFjdVEr84r1Y9DQXvnJRhmd",
                    "start_checkpoint": "3NLdAqxtBRYxYbCWMXxGu6j1hGDrpQwGkBDF9QvGxmtpziXQDADu",
                    "lock_checkpoint": "3NL4Eis1pS1yrPdfCbiJcpCCYsHuXY3ZgEzHojPnFWfMK9gKmhZh",
                    "epoch_length": "2084"
                },
                "has_ancestor_in_same_checkpoint_window": true,
                "block_stake_winner": "B62qpBrUYW8SHcKTFWLbHKD7d3FqYFvGRBaWRLQCgsr3V9pwsPSd7Ms",
                "block_creator": "B62qpBrUYW8SHcKTFWLbHKD7d3FqYFvGRBaWRLQCgsr3V9pwsPSd7Ms",
                "coinbase_receiver": "B62qpBrUYW8SHcKTFWLbHKD7d3FqYFvGRBaWRLQCgsr3V9pwsPSd7Ms",
                "supercharge_coinbase": true
                },
                "constants": {
                "k": "290",
                "slots_per_epoch": "7140",
                "slots_per_sub_window": "7",
                "delta": "0",
                "genesis_state_timestamp": "1609355670000"
                }
            }
            },
            "protocol_state_proof": "<opaque>",
            "staged_ledger_diff": "<opaque>",
            "delta_transition_chain_proof": "<opaque>",
            "current_protocol_version": "1.1.0",
            "proposed_protocol_version": "<None>"
        }
    }

### 区块生产者(Block Producer)
Mina中区块生产者的作用是达成共识并为区块链提供安全性。区块生产者负责创建新区块，其中包括在网络上广播的最新交易以及可用于证明当前区块链状态有效性的区块链证明。在 Mina，任何人都可能成为区块生产者。有无限数量的参与者有机会产生与所押资金成正比的区块。资金不会被锁定，也不会受到削减。作为抵押资金和生成所需的区块链证明的回报，
那些被创造和包含在当前有效区块链的区块将会获得奖励，奖励以币和交易费用的形式发放。

区块生产者需更新至区块链的最新状态后才可以成功产生新的区块。同时，他们也必须有足够的算力在规定的时间内计算出区块链SNARK证明，然后在可接受的延迟内连接到其他节点以广播新生成的区块。

#### 选择区块生产者的策略
在规定时间内生成一个区块的机会是由可验证随机函数(VRF) 决定的。你可以把它理解成类似抽彩票一样。每个区块生产者在每个区间(slot)内独立运行VRF函数，如果在某个区间运行的结果大于生产者的质押比例阈值，那他们就有机会在这个区间产出一个区块。

此过程是私密的，只有私钥持有者可以确定VRF的结果输出，因此只有他们知道何时他们可以产出一个区块。第三方也无法通过拒绝服务或有针对性的攻击对在某个区间内的指定区块生产者进行攻击，这一定程度上提高了安全性。从结果上来看，它同样意味着可以为同一个区间(slot)选择多个区块生产者。如果多个区块生产者为同一个区间均产出有效的区块，那么将会有一个短程的分叉，然后会由共识规则来选择最长的链以确定最终区块生成者。

关于质押分配，它是由 (当前纪元(epoch)数 - 2) 的最新区块上的snarked账本来确定的。因此在获取最新赢得的或委托的质押值时会存在一定的延迟。例如，如果当前纪元数为 10，那么质押分配将会由第8个纪元的最新区块上的snarked账本确定。

#### 如何生成一个区块
当一个区块生产者被选中来为一个区间(slot)生产一个区块时，通常会有以下步骤:
* 从节点的区块本地存储(区块过渡边界结构, Transition Frontier)内选择最佳的新增区块位置。
* 从交易池和snark池中选择所需的交易列表和snark工作量。任何交易都需要一定的snark工作量，因此区块生产者最少需购买能支付他们用于把区块添加到区块链上的snark费用。 
* 生成一个待定的区块链下一状态。这包含创建阶段性账本的差异(diff), 这些差异包含账户账本和扫描状态(尚未有证明proof的交易队列). 这个diff用于在当前阶段性账本的基础上生成一个新的区块链的下一个状态。
* 创建一个区块链证明(snark proof)以验证区块链的新状态是有效的。同时这个证明还递归验证了之前的协议状态证明。
* 如果在网络共识参数定义的可接受的网络延迟内收到新区块，则创建一个增量转换链证明，证明该块的有效性。
* 在本地确定更新这个新区块状态，同时添加到节点的区块本地存储内(区块过度边界结构, Transition Frontier)。
* 想其他节点(peer)广播这个新区块(会被视为外部转换)。

## 共识机制(Consensus)
共识指的是网络中参与者确定什么信息会被保留在区块链中的过程。在像区块链这样的系统中，使用新信息扩展区块链的责任分布在整个网络的参与节点之间。所有的节点不能被默认假设为"诚实"节点，因此那些真正的"诚实"节点需要合作来确定哪些信息是需要被保存在链上的。目前存在着很多方法来取得这种分布式的共识，我们把这些方法统称为共识机制。Mina在代码层面上抽象出共识机制模块，用单一接口来取得与其他模块的互动。同样，这个接口允许有不同的具体实现。最后实现将共识机制作为基础模块支撑整个协议的目的。

### 质押证明(Proof of Stake)
目前Mina的共识机制是基于质押证明Proof of Stake来实现的。具体的实现是基于Ouroboros Praos协议的某个版本进行拓展和修改，以支持Mina的精简区块链特性。有关 Ouroboros 协议的完整说明，请参阅原始 Ouroboros 论文： [Ouroboros](https://eprint.iacr.org/2016/889.pdf) 和 [Praos](https://eprint.iacr.org/2017/573.pdf)。

在 Ouroboros 中，节点需要在上一个纪元开始时实现/保留分类帐，以便进行 VRF 评估。这是因为仅仅有 VRF 输出不足以知道一个区块是"诚实"提出的。为了确定区块是否由提议该区块的节点所赢得，VRF 输出必须低于提议者的质押比例阈值。但是在一个精简的区块链上, 如Mina, 保存过去的账本并不是一件容易的事。与其他链不同，Mina节点不能随意请求链上的历史片段，来重新组合成他们感兴趣的信息。这意味着如果不采取一定的优化方式，那么将会需要3份的全账本拷贝，同时需要等待2个纪元的时间才可访问链上数据。显然，这是不可行的。

默认情况下，在Ouroboros中，每个节点在收到新区块时都需要验证区块提议者是否赢得了该区块，这意味着他们必须查看评估VRF的公钥的余额。然而在Mina中，VRF评估的准确性可以由snark计算得出，因此其他节点只需验证snark即可确定区块是否由提议者赢得。由于提议者可通过snark自我证明，那就可以大大缩小链上关于纪元账本的存储信息。只需存储指定的账户和相关的merkle路径。另外, Ouroboros需要2个纪元的时间来最终确定交易，那对于Mina节点可以等待交易最终确定后再确定snark, 这进一步缩小了所需的存储空间。最终这个snark证明将会证明: 1) 对于指定的公钥，VRF评估是准确的, 2) 纪元账本上的公钥账户，其余额创建的 VRF 阈值大于VRF 输出(使用默克尔路径从账户中证明纪元分类账的默克尔根)。(note: 这并没有立即解决提议者节点需要在线足够长的时间才能存储这些必要信息的问题，但它开辟了提议者获取该信息的其他途径，主要包括提议者可以请求一个账户记录和默克尔路径，证明它存在于指定的纪元账本中。)

### 数据和钩子
共识机制影响着协议的许多方面。我们将共识机制的规定分为两部分：数据（可用的数据结构和可用的交互）和钩子（基于共识机制上的协议调用的特定顶层钩子）。这些基于共识机制的数据结构对外部保持抽象，然后由钩子消费实现具体行为。

数据主要包括:
* Local_state
    
    Local_state是只存储在机器本地的共识相关状态。它提供了一个达成共识的地方，以在协议状态的终结点上跟踪有关本地节点的一些信息。更多具体使用可以参考frontier_root_transition钩子
* Consensus_transition_data

    Consensus_transition_data是包含在Snark_transition结构内. 它帮助提供额外信息以验证一个转换是否有效。与Consensus_state不同， Consensus_transition_data中的信息仅由创建转换的节点使用，其他节点不可用。
* Consensus_state

    Consensus_state包含在Protocol_state协议中。它为共识机制提供了一个存储信息的地方，这些信息在协议的每个状态下都可用，并且可以在 snark 中得到证明。由于它包含在Protocol_state中，因此网络上的其他节点可以检查此信息。

钩子Hooks主要包括:
* generate_transition()

    该generate_transition钩子完全生成新的协议状态和共识转换数据，以此作为链上先前协议状态的扩展。该hook将会获得新的区块链状态，新的待引入的交易列表以及相关提议数据。该钩子主要由提议者调用来获取转换的相关数据。提议者应该与next_proposal钩子交互以确定何时应该调用此钩子。
* next_proposal()

    next_proposal钩子可用于告知协议何时可以生产和提议下个转换。它返回一个具体的可提议下一个转换的时间，或者告知下一个时间点再次尝试调用该钩子以获取具体时间点。这将给共识机制更大的灵活度以及根据协议的其他信息进行更好的提案调度。
* next_state_checked()

    该next_state_checked钩子返回一个检查计算，其计算/制约了给予其前任的过渡blockchain序列中的下一个共识状态。该钩子包含在构成区块链 snark 约束系统的检查计算中。因此，这是对共识状态执行验证的主要功能。
* select()

    select钩子会从共识机制的角度选择更为何时的状态。这个钩子主要负责在多条链中哪条链应被保留，被调用后会返回是否保留当前状态链，或选取新状态链，它在共识达成的过程中扮演了重要的角色。
* received_at_valid_time()

    该received_at_valid_time钩子用于表明一个给定的共识状态在给定时间内是否有效。每次网络接收到新的转换，协议都应该调用此钩子以确定有效性。
* frontier_root_transition()

    当状态转换最终确定时，协议应当调用此钩子以更新本地状态。
* should_bootstrap()

    should_bootstrap钩子通知协议是否需要在收到状态转换时启动节点引导程序，将节点更新至最新的区块链状态。此钩子应在每次收到状态转换和初始验证成功后被调用。

## Snark工作者(Snark Workers)
大多数区块链协议只有一个主要的节点操作员群体(通常成为矿工、验证器或区块生产者), Mina会有另外一个群体 - Snark 工作者。Snark工作者对于Mina区块网络的健康至关重要，因为他们负责对网络中的交易进行 SNARK 证明或生成 SNARK 证明。通过生成这些证明，snark 工人有助于保持 Mina 区块链的简洁性。

Mina区别于其他区块链的特性是它的精简性。每个区块生产者在向网络提议新区块时，还必须包含一个针对该区块的zk-SNARK证明。这允许节点丢弃所有已完成的历史数据，只保留 SNARK。如果您不熟悉 Mina 协议，可以看下这个 [视频](https://www.youtube.com/watch?v=eWVGATxEB6M)。

然而，仅仅只有针对区块的Snark证明时不够的，区块内的交易列表同样需要计算其Snark证明，因为区块链Snark证明 没有对包含在区块中的交易的有效性做出任何声明。举个例子, 若当前区块头部的状态哈希为(a6f8792226xxx), 然后我们收到一个具有(0ffdcf284fxxx)的状态哈希的新块。这区块内部包含区块生产者选择包含在该区块中的所有交易以及相关的元数据，另外还会有用于验证声明的随附Snark：

“存在一个状态哈希为(0ffdcf284fxxx)的区块，它是在区块头部状态哈希为(a6f8792226xxx)的区块链上附加上的。”

我们会发现这个证明并没有说明任何区块内部的交易的有效性。因此存在第三方替换区块内交易数据再用原生的Snark证明广播的问题进而欺骗其他节点。因此，若我们不采取类似其他区块链携带内部完整的交易列表来验证交易的有效性，我们需要对内部的交易列表也进行Snark证明。


### Snark交易
Snark交易可以针对每个交易进行Snark证明，然后再组合起来。然而，计算Sanrk证明是耗费高算力的，如果对每个交易都进行Snark证明，那整体吞吐量会很低，同时出块时间也会猛增。此外，现实世界环境中的事务是异步进行的，因此很难预测何时执行下一项工作。

幸运的是，我们可以利用Snark的两个特性来解决上述问题：
1. Snark证明可以被合并 — 两个证明可以合并形成一个合并证明
2. Snark合并证明支持无序合并 - 无论合并顺序如何，Snark合并证明都是相同的

![](https://docs.minaprotocol.com/static/img/docs-images/Documents_FAQFork_Mobile%201.jpg)

这两个属性本质上支持了Snark证明的并行操作。如果可以合并证明，并且它们如何组合并不重要，那么可以并行生成 Snark证明。先完成的证明可以稍后与正在进行的证明结合。这可以被想象成一个二叉树，其中底行（叶子）由单独的交易证明组成，每个父行由各自的合并证明集组成。我们可以将这些一直组合到根，它代表通过应用所有事务执行的状态更新。

此外，因为Snark证明不相互依赖，我们可以利用并行性，这意味着任何人都可以完成这项工作。最终结果是分布式工作池是无权限的。任何拥有空闲计算能力的人都可以作为Snark工作者加入网络，观察需要被 snark 处理的事务，并贡献他们的计算量。当然，他们将因在snarketplace的工作而获得报酬。

### Snark市场
Snark工作的另一个关键点是：区块生产者使用他们的区块奖励从Snark工人那里购买snark工作量。

Mina协议没有参与对Snark工作量的定价，也没有对Snark工人生产Snark进行任何协议级别的奖励。激励纯粹是点对点的，并且在公共市场（又名Snark市场, Snarketplace）中动态建立。

你可能会问，为什么区块生产者需要购买Snarks？好问题 - 原因是区块内部的交易需要被Snark证明以验证当前区块链的状态是有效的。此外，为了使区块内不断增加的交易及时被验证，我们需要将Snark的验证速度与交易的添加速度对齐，以避免积累过多未验证的交易导致这些交易最终未被验证。

由于区块生产者通过将交易打包在一个区块中（通过交易费用和币交易）来获利，因此他们也有责任通过购买相同数量的已完成的Snarks来维持区块状态的有效性，而这也创造了对Snarks的需求。当然，区块生产者作为买方希望从Snark市场以最低价格购买Snark。另一方面，Snark工作者希望最大化他们的利润, 这两个角色充当市场的两侧，随着时间的推移，以市场价格为Snark市场建立均衡。

### 如何为Snark工作量定价
我们预计Snark市场中的价格遵循简单的供求规律动态平衡。虽然每个 snark 工作适用于不同的交易，但从更大的角度来看，snark 工作在很大程度上是一种商品（这意味着哪个 snark 工人生产商品并不重要——它会是一样的）。但是，存在一些细微差别，因此对定价策略进行一些说明可能会有所帮助：
* 如果市场价格为 X，那么以低于 X 的任何价格（例如 X - 1）出售Snark 工作可能是有效的，前提是它在扣除运营费用后是有利可图的。
* 区块生产者被激励从同一个Snark工作者那里购买更多单位的Snark工作量，因为这样会省部分转移交易的费用。
    
    * 基本上，区块生产者支付Snark工作者的方式是通过一种称为费用转移的特殊交易。区块生产者的动机是尽量减少费用转移的数量，因为每笔交易都是需要添加到区块中的哈希交易。因此，最好的情况是从同一个Snark 工人那里购买Snark工作量。
* 一些Snark工作量在其他工作之前完成会更重要，因为它会释放整个树的内存（有关更多详细信息，请参见上面的视频）。这是通过不同的工作选择方法实现的。目前支持的两种方法是顺序和随机。然而，这些都没有利用动态市场，这部分之后可以由Mina社区进行改善支持。

由于有关Snark和价格的所有数据都是公开的，因此有很多方法可以检查Snark市场的真实性。一个示例是使用 GraphQL API，其他选项包括使用 CLI，或可以自定义解决方案以跟踪Snark内存池中的Snark。

## 扫描状态
扫描状态是一种支持将交易Snark证明的生产从区块生产者中解耦到Sanrk工作者的数据结构。

由于区块生产者不再需要产生这些交易Snark，因此无论交易吞吐量如何，区块生产时间都可能保持不变。此外，扫描状态这个数据结构支持由多个竞争的Snark工作者并行生成和处理针对交易的Snark证明。

扫描状态由众多全二叉树组成，其中树中的每个节点都是分配给Snark工作者的任务。扫描状态周期性地从树的顶部返回一个证明，证明树底部所有交易的正确性。然后区块生产者会添加该证明，以证明链的当前状态和包含在Snarked账本内的所有交易是有效的。

因此，基于扫描状态能够调整以匹配所需的交易吞吐量，区块出块时间便可以在交易吞吐量大幅变化时仍可能保持不变。

### 添加交易进扫描状态
区块生产者会以扫描状态数据结构中的最大允许添加交易数来打包交易。在打包交易时，他们会获得相应的交易上的费用作为回报。每个被打包的交易都会自动转换成一个新任务，添加进扫描状态结构中。

对于添加的每个交易，区块生产者必须包含等量的已完成的Snarks，该Snarks对应于已存在于扫描状态中的一系列任务。这些已完成的Snarks，当被添加到扫描状态时，会创建新的合并Snark(对于根节点该Snark会直接返回作为结果)。

区块生产者不会自己执行这些Snark任务, 而是在Snark池中可用的投标中徐州呢从Snark工作者那里购买已完成的Snark任务。

### 扫描状态参数
扫描状态中结构中有两个参数比较关键，决定了扫描状态的结构和行为：
* transaction_capacity_log_2

    transaction_capacity_log_2参数定义了一个区块中可以包含的最大交易数：

        max_no_of_transactions = 2^{transaction_capacity_log_2}
* work_delay

    work_delay确保有足够的时间让Snark工作者完成Snark工作。如果没有已完成的Snark证明可用，则区块生产者不能包含任何交易。使用工作延迟，扫描状态下可能存在的最大树数定义为：

        max_number_of_trees = (transaction_capacity_log_2 + 1) * (work_delay + 1) + 1
    每个块可能包含的最大证明数定义为：

        max_number_of_proofs = 2^{transaction\_capacity_log_2 + 1} - 1
    这些扫描状态约束确保每个区块只能发出一个证明，并且在添加与其子项对应的证明后要更新的合并节点始终为空。

虽然最大交易数可能是固定的，但这可以动态调整以适应交易吞吐量。因此，扫描状态可以处理无限的交易吞吐量，尽管以增加交易证明的延迟为代价。

下面将举例说明:

假设一个扫描状态结构，其max_no_of_transactions为4, work_delay为1。这意味着可以完成的最大工作量为7, 最多7颗树。

在初始状态，扫描状态内部为空。
![](https://docs.minaprotocol.com/static/img/docs-images/scan-state/ZJXLozR.png)
区块 1：区块生产者打包了4个交易，添加到扫描状态结构中，记为B1. 这四个交易首先会添加到第一颗树的叶节点。
![](https://docs.minaprotocol.com/static/img/docs-images/scan-state/mY4MzW0.png)
区块 2：在第二个区块，区块生产者添加另外四笔交易(B2)。这些被添加到第二棵树，再次填充叶节点。由于存在1个区块的工作延迟，因此不需要证明。
![](https://docs.minaprotocol.com/static/img/docs-images/scan-state/jzYrmZf.png)
区块 3：在第三个区块，区块生产者B3向第三棵树添加了四笔交易，但必须包括第一棵树的四个证明。由于包含这些已完成的证明，因此生成了两个M3合并工作。
![](https://docs.minaprotocol.com/static/img/docs-images/scan-state/tECFm3I.png)
(注意: B或M表示基本或合并工作，数字表示添加到扫描状态结构的顺序。)

区块 4：对于第四个区块，区块生产者在第四棵树的叶节点添加另外四笔交易(B4)。同时它们也打包了4个针对第二个区块中的4个交易的相应的证明，以此，同样生成了2个M4合并工作。
![](https://docs.minaprotocol.com/static/img/docs-images/scan-state/76R2bpU.png)
(note: 任何待处理的工作（以橙色显示）都是由Snark工作者完成的工作。Snark工作者将完成的工作提交到Snark 池。可能存在多个Snark工作者完成证明工作，但区块生产者可能只会购买池中费用最低的证明。)

区块 5：在第5个区块中，同样打包了4个交易(B5)以填充第五棵树的叶节点，另外包含了6个证明（4个B3和2个M3）。M3合并作业完成后将生成对于第一颗树的最后一项任务(M5)。
![](https://docs.minaprotocol.com/static/img/docs-images/scan-state/QaqfbXG.png)
区块 6：在第六个区块中，同样打包了4个交易(B6)以填充第六棵树的叶节点，另外包含了6个证明（4个B4和2个M4）。产生了3个M6合并作业，其中第一个M6也是对于第二颗树的最后一项任务。
![](https://docs.minaprotocol.com/static/img/docs-images/scan-state/y6dM2FT.png)
区块 7：在第七个区块中，同样打包了4个交易(B7)以填充第七棵树的叶节点。根据扫描状态结构中的参数7棵数已达上限。同样包含了7个证明（4个B5和3个M5）。第一颗数的M5已完成并被发送出。另两个M5和第五棵数的B5共同生成了M7的合并工作。
![](https://docs.minaprotocol.com/static/img/docs-images/scan-state/RY8umxW.png)
从第一棵树发出的证明是与在区块1中添加的交易相对应的帐本证明。之后被删除第一颗树的内容以为后续交易创造空间。
![](https://docs.minaprotocol.com/static/img/docs-images/scan-state/hQvFVfp.png)
区块 8：在第八个区块中，区块生产者添加了两个交易(B8)和4个(B6)证明。这4个B6证明产生进一步的2个M8合并工作。注意，添加两个交易只需要四个证明。
![](https://docs.minaprotocol.com/static/img/docs-images/scan-state/A3o18oN.png)
(Note: 除了对于树的根证明, Snark工作通常被捆绑进包含2个workIds的工作包中。通常一个交易需要两个证明，这确保了交易和要购买的Snark工作量的一致性。)

区块 9：在第9个区块中，区块生产者添加了三个交易(B9)，会有总量6个的证明。三个用于之前未完成的M6工作。第二棵数的M6位于root在获取到证明后直接返回。第二棵树也随之重置为空，然后第三B9笔交易进入该空树，同时添加了针对B7的两个证明。
![](https://docs.minaprotocol.com/static/img/docs-images/scan-state/JGlawxh.png)
区块10：在块10，该块生产者增加了四笔交易，同时添加了7个证明。
![](https://docs.minaprotocol.com/static/img/docs-images/scan-state/kQASfTN.png)
第 11 块：在第11个块中，区块生产者添加了三个交易（B11）并按顺序完成了五个证明（B9，B9，M8，M8，M9）。此外，M9账本证明从第四棵树返回。
![](https://docs.minaprotocol.com/static/img/docs-images/scan-state/FaVTmWD.png)
(Note: 可以使用mina advanced snark-job-list命令来查看扫描状态结构的具体内容。)

### 与 Snark 池集成
新添加到扫描状态的作业是等待Snark工作者完成的作业。Snark 工作人员完成所需的Snark工作量，然后拍卖这些工作量。当一个节点接收到此Snark并且验证其有效后，会将此Snark添加进节点本地的Snark池。同样此Snark也会被同步到网络上的其他节点。(Note: 虽然多个Snark工人可以完成相同的工作，但Snark池中只包含最低的费用。)

当区块生产者将完成的证明包含在一个区块中以抵消他们添加的任何交易时，他们可以从Snark池中购买相应的工作。例如，继续上面的例子考虑下一个块 (12)。如果区块生产者想要添加三笔交易，包括购买币、用户付款和转账给Snark工作者，他们需要购买三个完成的Snark工作。这对应于6个证明:B9、B10s、M9和M10（来自第七棵树），因为每个Snark包括两个workIds。

在生成块期间，除了所需作业的最佳出价（在示例中分别为 0.025、0.165、0.1 和 0.5）之外，snark 池还可能包括已完成的工作。
![](https://docs.minaprotocol.com/static/img/docs-images/scan-state/fDBZog9.png)
区块生产者在选择交易之前会考虑可用工作的价格。区块生产者将添加的第一笔交易将是有币奖励的交易。如果交易费用不包括包含它们所需的Snark费用，则不会添加它们。区块生产者不会在利益获取的情况下购买Snark。

如果在所需的订单中没有可以购买的已完成的Snark 工作，则相应的交易将不会包含在一个区块中。这可能会导致一个空块，但对于无法添加任何交易的情况（包括币库交易），也不会对区块生产者有任何奖励。(Note: 当前的Snark池可通过GraphQL或 CLI[mina advanced snark-pool命令]查看。)

## 代币(Token)
代币为用户提供了一种创建和铸造（发行）他们自己的自定义代币的方式，而这需要一个特殊的代币账户。

在 Mina 协议中，用户可以创建自己的代币，这些代币可以通过使用特殊的代币账户来铸造（或创建）和发送。Mina CLI（命令行界面）是与 Mina 区块链上的代币进行交互的主要方式。它提供了一个客户端接口，支持创建新令牌、创建新令牌帐户和铸造非默认令牌的功能。除了令牌接口之外，还有其他高级客户端和守护程序命令（请参阅CLI 参考）。


### 创建令牌
使用 CLI，您可以在 Mina 上创建自己的Token。非默认Token是Mina区块链引入的一种新型Token。这些新型Token具有唯一标识符，可将它们与区块链中的所有其他Token区分开来。然后，拥有这个关联token帐户的用户可以接收/发送这种Token。

创建新Token时，会创建新Token ID以及基于公钥的Token帐户。这个Token账户拥有Token并且可以铸造更多的Token。该帐户还将（最终）有权启用/禁用帐户，并设置是否可以创建新帐户。

注意，创建新的Token需要在原先已有的交易费用之上支付额外费用。这笔额外费用是用于支付创建帐户的费用。

### 创建一个新令牌
    $ mina client create-token --sender <PUBLIC_KEY>
用以下命令了解有关如何使用该命令的更多信息。

    $ mina client create-token -help

### 创建令牌帐户
使用 CLI，您可以为现有Token创建Token帐户。Token账户类似于普通账户，但仅用于与 Mina 协议中存在的非默认Token进行交互。您必须为您希望与之交互的每种类型的令牌创建一个单独的唯一令牌帐户。

### 创建一个新的令牌帐户
    $ mina client create-token-account --token-owner <PUBLICKEY> --receiver <PUBLICKEY> --sender <KEY> --token <TOKEN_ID>
用以下命令了解有关如何使用该命令的更多信息。

    $ mina client create-token-account -help

### 铸造代币
使用 CLI，您可以创建自己的代币。铸造自己的代币只会增加特定Token的供应量。铸造Token是所有非默认Token的创建方式，没有其他协议事件或命令可以创建非默认Token。此命令只能由Token所有者发出，但可以在任何现有帐户中为该代币铸造Token。

铸造代币命令:

    $ mina client mint-tokens --amount <VALUE> --sender <PUBLIC-KEY> --token <TOKEN_ID>

    创建新令牌帐户的必填字段是：
    - 数量：要创建的新代币数量
    - 发件人：您要从中发送交易的公钥
    - token : 要铸造的令牌的 ID

    可选字段，可让您指定帐户的公钥以在以下位置创建新令牌：
    - 接收者：用于在其中创建新令牌的帐户的公钥
用以下命令了解有关如何使用该命令的更多信息。

    mina client mint-tokens -help

### 协议运行流程
针对协议各个关键模块的解读后，我们可以从交易的层面来看下协议如何完整运行的。我们将以付款为例子来进行说明。付款是一种交易，要求将价值从一个帐户转移到另一个帐户，以及发送方愿意为付款支付的相关费用。以下举例说明Bob向Alice发送mina的流程。

1. 创建交易 - Bob 点击“发送” 付款
    
    Mina区块链网络中的任何成员都可以创建付款并与 Mina 网络共享。付款使用私钥进行加密签名，以便可以验证发送方的帐户。然后将其广播发送到网络上的其他对应节点进行处理。接受方收到后将存在他们本地的transaction pool数据结构内(节点内用于存储来自网络上的所有交易的内存结构)。

2. 生产一个区块 - Bob 的付款被放入待办事项列表

    在给定的时间内Mina网络会选择一个区块生产者用于生产新区快。当前活跃的区块生产者基于支付费用的考虑自行选择这些交易，然后将它们放在一个称为过渡块(Transition Block)的列表中进行处理。区块生产者通过产出新区块来赚取mina。区块生产者会产出一个初始Snark文件，定义当前的过渡块的结构，用于与前一个区块相比。注意这个Snark还未验证区块内部的交易。生产者将这些新信息传输给Snark工作者进行处理。

3. Snark验证交易 - Bob 的付款获得 Snark 签名
    
    网络上的Snar工作节点开始对新过渡块中的每一交易执行 Snark 计算。首先会对每个交易进行验证产出证明，再对相邻的交易进行合并产出证明，直至最后所有交易均被验证。Snark工作者从这些Snark产出证明中获取相应的收益，而这些收益是由区块生产者来支付，他们会从产出区块的收益中剥离部分用于支付Snark工作者。最后，这些Snark证明被广播至网络中。


4. 交易确认 - Alice 和 Bob 的账户显示转账结果
    
    一旦区块被验证完毕，区块生产者便会发出针对于该过渡块的确认信息至网络中。然后网络中其他节点便会基于此更新本地区块，最后实现账户上双方余额的更新。

5. 交易置信度 - Alice确认转账已完成
    
    随着不断新的后续区块的加入，接受者会更加确认之前那个交易已经完成且网络对这个结果已达成共识。当然，像其他区块链一样，我们会有一个交易最终确认时间，意指在特定的几个区块后交易才会被最终确认。在比特币区块链中，会需要6个区块(60分钟)之后交易才最终确认。同样，在Mina区块链中，会建议等待15个区块(同样是60分钟)来达到高置信度(99.9%), 以阻止交易被篡改撤销。


## Mina协议的具体实现
Mina 协议是用OCaml语言编写的，Ocaml是一种静态的函数式编程语言。关于Ocaml, 可以参考[Ocaml文档](https://realworldocaml.org/)。

### 编译相关
OCaml 编译器支持字节码和原生编译。Mina代码与一些库静态链接，因此无法编译为字节码。Mina代码同样也不能很好地支持REPL。Mina的编译系统为 Dune。在Dune上，一个文件代表一个模块，文件夹代表着模块的组合。如果文件夹中有一个同名的文件，它会类似于index.js在 Node.js 中的作用。

我们还有 OCaml 中的接口文件——它们的扩展名.mli只包含模块的类型签名和结构。相应的实现必须具有相同的文件名，但带有.ml扩展名。只有接口中定义的东西才能从其他模块中获得。如果模块不存在接口文件，则默认情况下会公开所有内容。注意： Reason 遵循与.rei和.re扩展相同的规则。

对于链接步骤，在引擎盖下dune使用ldd。您还可以使用诸如-O3优化之类的东西。对于调试，您可以使用gdbOCaml 不完全支持但它可以工作的。即将发布的 OCaml (4.08) 将与gdb.

### 代码结构
你可以从 [Mina Code Repository](https://github.com/minaprotocol/mina) 上查看具体的实现细节。下面将对项目结构进行简要说明，以帮助更容易地阅读源码。
* dockerfiles/
    
    包含 Docker 相关脚本
* docs/

    贡献代码和流程的文档在这里。包含演练文档的文档网站位于frontend/website/docs.
* frontend/

    所有与 Mina 前端 UI 和产品相关的代码
    * wallet/

        Mina钱包的源代码
    * website/

        https://minaprotocol.com 网站的源码
        * docs/

            关于加入位于https://minaprotocol.com/docs的 Mina 网络的文档和说明
        * posts/

            博客文章的 Markdown 文档
        * src/

            网站的源代码
        * static/

            静态文件，如图像等。
    * rfcs/

        该目录包含根据RFC 流程提出的所有已接受的 RFC（或“征求意见”）。
    * scripts/
        
        脚本相关。
    * src/

        所有协议源代码，包括应用程序和库代码，都在这个目录中。
        
        * *.opam

            Mina的dune构建系统需要这些文件。lib文件夹中的每个库都对应着一个*.opam文件。当创建一个库lib/foo_lib时，会由dune配置文件确定当前库名，同时需要创建所需的foo_lib.opam文件。
        * config/

            构建时配置 - 这些.mlh 文件定义了编译时常量及其值。
        * app/

            应用程序所在位置。

            * cli/
            
                这是 mina 客户端/守护进程。用于运行Staker, Snaker, 或简单的用于发送接收交易的客户端。
            * website/

                即将被弃用的网站目录 - 大部分代码已迁移到 frontend/website/
            * reformat/

                该程序ocamlformat在源代码树中的大多数文件上运行，只有少数例外。
            * logproc/

                该实用程序从stdinmina 守护程序发出的日志消息中读取并可以过滤和打印这些日志消息。
            * libp2p_helper/

                该程序使用 go-libp2p 来实现 Mina 守护进程所需的点对点管道。
        * external/

            第三方库，其中部分库进行了一些定制修改。
        * lib/

            主要包含两种库:
            
            * 通用类型库: 包括snarky，fold_lib，vrf_lib，sgn等。
            * 应用程序专属类型库: 包括syncable_ledger，staged_ledger，transaction_snark等。

## Snapps
Snapps（“Snark 应用程序”）是Mina区块链上基于zk-SNARK的智能合约。Snapps的执行和状态模型都是基于链下的，而这这有助于私有计算和私有状态维护。基于zk-SNARK，Snapps可以在链下执行任意复杂的计算，同时只需支付固定费用即可将生成的零知识证明发送到链，这与使用基于gas模型的其他区块链相反。

![](https://docs.minaprotocol.com/static/img/docs-images/1_Snapps_Off-Chain_Performance.jpg)

Snapps 是用 TypeScript 编写的。TypeScript 提供了一种简单、熟悉的语言 (JavaScript)，但增加了类型安全性，有助于开发者更容易上手Snapps。

### Snapps原理
Snapps 是使用 Snapp CLI 以 TypeScript 编写的。(Note: Snapps 目前在最新版本的Chrome、Firefox、Edge和Brave 中运行。我们打算在未来添加对 Safari 的支持。)

如下图所示, “snapp”由两部分组成：1.) 智能合约和 2.) 供用户与之交互的 UI（用户界面）。
![](https://docs.minaprotocol.com/static/img/docs-images/3_Snapps_Structure.jpg)

### 基于零知识的智能合约
由于Snapps基于零知识证明 (zk-SNARKs)，因此Snapp开发人员会编写出所谓的“电路” - 这是在构建过程中派生出证明函数和相应验证函数的方法。

证明函数就是用于执行智能合约里的代码的函数。它运行于用户的浏览器中，当用户在浏览器中的相关行为(如用币购买服务)产生输入数据后，经过该验证函数，最终输出一个zk证明。

![](https://docs.minaprotocol.com/static/img/docs-images/4_Snapps_Prover_Function.jpg)

而验证函数的功能是用于验证是否零知识证明成功通过了所有的证明函数定义的约束。验证函数的时间复杂度不受证明函数内部的复杂度影响。在Mina网络中，Mina作为验证者并运行这些验证函数。
![](https://docs.minaprotocol.com/static/img/docs-images/5_Snapps_Verifier_Function.jpg)

### Mina 的证明函数和验证密钥
当Snapp开发人员编写完他们的智能合约, 运行npm run build后，会产出一个smart_contract.js文件。在运行或部署完该合约后，你可以运行您的证明函数或生成验证密钥。该验证密钥存于Mina链上指定的Snapp账户，用于由Mina网络来验证零知识证明是否满足在证明函数中定义的所有要求。同样，这个密钥也用与创建Snapp帐户。


### 部署智能合约
![](https://docs.minaprotocol.com/static/img/docs-images/6_Snapps_DeploySmartContract.jpg)
在Mina上需要使用Snapp CLI来进行部署智能合约。部署过程中CLI会发送包含验证密钥的交易到Mina链上的指定地址。

当Mina地址包含验证密钥时，它类似于一个Snapp账户。该账户仅能接受那些包含证明(通过验证函数的证明)的交易。那些无法通过验证函数的交易会被Mina区块链网络拒绝。

(注意: 当您部署到新的 Mina 地址时，Mina 协议将收取 1 MINA 的帐户创建费用。这与Snapps无关，是为了帮助防止sybil或拒绝服务攻击。)

### 用户如何与 Snapp 交互
Auro 是目前唯一支持 Snapp 交易的钱包。但是，计划在未来将对 snapps 的支持扩展到其他类型的钱包（例如移动钱包和桌面钱包）。安装Auro钱包可参考: [Google Chrome安装Auro钱包](https://www.aurowallet.com/)。

将 Snapp 部署到主机（例如 mycoolsnapp.com）后，用户可以与其进行交互：
1. 用户访问 mycoolsnapp.com。
2. 用户与 Snapp 交互并根据需要输入任何数据。（例如，如果这是一个自动做市商，用户可能会指定“以 y 价格购买 x 数量的 ABC”。）
3. Snapp 中的证明功能现在将根据用户输入的数据在本地生成零知识证明。这些数据可以是私有的（区块链永远不会看到的）或公共的（将存储在链上或链下），这取决于开发人员指定的内容，以及给定用例的需要。此外，将生成此交易要创建的状态更新列表并与此证明相关联。
4. 用户在 Snapp UI 中点击“提交链”，他们的钱包（例如浏览器扩展钱包）将提示他们确认发送交易。钱包签署包含证明和相关状态描述的交易以更新并将其发送到 Mina 区块链。
5. 当 Mina 网络收到此交易时，它会验证该证明是否成功通过了 Snapp 帐户上列出的验证者方法。如果网络接受此交易，则表明此证明和请求的状态更改有效，因此允许更新 snapp 的状态。

因为用户的交互发生在他们的 Web 浏览器本地（在客户端上使用 JavaScript），所以可以维护用户的隐私。

### 状态如何在链上更新
当证明功能在Web浏览器中运行时，智能合约会输出证明和一些我们称之为“事件”的相关数据。当将交易发送到 Snapp 地址时，这将作为交易的一部分发送。这些事件是纯文本描述（JSON 格式），描述了如何更新 Snapp 帐户的状态。

通过将这些事件的哈希作为公共输入传递给智能合约，可以确保这些事件的完整性。它们必须存在且未经修改，验证函数在 Mina 上运行时才能成功通过。通过这种方式，Mina 网络可以确认证明和相关事件的完整性，这些事件描述了如何更新 snapp 帐户的状态。

### 快照状态
Mina 上存在两种不同类型的状态：链上状态和链下状态。链上状态描述了存在于 Mina 区块链上的状态。链下状态描述了存储在其他任何地方的状态——例如IPFS等。

### 链上状态
每个 Snapp 帐户提供 8 个字段，每个字段 32 字节任意存储。您可以将任何东西存放在这里，只要它符合提供的尺寸即可。如果您预计您的状态会大于此值，或者如果每个用户使用 Snapp 累积状态，那么您将需要改用链外状态。

### 脱链状态
对于较大的数据，您可能需要考虑将Merkle树（或类似数据结构）的根存储在您的 snapp 链上存储结构中，然后该存储进一步引用其他的链下存储，例如IPFS。

当 snapp 在用户的 Web 浏览器中运行时，它可能会将状态插入到外部存储中，例如 IPFS。当交易被发送到 Mina 网络时，如果Mina接受这个 Snapp 交易（即这个证明和状态是有效的，所以允许更新），那么 Snapp 交易将更新存储在链上的 Merkle 树的根。
![](https://docs.minaprotocol.com/static/img/docs-images/9_Snapps_Off-Chain_State.jpg)

### SnarkyJS API 参考
要编写 Snapp，我们建议使用Snapp CLI，它通过包含 SnarkyJS 并提供项目脚手架、测试框架和格式，使编写 Snapp 变得容易。具体API参考: [SnarkyJS API 参考](https://docs.minaprotocol.com/en/snapps/snarkyjs-reference)

## 最后
至此，本文基于Mina的官方文档进一步整理，介绍了Mina的基本概念，涉及Mina协议的各个关键模块, 说明协议具体的实现，最后简要介绍Snapps的概念。