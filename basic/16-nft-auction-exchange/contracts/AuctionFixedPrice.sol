pragma solidity ^0.8.0;

import "./IERC721.sol";
import "./IERC20.sol";
import "./IERC721Receiver.sol";


contract AuctionFixedPrice is IERC721Receiver {

    struct auctionDetails {
        address seller;
        uint256 price;
        uint256 duration;
        address tokenAddress;
        bool isActive;
    }

    mapping(address => mapping(uint256 => auctionDetails)) public tokenToAuction;


    /**
       Seller puts the item on auction
    */
    function createTokenAuction(
        address _nft,
        uint256 _tokenId,
        address _tokenAddress,
        uint256 _price,
        uint256 _duration
    ) external {
        require(msg.sender != address(0));
        require(_nft != address(0));
        require(_price > 0);
        require(_duration > 0);
        auctionDetails memory _auction = auctionDetails({
        seller: msg.sender,
        price: _price,
        duration: _duration,
        tokenAddress: _tokenAddress,
        isActive: true
        });
        address owner = msg.sender;
        IERC721(_nft).safeTransferFrom(owner, address(this), _tokenId);
        tokenToAuction[_nft][_tokenId] = _auction;
    }

    /**
       Purchaser buy the NFT Token when the auction duration is not over the limit
    */
    function purchaseNFTToken(address _nft, uint256 _tokenId, uint256 _price) external {
        auctionDetails storage auction = tokenToAuction[_nft][_tokenId];
        require(auction.duration > block.timestamp, "Deadline already passed");
        //Fix the bug, when the user makes a purchase, someone may add gas to complete the transaction, and then place an order at a high price
        require(_price == auction.price, "invalid price");
     //   require(auction.seller == msg.sender);
        require(auction.isActive);
        auction.isActive = false;
        address seller = auction.seller;
        uint price = auction.price;
        require(IERC20(auction.tokenAddress).transferFrom(msg.sender,seller,price), "erc 20 transfer failed!");

        IERC721(_nft).safeTransferFrom(address(this),msg.sender , _tokenId);
    }

    /**
       Called by the seller if they want to cancel the auction for their nft so the bidders get back the locked eeth and the seller get's back the nft
    */
    function cancelAution(address _nft, uint256 _tokenId) external {
        auctionDetails storage auction = tokenToAuction[_nft][_tokenId];
        require(auction.seller == msg.sender);
        require(auction.isActive);
        auction.isActive = false;
        IERC721(_nft).safeTransferFrom(address(this), auction.seller, _tokenId);
    }

    function getTokenAuctionDetails(address _nft, uint256 _tokenId) public view returns (auctionDetails memory) {
        auctionDetails memory auction = tokenToAuction[_nft][_tokenId];
        return auction;
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    )public override returns(bytes4) {
        return bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"));
    }

  //  receive() external payable {}
}