// SPDX-License-Identifier: UNLICENSED

//  ____  _  _  ____  _  _    ____    ____  __ _  ____
// (  _ \/ )( \/ ___)/ )( \  (___ \  (  __)(  ( \/ ___)
//  ) __/) \/ (\___ \) __ (   / __/   ) _) /    /\___ \
// (__)  \____/(____/\_)(_/  (____)  (____)\_)__)(____/
//
// By Alex Van de Sande
//
// A little contract that adds push & pull money transfer to ENS ensAddresses.
// Will work with any ENS, existing or future, including DNS names!
// Ether, tokens and NFTs remain locked by contract until ENS is set up properly.
// Once ENS points to a non-zero address, anyone can pull it there.
//
// Want to donate USDC to wikipedia.org but they don't have an eth address yet?
// Want to send an NFT to xkcd.org but you're not sure how to trust the address?
// Want to make an Ether bounty for the Ethiopian government to be aware of ENS?
// Now you can do all that and more!
// But wait, there's more! You can also use it to push to a normal address.
// Just because.
//
// ATTENTION: use at your own risk! I've barely tested it. And by barely I mean I tried a couple different things
// on rinkeby and once they worked I deployed to mainnet. NFTs don't use _safeTransfer
// because I was too lazy to build my own onerc721Received. Be careful out there.

pragma solidity ^0.8.0;
/// @title Push to ENS
/// @author Alex Van de Sande
/// @notice Allows tokens and ether to be deposited to ENS names
/// @dev Supports ether, erc20 tokens and erc721 NFTs.

import "./supportsENS.sol";

// works for both Tokens and NFTs
abstract contract Transferable {
    function transferFrom(address from, address to, uint tokens) virtual public;
}

contract PushToENS is SupportsENS {

  /// @notice Internal balance function
  /// @dev Balances are a hash based on token and account information
  mapping(bytes32 => Balance) public balances;

  struct Balance {
      uint256 withdrawable;
      uint256 lastBlockPulled;
      mapping(address => uint256) pusher;
      mapping(address => uint256) lastPushed;
  }

  event Pushed(bytes32 nameHash, address assetAddress, uint8 sendType, uint256 amount);
  event Pulled(bytes32 nameHash, address assetAddress, uint8 sendType, uint256 amount);
  event Cancel(bytes32 nameHash, address assetAddress, uint8 sendType, uint256 amount);

  // PUSH FUNCTIONS

   /**
    * @dev Generic internal push functions
    */
  function _push (bytes32 hash, uint256 amount, address assetAddress, uint8 sendType) internal {
    Balance storage balance = balances[hash];

    // If there was a pull since you last pushed, then you can't withdraw that amount anymore
    if (balance.lastPushed[msg.sender] < balance.lastBlockPulled) balance.pusher[msg.sender]=0;

    // Weird things can happen in the same block
    require(balance.lastPushed[msg.sender] != balance.lastBlockPulled || balance.lastBlockPulled == 0, "You can't push the same block on a pull");

    // Prevent Overflows
    require(balance.pusher[msg.sender] + amount > balance.pusher[msg.sender] , "Overflow detected!");
    require(balance.withdrawable + amount > balance.withdrawable , "Overflow detected!");

    // Increase the balances
    balance.withdrawable  += amount;
    balance.pusher[msg.sender]+= amount;
    balance.lastPushed[msg.sender] = block.number;

    // tell everyone about it
    emit Pushed(hash, assetAddress, sendType, amount);
  }

   /**
    * @notice Pushes ether sent in transaction for an ENS name represented by `nameHash`
    * @param nameHash a 256-bit hash that represents an ENS name. See: https://docs.ens.domains/contract-api-reference/name-processing
    */
  function pushEther2ENS (bytes32 nameHash) public payable {
    _push(nameHash, msg.value, 0x0000000000000000000000000000000000000000, 0);
  }

   /**
    * @notice Pushes ether sent in transaction for `ethAddress`
    * @param ethAddress a standard ethereum compatible address
    */
  function pushEther2Ethadd (address ethAddress) public payable {
    _push(keccak256(abi.encode(ethAddress)), msg.value, 0x0000000000000000000000000000000000000000, 1);
  }

   /**
    * @notice Pushes `amount` standard units of the `assetAddress` token for an ENS address represented by `nameHash`.
    * @notice If `nftId` is set, then it assumes it's a ERC721 NFT and sends the one with `nftId`.
    * @dev If it's a token, leave nftId as 0. Can't send any NFT with id 0.
    * @param nameHash a 256-bit hash that represents an ENS name. See: https://docs.ens.domains/contract-api-reference/name-processing
    * @param assetAddress The address of either the token or NFT
    * @param amount Token amount. If it's an NFT, leave 0.
    * @param nftId the id of the NFT being sent. If it's a token, leave 0.
    */
  function pushAsset2ENS (bytes32 nameHash, address assetAddress, uint256 amount, uint256 nftId) public {
     // instantiate token
     Transferable asset = Transferable(assetAddress);
     uint256 wat;

     if (nftId==0) {
        // If fungible, then add all balances
        wat = amount;
        _push(keccak256(abi.encode(nameHash,assetAddress)), amount, assetAddress, 2);
     } else {
       // If not, then use amount as the nft ID
       wat = nftId;
        _push(keccak256(abi.encode(nameHash,assetAddress,nftId)), nftId, assetAddress, 3);
    }

    // transfer assets. Doesn't add a require, assumes token will revert if fails
    asset.transferFrom(msg.sender, address(this), wat);
  }

  // PULL FUNCTIONS

   /**
    * @dev Generic internal pull function
    */
  function _pull (bytes32 hash, address assetAddress, uint8 sendType) internal returns (uint256 amount){
    Balance storage balance = balances[hash];

    amount = balance.withdrawable;

    //Pull full amount always
    balance.withdrawable=0;
    balance.lastBlockPulled = block.number;

    // Interaction
    emit Pulled(hash, assetAddress, sendType, amount );

    return amount;
  }

   /**
    * @notice Pulls ether for any valid ENS name.
    * @dev Function can be called by anyone. Will revert if ENS name is not set, or set to 0x.
    * @param nameHash a 256-bit hash that represents an ENS name. See: https://docs.ens.domains/contract-api-reference/name-processing
    */
  function pullEther2ENS (bytes32 nameHash) public {
      // Zeroes out full balance
      uint256 amount = _pull(nameHash, 0x0000000000000000000000000000000000000000, 0);

      //Interaction
      // getSafeENSAddress prevents returning empty address
      sendValue(payable(getSafeENSAddress(nameHash)), amount);
  }

   /**
    * @notice Pulls all ether pushed for your address.
    * @dev Can only be called by the address receiving the token.
    */
  function pullEther2Ethadd () public {
      // Zeroes out full balance
      uint256 amount = _pull(keccak256(abi.encode(msg.sender)), 0x0000000000000000000000000000000000000000, 1);

      //Interaction
      sendValue(payable(msg.sender), amount);
  }

   /**
    * @notice Pulls all of the balance from token `assetAddress` for the ENS address represented by `nameHash`.
    * @notice If `nftId` is set, then it assumes it's a NFT and pulls the one with `nftId`.
    * @dev Can be called by anyone. If it's a token, leave nftId as 0. Can only pull full amounts.
    * @dev Function will revert if ENS is not set or set to 0x0.
    * @param nameHash a 256-bit hash that represents an ENS name. See: https://docs.ens.domains/contract-api-reference/name-processing
    * @param assetAddress The address of either the token or NFT
    * @param nftId the id of the NFT being sent. If it's a token, leave 0.
     */
  function pullAsset2ENS (bytes32 nameHash, address assetAddress, uint nftId) public {
       // instantiate token
     Transferable asset = Transferable(assetAddress);
    uint256 wat;
    // If it's a token then use nftId as 0
    if (nftId==0){
      //if ID is 0 then it's a token
      wat = _pull(keccak256(abi.encode(nameHash,assetAddress)), assetAddress, 2);
    } else {
      //if ID is set then it's an NFT
      wat = nftId;
      _pull(keccak256(abi.encode(nameHash, assetAddress, nftId)), assetAddress, 3);
    }

    // getSafeENSAddress prevents returning empty address
      asset.transferFrom(address(this), getSafeENSAddress(nameHash), wat);
  }

    // CANCEL FUNCTIONS

   /**
    * @dev Generic internal cancel function
    */
  function _cancel (bytes32 hash, uint256 amount, address assetAddress, uint8 sendType) internal {
     Balance storage balance = balances[hash];

    // Can only cancel if there wasn't a push yet
    require(balance.lastPushed[msg.sender] > balance.lastBlockPulled || balance.lastBlockPulled == 0, "Recipient already withdrew");

    // Check if enough balance
    require(amount <= balance.pusher[msg.sender] , "Not enough balance");
    require(amount <= balance.withdrawable , "Not enough balance");

    // Decrease both balances
    balance.pusher[msg.sender]-= amount;
    balance.withdrawable -= amount;

    // Interaction
    emit Cancel(hash, assetAddress, sendType, amount );
  }

  /**
    * @dev Get back `amount/1000000000000000000` ether you had pushed to an ENS name but it hasn't pulled yet.
    * @param nameHash a 256-bit hash that represents an ENS name. See: https://docs.ens.domains/contract-api-reference/name-processing
    * @param amount Ether amount you want to get back.
    */
  function cancelEther2ENS (bytes32 nameHash, uint256 amount) public {
      // Generic cancel function
      _cancel(nameHash, amount, 0x0000000000000000000000000000000000000000, 0);

      //Interaction
      // getSafeENSAddress prevents returning empty address
      sendValue(payable(msg.sender), amount);
  }


   /**
    * @dev Get back `amount/1000000000000000000` ether you had pushed to an Eth address name but it hasn't pulled yet.
    * @param ethAddress The address which you had pushed to.
    * @param amount Ether amount you want to get back.
    */
  function cancelEther2Ethadd (address ethAddress, uint256 amount) public {
      // Generic cancel function
       _cancel(keccak256(abi.encode(ethAddress)), amount, 0x0000000000000000000000000000000000000000, 1);

      //Interaction
      sendValue(payable(msg.sender), amount);
  }

   /**
    * @notice Get back tokens or NFT you had pushed to an ENS name but hasn't been claimed yet.
    * @param nameHash a 256-bit hash that represents an ENS name. See: https://docs.ens.domains/contract-api-reference/name-processing
    * @param assetAddress The address of either the token or NFT
    * @param amount Amount you want to pull back
    * @param nftId the id of the NFT being sent. If it's a token, leave 0.
    */
  function cancelAsset2ENS (bytes32 nameHash,  address assetAddress, uint256 amount, uint256 nftId) public {
       // instantiate token
     Transferable asset = Transferable(assetAddress);
     uint256 wat;
     //generic cancel
     // getSafeENSAddress prevents returning empty address
     if (nftId==0) {
       // If it's a token then pull all of them
       wat= amount;
       _cancel(keccak256(abi.encode(nameHash,assetAddress)), amount, assetAddress, 2);
     } else {
       // if it's an NFT use amount as tokenId
       wat=nftId;
       _cancel(keccak256(abi.encode(nameHash, assetAddress, nftId)), nftId, assetAddress, 3);
     }

    // transfer tokens
    asset.transferFrom(address(this), msg.sender, wat);

  }


     /**
     * Open Zeppellin's Send Value
     * @dev Replacement for Solidity's `transfer`: sends `amount` wei to
     * `recipient`, forwarding all available gas and reverting on errors.
     *
     * https://eips.ethereum.org/EIPS/eip-1884[EIP1884] increases the gas cost
     * of certain opcodes, possibly making contracts go over the 2300 gas limit
     * imposed by `transfer`, making them unable to receive funds via
     * `transfer`. {sendValue} removes this limitation.
     *
     * https://diligence.consensys.net/posts/2019/09/stop-using-soliditys-transfer-now/[Learn more].
     *
     * IMPORTANT: because control is transferred to `recipient`, care must be
     * taken to not create reentrancy vulnerabilities. Consider using
     * {ReentrancyGuard} or the
     * https://solidity.readthedocs.io/en/v0.5.11/security-considerations.html#use-the-checks-effects-interactions-pattern[checks-effects-interactions pattern].
     */
    function sendValue(address payable recipient, uint256 amount) internal {
        require(address(this).balance >= amount, "Address: insufficient balance");

        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Address: unable to send value, recipient may have reverted");
    }
}