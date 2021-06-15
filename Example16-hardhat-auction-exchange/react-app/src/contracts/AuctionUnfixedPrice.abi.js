module.exports = [
  {
    "constant": false,
    "inputs": [
      {
        "name": "_nft",
        "type": "address"
      },
      {
        "name": "_tokenId",
        "type": "uint256"
      },
      {
        "name": "_amount",
        "type": "uint256"
      }
    ],
    "name": "bid",
    "outputs": [],
    "payable": true,
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "",
        "type": "address"
      },
      {
        "name": "",
        "type": "address"
      },
      {
        "name": "",
        "type": "uint256"
      },
      {
        "name": "calldata",
        "type": "bytes"
      }
    ],
    "name": "onERC721Received",
    "outputs": [
      {
        "name": "",
        "type": "bytes4"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_nft",
        "type": "address"
      },
      {
        "name": "_tokenId",
        "type": "uint256"
      },
      {
        "name": "_tokenAddress",
        "type": "address"
      },
      {
        "name": "_price",
        "type": "uint128"
      },
      {
        "name": "_duration",
        "type": "uint256"
      }
    ],
    "name": "createTokenAuction",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "_nft",
        "type": "address"
      },
      {
        "name": "_tokenId",
        "type": "uint256"
      }
    ],
    "name": "getTokenAuctionDetails",
    "outputs": [
      {
        "components": [
          {
            "name": "seller",
            "type": "address"
          },
          {
            "name": "price",
            "type": "uint128"
          },
          {
            "name": "duration",
            "type": "uint256"
          },
          {
            "name": "tokenAddress",
            "type": "address"
          },
          {
            "name": "maxBid",
            "type": "uint256"
          },
          {
            "name": "maxBidUser",
            "type": "address"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "bidAmounts",
            "type": "uint256[]"
          },
          {
            "name": "users",
            "type": "address[]"
          }
        ],
        "name": "",
        "type": "tuple"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "",
        "type": "address"
      },
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "tokenToAuction",
    "outputs": [
      {
        "name": "seller",
        "type": "address"
      },
      {
        "name": "price",
        "type": "uint128"
      },
      {
        "name": "duration",
        "type": "uint256"
      },
      {
        "name": "tokenAddress",
        "type": "address"
      },
      {
        "name": "maxBid",
        "type": "uint256"
      },
      {
        "name": "maxBidUser",
        "type": "address"
      },
      {
        "name": "isActive",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_nft",
        "type": "address"
      },
      {
        "name": "_tokenId",
        "type": "uint256"
      }
    ],
    "name": "executeSale",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_nft",
        "type": "address"
      },
      {
        "name": "_tokenId",
        "type": "uint256"
      }
    ],
    "name": "cancelAution",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "",
        "type": "address"
      },
      {
        "name": "",
        "type": "uint256"
      },
      {
        "name": "",
        "type": "address"
      }
    ],
    "name": "bids",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
];