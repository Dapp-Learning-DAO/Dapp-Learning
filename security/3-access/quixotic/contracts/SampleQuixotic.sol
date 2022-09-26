// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";

contract SampleQuixotic is Ownable {

    mapping(bytes32=>uint256) _cancelledSellOrders;
    IERC20 private _settlemenERC20;

    bytes32 private EIP712_DOMAIN_TYPE_HASH = keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 private DOMAIN_SEPARATOR = keccak256(abi.encode(
            EIP712_DOMAIN_TYPE_HASH,
            keccak256(bytes("Quixotic")),
            keccak256(bytes("4")),
            block.chainid,
            address(this)
        ));

    constructor(address erc20) {
        _settlemenERC20 = IERC20(erc20);
    }
    
    struct SellOrder {
        address seller;
        address contractAddress;
        uint256 tokenId;
        uint256 quantity;
        uint256 price;
        uint256 startTime;
        uint256 expiration;
        uint256 createdAtBlock;
    }

    function fillSellOrder(
        address seller,
        address contractAddress,
        uint256 tokenId,
        uint256 quantity,
        uint256 price,
        uint256 startTime,
        uint256 expiration,
        uint256 createdAtBlock,
        bytes memory signature,
        address buyer
    ) external { 
        //date checks
        require(_getCancelledBlockNumber(seller,  contractAddress, tokenId) < createdAtBlock, "Does not allow filled order to replay");
        require(block.timestamp >= startTime, "Sell not started");
        require(block.timestamp <= expiration, "Sell has ended");
        //Signature checks
        SellOrder memory sellOrder = SellOrder({
            seller: seller,
            contractAddress: contractAddress,
            tokenId: tokenId,
            quantity: quantity,
            price: price,
            startTime: startTime,
            expiration: expiration,
            createdAtBlock: createdAtBlock
        });
        _signatureChecks(sellOrder, signature);
        //Move nft from seller to buyer
        _transferNFTToBuyer(contractAddress, seller, buyer, tokenId, quantity);
        //Move erc20 from buyer to seller
        _payERC20ToSeller(seller, buyer, price);
    }

    function _signatureChecks(SellOrder memory sellOrder, bytes memory signature) internal view {
        //build type hash
        bytes32 SELLORDER_TYPEHASH = keccak256("SellOrder(address seller,address contractAddress,uint256 tokenId,uint256 quantity,uint256 price,uint256 startTime,uint256 expiration,uint256 createdAtBlock)");
        //build struct hash
        bytes32 structHash = keccak256(abi.encode(
            SELLORDER_TYPEHASH,
            sellOrder.seller,
            sellOrder.contractAddress,
            sellOrder.tokenId,
            sellOrder.quantity,
            sellOrder.price,
            sellOrder.startTime,
            sellOrder.expiration,
            sellOrder.createdAtBlock
        ));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR ,structHash));
        //recover address from sig
        address recovered = ECDSA.recover(digest, signature);
        require(sellOrder.seller == recovered, "invalid signature");
    }

    function _getCancelledBlockNumber(address seller, address nftAddress, uint256 tokenId) internal view returns(uint256) {
        bytes32 digest = keccak256(abi.encodePacked(seller, nftAddress, tokenId));
        return _cancelledSellOrders[digest];
    }
    
    function _transferNFTToBuyer( address contractAddress, address seller, address buyer, uint256 tokenId, uint256 quantity) internal{
        if (ERC165Checker.supportsInterface(contractAddress, type(IERC721).interfaceId)) {
            IERC721 erc721 = IERC721(contractAddress);
            erc721.safeTransferFrom(seller, buyer, tokenId);
        } else if (ERC165Checker.supportsInterface(contractAddress, type(IERC1155).interfaceId)) {
            IERC1155 erc1155 =IERC1155(contractAddress);
            erc1155.safeTransferFrom(seller, buyer, tokenId, quantity, '');
        } else{
            revert("unrecognized token");
        }
    }

    function _payERC20ToSeller(address seller,  address buyer, uint256 price) internal {
        //ignore fee and royalty, etc
        bool success = _settlemenERC20.transferFrom(buyer, seller, price);
        require(success, "transfer erc20 failed");
    }
    //...other functions   
}