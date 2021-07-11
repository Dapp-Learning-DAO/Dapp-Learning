pragma solidity ^0.5.17;

interface IERC20 {
    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function transfer(address recipient, uint256 amount) external returns (bool);

    function allowance(address owner, address spender) external view returns (uint256);

    function decimals() external view returns (uint256);

    function approve(address spender, uint256 amount) external returns (bool);

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract StrategyGUSDRescue {
    address public constant want = address(0x056Fd409E1d7A124BD7017459dFEa2F387b6d5Cd);
    address public governance = address(0xFEB4acf3df3cDEA7399794D0869ef76A6EfAff52);

    constructor() public {}

    function getName() external pure returns (string memory) {
        return "StrategyGUSDRescue";
    }

    function deposit() public {
        uint256 _want = IERC20(want).balanceOf(address(this));
        IERC20(want).transfer(governance, _want);
    }

    function withdrawAll() public returns (uint256) {
        return 0;
    }

    function balanceOf() public pure returns (uint256) {
        return 0;
    }
}
