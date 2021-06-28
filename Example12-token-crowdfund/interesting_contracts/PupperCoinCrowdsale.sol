
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/release-v2.5.0/contracts/crowdsale/Crowdsale.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/release-v2.5.0/contracts/crowdsale/emission/MintedCrowdsale.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/release-v2.5.0/contracts/crowdsale/validation/CappedCrowdsale.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/release-v2.5.0/contracts/crowdsale/validation/TimedCrowdsale.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/release-v2.5.0/contracts/crowdsale/distribution/RefundablePostDeliveryCrowdsale.sol";

// Inherit the crowdsale contracts
contract PupperCoinCrowdsale is Crowdsale, MintedCrowdsale, CappedCrowdsale, TimedCrowdsale, RefundablePostDeliveryCrowdsale {


    constructor(
        uint rate,
        PupperCoin token,
        address payable wallet,
        uint goal,
        uint open,
        uint close
    )

    Crowdsale(rate, wallet, token)
    TimedCrowdsale(now, now + 24 weeks)
    CappedCrowdsale(goal)
    RefundableCrowdsale(goal)
    public
    {

    }
}

contract PupperCoinSaleDeployer {

    address public token_sale_address;
    address public token_address;


    constructor(
        string memory name,
        string memory symbol,
        address payable wallet,
        uint goal
    )
    public
    {
        // create the PupperCoin and keep its address handy
        PupperCoin token = new PupperCoin(name, symbol, 0);
        token_address = address(token);

        //create the PupperCoinSale and tell it about the token, set the goal, and set the open and close times to now and now + 24 weeks.
        PupperCoinCrowdsale token_sale = new PupperCoinCrowdsale(1, token, wallet, goal, now, now + 24 weeks);
        token_sale_address = address(token_sale);


        // make the PupperCoinSale contract a minter, then have the PupperCoinSaleDeployer renounce its minter role
        token.addMinter(token_sale_address);
        token.renounceMinter();
    }
}
