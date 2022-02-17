// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {IDetailedERC20} from "./interfaces/IDetailedERC20.sol";

/// @title AlToken
///
/// @dev This is the contract for the Alchemix utillity token usd.
///
/// Initially, the contract deployer is given both the admin and minter role. This allows them to pre-mine tokens,
/// transfer admin to a timelock contract, and lastly, grant the staking pools the minter role. After this is done,
/// the deployer must revoke their admin role and minter role.
contract AlToken is AccessControl, ERC20("Alchemix USD", "alUSD") {
  using SafeERC20 for ERC20;

  /// @dev The identifier of the role which maintains other roles.
  bytes32 public constant ADMIN_ROLE = keccak256("ADMIN");

  /// @dev The identifier of the role which allows accounts to mint tokens.
  bytes32 public constant SENTINEL_ROLE = keccak256("SENTINEL");
  
  /// @dev addresses whitelisted for minting new tokens
  mapping (address => bool) public whiteList;
  
  /// @dev addresses blacklisted for minting new tokens
  mapping (address => bool) public blacklist;

  /// @dev addresses paused for minting new tokens
  mapping (address => bool) public paused;

  /// @dev ceiling per address for minting new tokens
  mapping (address => uint256) public ceiling;

  /// @dev already minted amount per address to track the ceiling
  mapping (address => uint256) public hasMinted;

  event Paused(address alchemistAddress, bool isPaused);
  
  constructor() public {
    _setupRole(ADMIN_ROLE, msg.sender);
    _setupRole(SENTINEL_ROLE, msg.sender);
    _setRoleAdmin(SENTINEL_ROLE,ADMIN_ROLE);
    _setRoleAdmin(ADMIN_ROLE,ADMIN_ROLE);
  }

  /// @dev A modifier which checks if whitelisted for minting.
  modifier onlyWhitelisted() {
    require(whiteList[msg.sender], "AlUSD: Alchemist is not whitelisted");
    _;
  }

  /// @dev Mints tokens to a recipient.
  ///
  /// This function reverts if the caller does not have the minter role.
  ///
  /// @param _recipient the account to mint tokens to.
  /// @param _amount    the amount of tokens to mint.
  function mint(address _recipient, uint256 _amount) external onlyWhitelisted {
    require(!blacklist[msg.sender], "AlUSD: Alchemist is blacklisted.");
    uint256 _total = _amount.add(hasMinted[msg.sender]);
    require(_total <= ceiling[msg.sender],"AlUSD: Alchemist's ceiling was breached.");
    require(!paused[msg.sender], "AlUSD: user is currently paused.");
    hasMinted[msg.sender] = hasMinted[msg.sender].add(_amount);
    _mint(_recipient, _amount);
  }
  /// This function reverts if the caller does not have the admin role.
  ///
  /// @param _toWhitelist the account to mint tokens to.
  /// @param _state the whitelist state.

  function setWhitelist(address _toWhitelist, bool _state) external onlyAdmin {
    whiteList[_toWhitelist] = _state;
  }
  /// This function reverts if the caller does not have the admin role.
  ///
  /// @param _newSentinel the account to set as sentinel.

  function setSentinel(address _newSentinel) external onlyAdmin {
    _setupRole(SENTINEL_ROLE, _newSentinel);
  }
  /// This function reverts if the caller does not have the admin role.
  ///
  /// @param _toBlacklist the account to mint tokens to.
  function setBlacklist(address _toBlacklist) external onlySentinel {
    blacklist[_toBlacklist] = true;
  }
  /// This function reverts if the caller does not have the admin role.
  function pauseAlchemist(address _toPause, bool _state) external onlySentinel {
    paused[_toPause] = _state;
    Paused(_toPause, _state);
  }
  /// This function reverts if the caller does not have the admin role.
  ///
  /// @param _toSetCeiling the account set the ceiling off.
  /// @param _ceiling the max amount of tokens the account is allowed to mint.
  function setCeiling(address _toSetCeiling, uint256 _ceiling) external onlyAdmin {
    ceiling[_toSetCeiling] = _ceiling;
  }
   /// @dev A modifier which checks that the caller has the admin role.
  modifier onlyAdmin() {
    require(hasRole(ADMIN_ROLE, msg.sender), "only admin");
    _;
  }
  /// @dev A modifier which checks that the caller has the sentinel role.
  modifier onlySentinel() {
    require(hasRole(SENTINEL_ROLE, msg.sender), "only sentinel");
    _;
  }
  /**
     * @dev Destroys `amount` tokens from the caller.
     *
     * See {ERC20-_burn}.
     */
    function burn(uint256 amount) public virtual {
        _burn(_msgSender(), amount);
    }

    /**
     * @dev Destroys `amount` tokens from `account`, deducting from the caller's
     * allowance.
     *
     * See {ERC20-_burn} and {ERC20-allowance}.
     *
     * Requirements:
     *
     * - the caller must have allowance for ``accounts``'s tokens of at least
     * `amount`.
     */
    function burnFrom(address account, uint256 amount) public virtual {
        uint256 decreasedAllowance = allowance(account, _msgSender()).sub(amount, "ERC20: burn amount exceeds allowance");

        _approve(account, _msgSender(), decreasedAllowance);
        _burn(account, amount);
    }
    /**
     * @dev lowers hasminted from the caller's allocation
     *
     */
    function lowerHasMinted( uint256 amount) public onlyWhitelisted {
        hasMinted[msg.sender] = hasMinted[msg.sender].sub(amount);
    }
}