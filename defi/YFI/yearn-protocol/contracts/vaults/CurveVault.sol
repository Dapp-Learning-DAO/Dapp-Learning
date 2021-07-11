/**
 *Submitted for verification at Etherscan.io on 2020-11-05
 */

// SPDX-License-Identifier: MIT
pragma solidity ^0.5.17;

import "@openzeppelinV2/contracts/token/ERC20/IERC20.sol";
import "@openzeppelinV2/contracts/math/SafeMath.sol";

interface StrategyProxy {
    function lock() external;
}

interface FeeDistribution {
    function claim(address) external;
}

contract veCurveVault {
    using SafeMath for uint256;

    /// @notice EIP-20 token name for this token
    string public constant name = "veCRV-DAO yVault";

    /// @notice EIP-20 token symbol for this token
    string public constant symbol = "yveCRV-DAO";

    /// @notice EIP-20 token decimals for this token
    uint8 public constant decimals = 18;

    /// @notice Total number of tokens in circulation
    uint256 public totalSupply = 0; // Initial 0

    /// @notice A record of each accounts delegate
    mapping(address => address) public delegates;

    /// @notice A record of votes checkpoints for each account, by index
    mapping(address => mapping(uint32 => Checkpoint)) public checkpoints;

    /// @notice The number of checkpoints for each account
    mapping(address => uint32) public numCheckpoints;

    mapping(address => mapping(address => uint256)) internal allowances;
    mapping(address => uint256) internal balances;

    /// @notice The EIP-712 typehash for the contract's domain
    bytes32 public constant DOMAIN_TYPEHASH = keccak256("EIP712Domain(string name,uint chainId,address verifyingContract)");
    // NOTE: deployed code uses 0.6.12 with immutable,changing here for compatibility
    //  -> bytes32 public immutable DOMAINSEPARATOR;
    bytes32 public DOMAINSEPARATOR;

    /// @notice The EIP-712 typehash for the delegation struct used by the contract
    bytes32 public constant DELEGATION_TYPEHASH = keccak256("Delegation(address delegatee,uint nonce,uint expiry)");

    /// @notice The EIP-712 typehash for the permit struct used by the contract
    bytes32 public constant PERMIT_TYPEHASH = keccak256("Permit(address owner,address spender,uint value,uint nonce,uint deadline)");

    /// @notice A record of states for signing / validating signatures
    mapping(address => uint256) public nonces;

    /// @notice An event thats emitted when an account changes its delegate
    event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate);

    /// @notice An event thats emitted when a delegate account's vote balance changes
    event DelegateVotesChanged(address indexed delegate, uint256 previousBalance, uint256 newBalance);

    /// @notice A checkpoint for marking number of votes from a given block
    struct Checkpoint {
        uint32 fromBlock;
        uint256 votes;
    }

    /**
     * @notice Delegate votes from `msg.sender` to `delegatee`
     * @param delegatee The address to delegate votes to
     */
    function delegate(address delegatee) public {
        _delegate(msg.sender, delegatee);
    }

    /**
     * @notice Delegates votes from signatory to `delegatee`
     * @param delegatee The address to delegate votes to
     * @param nonce The contract state required to match the signature
     * @param expiry The time at which to expire the signature
     * @param v The recovery byte of the signature
     * @param r Half of the ECDSA signature pair
     * @param s Half of the ECDSA signature pair
     */
    function delegateBySig(
        address delegatee,
        uint256 nonce,
        uint256 expiry,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public {
        bytes32 structHash = keccak256(abi.encode(DELEGATION_TYPEHASH, delegatee, nonce, expiry));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAINSEPARATOR, structHash));
        address signatory = ecrecover(digest, v, r, s);
        require(signatory != address(0), "delegateBySig: sig");
        require(nonce == nonces[signatory]++, "delegateBySig: nonce");
        require(now <= expiry, "delegateBySig: expired");
        _delegate(signatory, delegatee);
    }

    /**
     * @notice Gets the current votes balance for `account`
     * @param account The address to get votes balance
     * @return The number of current votes for `account`
     */
    function getCurrentVotes(address account) external view returns (uint256) {
        uint32 nCheckpoints = numCheckpoints[account];
        return nCheckpoints > 0 ? checkpoints[account][nCheckpoints - 1].votes : 0;
    }

    /**
     * @notice Determine the prior number of votes for an account as of a block number
     * @dev Block number must be a finalized block or else this function will revert to prevent misinformation.
     * @param account The address of the account to check
     * @param blockNumber The block number to get the vote balance at
     * @return The number of votes the account had as of the given block
     */
    function getPriorVotes(address account, uint256 blockNumber) public view returns (uint256) {
        require(blockNumber < block.number, "getPriorVotes:");

        uint32 nCheckpoints = numCheckpoints[account];
        if (nCheckpoints == 0) {
            return 0;
        }

        // First check most recent balance
        if (checkpoints[account][nCheckpoints - 1].fromBlock <= blockNumber) {
            return checkpoints[account][nCheckpoints - 1].votes;
        }

        // Next check implicit zero balance
        if (checkpoints[account][0].fromBlock > blockNumber) {
            return 0;
        }

        uint32 lower = 0;
        uint32 upper = nCheckpoints - 1;
        while (upper > lower) {
            uint32 center = upper - (upper - lower) / 2; // ceil, avoiding overflow
            Checkpoint memory cp = checkpoints[account][center];
            if (cp.fromBlock == blockNumber) {
                return cp.votes;
            } else if (cp.fromBlock < blockNumber) {
                lower = center;
            } else {
                upper = center - 1;
            }
        }
        return checkpoints[account][lower].votes;
    }

    function _delegate(address delegator, address delegatee) internal {
        address currentDelegate = delegates[delegator];
        uint256 delegatorBalance = balances[delegator];
        delegates[delegator] = delegatee;

        emit DelegateChanged(delegator, currentDelegate, delegatee);

        _moveDelegates(currentDelegate, delegatee, delegatorBalance);
    }

    function _moveDelegates(
        address srcRep,
        address dstRep,
        uint256 amount
    ) internal {
        if (srcRep != dstRep && amount > 0) {
            if (srcRep != address(0)) {
                uint32 srcRepNum = numCheckpoints[srcRep];
                uint256 srcRepOld = srcRepNum > 0 ? checkpoints[srcRep][srcRepNum - 1].votes : 0;
                uint256 srcRepNew = srcRepOld.sub(amount, "_moveVotes: underflows");
                _writeCheckpoint(srcRep, srcRepNum, srcRepOld, srcRepNew);
            }

            if (dstRep != address(0)) {
                uint32 dstRepNum = numCheckpoints[dstRep];
                uint256 dstRepOld = dstRepNum > 0 ? checkpoints[dstRep][dstRepNum - 1].votes : 0;
                uint256 dstRepNew = dstRepOld.add(amount);
                _writeCheckpoint(dstRep, dstRepNum, dstRepOld, dstRepNew);
            }
        }
    }

    function _writeCheckpoint(
        address delegatee,
        uint32 nCheckpoints,
        uint256 oldVotes,
        uint256 newVotes
    ) internal {
        uint32 blockNumber = safe32(block.number, "_writeCheckpoint: 32 bits");

        if (nCheckpoints > 0 && checkpoints[delegatee][nCheckpoints - 1].fromBlock == blockNumber) {
            checkpoints[delegatee][nCheckpoints - 1].votes = newVotes;
        } else {
            checkpoints[delegatee][nCheckpoints] = Checkpoint(blockNumber, newVotes);
            numCheckpoints[delegatee] = nCheckpoints + 1;
        }

        emit DelegateVotesChanged(delegatee, oldVotes, newVotes);
    }

    function safe32(uint256 n, string memory errorMessage) internal pure returns (uint32) {
        require(n < 2**32, errorMessage);
        return uint32(n);
    }

    /// @notice The standard EIP-20 transfer event
    event Transfer(address indexed from, address indexed to, uint256 amount);

    /// @notice The standard EIP-20 approval event
    event Approval(address indexed owner, address indexed spender, uint256 amount);

    /// @notice governance address for the governance contract
    address public governance;
    address public pendingGovernance;

    IERC20 public constant CRV = IERC20(0xD533a949740bb3306d119CC777fa900bA034cd52);
    address public constant LOCK = address(0xF147b8125d2ef93FB6965Db97D6746952a133934);
    address public proxy = address(0x7A1848e7847F3f5FfB4d8e63BdB9569db535A4f0);
    address public feeDistribution;

    IERC20 public constant rewards = IERC20(0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490);

    uint256 public index = 0;
    uint256 public bal = 0;

    mapping(address => uint256) public supplyIndex;

    function update() external {
        _update();
    }

    function _update() internal {
        if (totalSupply > 0) {
            _claim();
            uint256 _bal = rewards.balanceOf(address(this));
            if (_bal > bal) {
                uint256 _diff = _bal.sub(bal, "veCRV::_update: bal _diff");
                if (_diff > 0) {
                    uint256 _ratio = _diff.mul(1e18).div(totalSupply);
                    if (_ratio > 0) {
                        index = index.add(_ratio);
                        bal = _bal;
                    }
                }
            }
        }
    }

    function _claim() internal {
        if (feeDistribution != address(0x0)) {
            FeeDistribution(feeDistribution).claim(address(this));
        }
    }

    function updateFor(address recipient) public {
        _update();
        uint256 _supplied = balances[recipient];
        if (_supplied > 0) {
            uint256 _supplyIndex = supplyIndex[recipient];
            supplyIndex[recipient] = index;
            uint256 _delta = index.sub(_supplyIndex, "veCRV::_claimFor: index delta");
            if (_delta > 0) {
                uint256 _share = _supplied.mul(_delta).div(1e18);
                claimable[recipient] = claimable[recipient].add(_share);
            }
        } else {
            supplyIndex[recipient] = index;
        }
    }

    mapping(address => uint256) public claimable;

    function claim() external {
        _claimFor(msg.sender);
    }

    function claimFor(address recipient) external {
        _claimFor(recipient);
    }

    function _claimFor(address recipient) internal {
        updateFor(recipient);
        rewards.transfer(recipient, claimable[recipient]);
        claimable[recipient] = 0;
        bal = rewards.balanceOf(address(this));
    }

    constructor() public {
        // Set governance for this token
        governance = msg.sender;
        DOMAINSEPARATOR = keccak256(abi.encode(DOMAIN_TYPEHASH, keccak256(bytes(name)), _getChainId(), address(this)));
    }

    function _mint(address dst, uint256 amount) internal {
        updateFor(dst);
        // mint the amount
        totalSupply = totalSupply.add(amount);
        // transfer the amount to the recipient
        balances[dst] = balances[dst].add(amount);
        emit Transfer(address(0), dst, amount);

        // move delegates
        _moveDelegates(address(0), delegates[dst], amount);
    }

    function depositAll() external {
        _deposit(CRV.balanceOf(msg.sender));
    }

    function deposit(uint256 _amount) external {
        _deposit(_amount);
    }

    function _deposit(uint256 _amount) internal {
        CRV.transferFrom(msg.sender, LOCK, _amount);
        _mint(msg.sender, _amount);
        StrategyProxy(proxy).lock();
    }

    function setProxy(address _proxy) external {
        require(msg.sender == governance, "setGovernance: !gov");
        proxy = _proxy;
    }

    function setFeeDistribution(address _feeDistribution) external {
        require(msg.sender == governance, "setGovernance: !gov");
        feeDistribution = _feeDistribution;
    }

    /**
     * @notice Allows governance to change governance (for future upgradability)
     * @param _governance new governance address to set
     */
    function setGovernance(address _governance) external {
        require(msg.sender == governance, "setGovernance: !gov");
        pendingGovernance = _governance;
    }

    /**
     * @notice Allows pendingGovernance to accept their role as governance (protection pattern)
     */
    function acceptGovernance() external {
        require(msg.sender == pendingGovernance, "acceptGovernance: !pendingGov");
        governance = pendingGovernance;
    }

    /**
     * @notice Get the number of tokens `spender` is approved to spend on behalf of `account`
     * @param account The address of the account holding the funds
     * @param spender The address of the account spending the funds
     * @return The number of tokens approved
     */
    function allowance(address account, address spender) external view returns (uint256) {
        return allowances[account][spender];
    }

    /**
     * @notice Approve `spender` to transfer up to `amount` from `src`
     * @dev This will overwrite the approval amount for `spender`
     *  and is subject to issues noted [here](https://eips.ethereum.org/EIPS/eip-20#approve)
     * @param spender The address of the account which may transfer tokens
     * @param amount The number of tokens that are approved (2^256-1 means infinite)
     * @return Whether or not the approval succeeded
     */
    function approve(address spender, uint256 amount) external returns (bool) {
        allowances[msg.sender][spender] = amount;

        emit Approval(msg.sender, spender, amount);
        return true;
    }

    /**
     * @notice Triggers an approval from owner to spends
     * @param owner The address to approve from
     * @param spender The address to be approved
     * @param amount The number of tokens that are approved (2^256-1 means infinite)
     * @param deadline The time at which to expire the signature
     * @param v The recovery byte of the signature
     * @param r Half of the ECDSA signature pair
     * @param s Half of the ECDSA signature pair
     */
    function permit(
        address owner,
        address spender,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        bytes32 structHash = keccak256(abi.encode(PERMIT_TYPEHASH, owner, spender, amount, nonces[owner]++, deadline));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAINSEPARATOR, structHash));
        address signatory = ecrecover(digest, v, r, s);
        require(signatory != address(0), "permit: signature");
        require(signatory == owner, "permit: unauthorized");
        require(now <= deadline, "permit: expired");

        allowances[owner][spender] = amount;

        emit Approval(owner, spender, amount);
    }

    /**
     * @notice Get the number of tokens held by the `account`
     * @param account The address of the account to get the balance of
     * @return The number of tokens held
     */
    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }

    /**
     * @notice Transfer `amount` tokens from `msg.sender` to `dst`
     * @param dst The address of the destination account
     * @param amount The number of tokens to transfer
     * @return Whether or not the transfer succeeded
     */
    function transfer(address dst, uint256 amount) external returns (bool) {
        _transferTokens(msg.sender, dst, amount);
        return true;
    }

    /**
     * @notice Transfer `amount` tokens from `src` to `dst`
     * @param src The address of the source account
     * @param dst The address of the destination account
     * @param amount The number of tokens to transfer
     * @return Whether or not the transfer succeeded
     */
    function transferFrom(
        address src,
        address dst,
        uint256 amount
    ) external returns (bool) {
        address spender = msg.sender;
        uint256 spenderAllowance = allowances[src][spender];

        if (spender != src && spenderAllowance != uint256(-1)) {
            uint256 newAllowance = spenderAllowance.sub(amount, "transferFrom: exceeds spender allowance");
            allowances[src][spender] = newAllowance;

            emit Approval(src, spender, newAllowance);
        }

        _transferTokens(src, dst, amount);
        return true;
    }

    function _transferTokens(
        address src,
        address dst,
        uint256 amount
    ) internal {
        require(src != address(0), "_transferTokens: zero address");
        require(dst != address(0), "_transferTokens: zero address");

        updateFor(src);
        updateFor(dst);

        balances[src] = balances[src].sub(amount, "_transferTokens: exceeds balance");
        balances[dst] = balances[dst].add(amount);
        emit Transfer(src, dst, amount);
    }

    function _getChainId() internal pure returns (uint256) {
        uint256 chainId;
        assembly {
            chainId := chainid()
        }
        return chainId;
    }
}
