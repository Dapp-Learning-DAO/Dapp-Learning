# EmojiLootWithStory合约分析

前几天看到一个有趣的NFT智能合约，名字叫做EmojiLoot，大家可以在opensea上面查看到他，其本质是拼接各种标签样式成为一张SVG图片，上面有各种各样有趣的Emoji，更加有意思的是通过EmojiLootWithStory合约可以给EmojiLoot合约发行的NFT上面添加动态字幕，下面就主要分析一下EmojiLootWithStory合约。

在分析之前，我们来简单了解一下SVG，SVG是W3C推出的基于XML的二维矢量图形标准。SVG可以提供高质量的矢量图形渲染，同时由于支持JavaScript和文档对象模型，SVG图形通常具有强大的交互能力。另一方面，SVG作为W3C所推荐的基于XML的开放标准，能够与其他网络技术进行无缝集成。

下面就是一个简单SVG图片的例子，：

```html
<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 350 350">
<style>
  .base { fill: white; font-family: serif; font-size: 12px; }
</style>
<rect width="100%" height="100%" fill="black" />
<text x="10" y="20" class="base">Hello</text>
</svg>
```

可以直接保存，浏览器打开：![image-20211023094247124](https://gitee.com/hqwangningbo/blogimage/raw/master/Substrate/image-20211023094247124.png)



现在回到主题EmojiLootWithStory合约，EmojiLootWithStory合约本质也是一个发行NFT的ERC721,但是让其作为EmojiLoot合约的增强合约，做出了很多限制处理，例如：只有在EmojiLoot合约拥有NFT的所有权，才有权限在EmojiLootWithStory合约上面加工、接收对应token ID 的NFT，具体可以看源码分析，如下：

总览EmojiLootWithStory合约：

* 构造方法
* 变量
  * eloot
  * Story
  * _storys
  * chapter
* 事件
  * Claim
* 函数
  * storyOfTokenByIndex
  * tokenURI
  * claim
  * _beforeTokenTransfer
  * _replace

下面我们按照上面，把合约拆开一点点来分析：

构造函数，方法参数需传入实现IEmojiLoot接口的EmojiLoot合约，并给传入的合约地址赋给变量eloot

```solidity
    constructor(address _eloot) public {
        eloot = _eloot;
    }
```

变量

```solidity
		//需要添加故事字幕的EmojiLoot智能合约地址
		address public eloot;
    //故事结构体
    struct Story {
    		//NFT拥有者
        address owner;
        //故事作者
        string author;
        //故事内容
        string story;
    }
		//tokenId => chapter => Story
    mapping(uint256 => mapping(uint256 => Story)) private _storys;
    //tokenId => chapter，这个chapter主要是为了查询一个NFT的历史故事
    mapping(uint256 => uint256) public chapter;
```

事件

```solidity
	 //声明story事件
    event Claim(
        address indexed to,
        uint256 indexed tokenId,
        string author,
        string story
    );
```

函数storyOfTokenByIndex,获取历史故事详情,给定token id和同一个NFT的第几次声明的故事

```solidity
function storyOfTokenByIndex(uint256 tokenId, uint256 index)
        public
        view
        returns (Story memory)
    {
        return _storys[tokenId][index];
    }
```

函数tokenURI就是拼接SVG的主要函数，拼接SVG标签、样式代码，同时中间穿插获取EmojiLoot合约上获取各部分Emoji的内容，比如getWeapon、getFaces等

```solidity
		function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
    		//定义一个字符串数据，把svg内容分别复制进去，然后把他拼接起来
        string[24] memory parts;
        parts[
            0
        ] = '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 350 350"><style>.base { fill: white; font-family: serif; font-size: 12px; }.content{line-height:1.2;animation: moveUp 8s 0s infinite;position:relative;color: #fff;}.box{overflow: hidden;height: 150px;}@keyframes moveUp{0% {top:100%;} 100% {top:-100%; display: none;}}</style><rect width="100%" height="100%" fill="black" /><text x="10" y="20" class="base">';
        
        parts[1] = IEmojiLoot(eloot).getWeapon(tokenId);

        parts[2] = '</text><text x="10" y="40" class="base">';

        parts[3] = IEmojiLoot(eloot).getFaces(tokenId);

        parts[4] = '</text><text x="10" y="60" class="base">';

        parts[5] = IEmojiLoot(eloot).getBody(tokenId);

        parts[6] = '</text><text x="10" y="80" class="base">';

        parts[7] = IEmojiLoot(eloot).getLocation(tokenId);

        parts[8] = '</text><text x="10" y="100" class="base">';

        parts[9] = IEmojiLoot(eloot).getSport(tokenId);

        parts[10] = '</text><text x="10" y="120" class="base">';

        parts[11] = IEmojiLoot(eloot).getPets(tokenId);

        parts[12] = '</text><text x="10" y="140" class="base">';

        parts[13] = IEmojiLoot(eloot).getFlowers(tokenId);

        parts[14] = '</text><text x="10" y="160" class="base">';

        parts[15] = IEmojiLoot(eloot).getTraffic(tokenId);
        
        //故事信息
        parts[16] = '</text><text x="10" y="180" class="base">Author: ';
        //作者
        parts[17] = _storys[tokenId][chapter[tokenId]].author;
        //第几章，相当于第几次声明故事
        parts[18] = '</text><text x="10" y="200" class="base">Chapter';
        parts[19] = Strings.toString(chapter[tokenId]);
        parts[20] = " : ";
				//故事内容
        parts[
            21
        ] = '</text><foreignObject width="320" height="510" x="10" y="210"><body xmlns="http://www.w3.org/1999/xhtml"><div class="box"><p class="content">';
        parts[22] = _storys[tokenId][chapter[tokenId]].story;

        parts[23] = "</p></div></body></foreignObject></svg>";
        
        //开始拼接
        string memory output = string(
            abi.encodePacked(
                parts[0],
                parts[1],
                parts[2],
                parts[3],
                parts[4],
                parts[5],
                parts[6],
                parts[7],
                parts[8]
            )
        );
        output = string(
            abi.encodePacked(
                output,
                parts[9],
                parts[10],
                parts[11],
                parts[12],
                parts[13],
                parts[14],
                parts[15],
                parts[16]
            )
        );
        output = string(
            abi.encodePacked(
                output,
                parts[17],
                parts[18],
                parts[19],
                parts[20],
                parts[21],
                parts[22],
                parts[23]
            )
        );
        //对整体拼接好的数据进行Base64编码
        string memory json = Base64.encode(
            bytes(
                string(
                		//拼接成json对象，方便前端处理数据
                    abi.encodePacked(
                        '{"name": "Story #',
                        Strings.toString(tokenId),
                        '", "description": "Emoji Loot is randomized adventurer gear generated and stored on chain. Stats, images, and other functionality are intentionally omitted for others to interpret. Feel free to use Loot in any way you want.", "image": "data:image/svg+xml;base64,',
                        //svg代码独自base64编码一次
                        Base64.encode(bytes(output)),
                        '","attributes": [',
                        abi.encodePacked(
                            '{"trait_type": "Weapon", "value": "',
                            _replace(parts[1]),
                            '"},',
                            '{"trait_type": "Face", "value": "',
                            _replace(parts[3]),
                            '"},',
                            '{"trait_type": "Body", "value": "',
                            _replace(parts[5]),
                            '"},'
                        ),
                        abi.encodePacked(
                            '{"trait_type": "Location", "value": "',
                            _replace(parts[7]),
                            '"},',
                            '{"trait_type": "Sport", "value": "',
                            _replace(parts[9]),
                            '"},',
                            '{"trait_type": "Pet", "value": "',
                            _replace(parts[11]),
                            '"},'
                        ),
                        abi.encodePacked(
                            '{"trait_type": "Flower", "value": "',
                            _replace(parts[13]),
                            '"},',
                            '{"trait_type": "Traffic", "value": "',
                            _replace(parts[15]),
                            '"}'
                        ),
                        "]}"
                    )
                )
            )
        );
        output = string(
            abi.encodePacked("data:application/json;base64,", json)
        );

        return output;
    }

```

claim函数，为了声明故事

```solidity
//声明故事
    function claim(
        uint256 tokenId,
        string memory author,
        string memory story
    ) public {
    		//EmojiLoot合约里面该Token id一定是属于调用者
        require(
            IERC721(eloot).ownerOf(tokenId) == _msgSender(),
            "Only token owner can claim"
        );
        //NFT在自己手里只能声明一次故事
        require(
            _storys[tokenId][chapter[tokenId]].owner != _msgSender(),
            "Only can write once"
        );
        Story memory _story;
        _story.owner = _msgSender();
        _story.author = author;
        _story.story = story;
        chapter[tokenId] = chapter[tokenId] + 1;
        _storys[tokenId][chapter[tokenId]] = _story;
        //这里就可能有点绕，这里判断的是EmojiLootWithStory合约是不是存在该tokenId，如果不存在，那么就mint
        if (!_exists(tokenId)) {
            _safeMint(_msgSender(), tokenId);
            //如果代码执行下面那种情况，说明该Token ID已经存在。
            //既然已经存在，那么隐藏条件是
            //1.原本EmojiLoot合约里面该Token id的拥有者，已经在EmojiLootWithStory声明了一次故事，并且声明完还把EmojiLoot中								 Token id transfer给了调用者
            //2.EmojiLootWithStory合约中Token id的拥有者要授权给调用者
            //3.在声明完故事之后，调用者一定是EmojiLoot合约里面该Token id和EmojiLootWithStory合约该Token id的拥有者
        } else if (ownerOf(tokenId) != _msgSender()) {
            _transfer(ownerOf(tokenId), _msgSender(), tokenId);
        }
        emit Claim(_msgSender(), tokenId, author, story);
    }


```

_beforeTokenTransfer_加上之前的claim合约，充分印证了之前的结论，只有在EmojiLoot合约拥有NFT的所有权，才有权限在EmojiLootWithStory合约上面加工、接收对应token ID 的NFT。至于_replace是为了把”双引号，变成单引号‘，防止双引号里面还是双引号的问题出现。

```solidity
  //该函数是为了限制EmojiLootWithStory合约中Token id的自由转送，想要成功转移给别人，
		//首先你得把EmojiLoot合约中的tokenID转移给别人
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override {
        from;
        require(
            IERC721(eloot).ownerOf(tokenId) == to,
            "Only eloot token owner can receive"
        );
    }

    //替换双引号
    function _replace(string memory value)
        internal
        pure
        returns (string memory)
    {
        bytes memory buffer = new bytes(bytes(value).length);
        for (uint256 i = 0; i < bytes(value).length; i++) {
            buffer[i] = bytes(value)[i] == '"'
                ? bytes1("'")
                : bytes1(bytes(value)[i]);
        }
        return string(buffer);
    }
}

```

每次声明完一次故事，我们可以看看具体SVG做了哪些变动？

原本EmojiLoot合约生成的NFT

![image-20211023100911619](https://gitee.com/hqwangningbo/blogimage/raw/master/Substrate/image-20211023100911619.png)

显示效果：

https://gitee.com/hqwangningbo/blogimage/raw/master/Substrate/1.svg

<img src="https://gitee.com/hqwangningbo/blogimage/raw/master/Substrate/1.svg"/>

经过EmojiLootWithStory合约加工之后，svg代码主要改变：

![image-20211023101748856](https://gitee.com/hqwangningbo/blogimage/raw/master/Substrate/image-20211023101748856.png)

显示效果如下：

https://gitee.com/hqwangningbo/blogimage/raw/master/Substrate/2.svg

<img src="https://gitee.com/hqwangningbo/blogimage/raw/master/Substrate/2.svg"/>

总结：

EmojiLootWithStory合约在原有EmojiLoot合约基础上，再次拼接一些标签样式，已达到动态字幕的目的，同时把EmojiLootWithStory合约的一些功能做一些限制，任何操作NFT的前提是，你必须拥有对应在EmojiLoot合约上的token ID。

![wangningbo](https://gitee.com/hqwangningbo/blogimage/raw/master/Substrate/wangningbo.svg)
