pragma solidity ^0.8.0;

import "./IERC721.sol";
import "./IERC20.sol";
import "./IERC721Receiver.sol";

contract AuctionUnfixedPrice is IERC721Receiver {

    struct auctionDetails {
        address seller;
        uint128 price;
        uint256 duration;
        address tokenAddress;
        uint256 maxBid;
        address maxBidUser;
        bool isActive;
        uint256[] bidAmounts;
        address[] users;
    }

    mapping(address => mapping(uint256 => auctionDetails)) public tokenToAuction;

    mapping(address => mapping(uint256 => mapping(address => uint256))) public bids;

    /**
       Seller puts the item on auction
    */
    function createTokenAuction(
        address _nft,
        uint256 _tokenId,
        address _tokenAddress,
        uint128 _price,
        uint256 _duration
    ) external {
        require(msg.sender != address(0));
        require(_nft != address(0));
        require(_price > 0);
        require(_duration > 0);

        auctionDetails memory _auction = auctionDetails({
        seller: msg.sender,
        price: uint128(_price),
        duration: _duration,
        tokenAddress: _tokenAddress,
        maxBid: 0,
        maxBidUser: address(0),
        isActive: true,
        bidAmounts: new uint256[](0),
        users: new address[](0)
        });
        address owner = msg.sender;
        IERC721(_nft).safeTransferFrom(owner, address(this), _tokenId);
        tokenToAuction[_nft][_tokenId] = _auction;
    }
    /**
       Users bid for a particular nft, the max bid is compared and set if the current bid id highest
    */
    function bid(address _nft, uint256 _tokenId, uint256 _amount) external payable {
        auctionDetails storage auction = tokenToAuction[_nft][_tokenId];
        require(_amount >= auction.price);
        require(auction.isActive);
        require(auction.duration > block.timestamp, "Deadline already passed");

        bool exist = false;
        // check wheather bid
        if (bids[_nft][_tokenId][msg.sender] > 0) {
        bool success= IERC20(auction.tokenAddress).transfer(msg.sender,bids[_nft][_tokenId][msg.sender]);
        require(success);
        exist = true ;
        }

        bids[_nft][_tokenId][msg.sender] = _amount;
        IERC20(auction.tokenAddress).transferFrom(msg.sender, address(this), _amount);

        if (auction.bidAmounts.length == 0) {
            auction.maxBid = _amount;
            auction.maxBidUser = msg.sender;
        } else {
            uint256 lastIndex = auction.bidAmounts.length - 1;
            require(auction.bidAmounts[lastIndex] < _amount, "Current max bid is higher than your bid");
            auction.maxBid = _amount;
            auction.maxBidUser = msg.sender;
        }

        if (!exist) {
            auction.users.push(msg.sender);
            auction.bidAmounts.push(_amount);
        }

    }
    /**
       Called by the seller when the auction duration is over the hightest bid user get's the nft and other bidders get eth back
    */
    function executeSale(address _nft, uint256 _tokenId) external {
        auctionDetails storage auction = tokenToAuction[_nft][_tokenId];
        require(auction.duration <= block.timestamp, "Deadline did not pass yet");
        require(auction.seller == msg.sender);
        require(auction.isActive);
        auction.isActive = false;
        if (auction.bidAmounts.length == 0) {
            IERC721(_nft).safeTransferFrom(
                address(this),
                auction.seller,
                _tokenId
            );
        } else {
           // (bool success, ) = auction.seller.call{value: auction.maxBid}("");
            bool success = IERC20(auction.tokenAddress).transfer(auction.seller,auction.maxBid);
            require(success);
            for (uint256 i = 0; i < auction.users.length; i++) {
                if (auction.users[i] != auction.maxBidUser) {

//                    (success, ) = auction.users[i].call{
//                    value: bids[_nft][_tokenId][auction.users[i]]
//                    }("");

            success= IERC20(auction.tokenAddress).transfer(auction.users[i], bids[_nft][_tokenId][auction.users[i]]);
            require(success);
                }
            }
            IERC721(_nft).safeTransferFrom(
                address(this),
                auction.maxBidUser,
                _tokenId
            );
        }
    }

    /**
       Called by the seller if they want to cancel the auction for their nft so the bidders get back the locked eeth and the seller get's back the nft
    */
    function cancelAution(address _nft, uint256 _tokenId) external {
        auctionDetails storage auction = tokenToAuction[_nft][_tokenId];
        require(auction.seller == msg.sender);
        require(auction.isActive);
        auction.isActive = false;
        bool success;
        for (uint256 i = 0; i < auction.users.length; i++) {
//            (success, ) = auction.users[i].call{value: bids[_nft][_tokenId][auction.users[i]]}("");
//            require(success);
        success = IERC20(auction.tokenAddress).transfer(auction.users[i], bids[_nft][_tokenId][auction.users[i]]);
        require(success);
        }
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
