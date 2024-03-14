// SPDX-License-Identifier: GPL-3.0-only

pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./interfaces/IWETH.sol";
import "./libraries/PbPool.sol";
import "./safeguard/Pauser.sol";
import "./safeguard/VolumeControl.sol";
import "./safeguard/DelayedTransfer.sol";
import "./Signers.sol";

/**
 * @title Liquidity pool functions for {Bridge}.
 */
contract Pool is Signers, ReentrancyGuard, Pauser, VolumeControl, DelayedTransfer {
    using SafeERC20 for IERC20;

    uint64 public addseq; // ensure unique LiquidityAdded event, start from 1
    mapping(address => uint256) public minAdd; // add _amount must > minAdd

    // map of successful withdraws, if true means already withdrew money or added to delayedTransfers
    mapping(bytes32 => bool) public withdraws;

    // erc20 wrap of gas token of this chain, eg. WETH, when relay ie. pay out,
    // if request.token equals this, will withdraw and send native token to receiver
    // note we don't check whether it's zero address. when this isn't set, and request.token
    // is all 0 address, guarantee fail
    address public nativeWrap;

    // when transfer native token after wrap, use this gas used config.
    uint256 public nativeTokenTransferGas = 50000;

    // liquidity events
    event LiquidityAdded(
        uint64 seqnum,
        address provider,
        address token,
        uint256 amount // how many tokens were added
    );
    event WithdrawDone(
        bytes32 withdrawId,
        uint64 seqnum,
        address receiver,
        address token,
        uint256 amount,
        bytes32 refid
    );
    event MinAddUpdated(address token, uint256 amount);

    /**
     * @notice Add liquidity to the pool-based bridge.
     * NOTE: This function DOES NOT SUPPORT fee-on-transfer / rebasing tokens.
     * @param _token The address of the token.
     * @param _amount The amount to add.
     */
    function addLiquidity(address _token, uint256 _amount) external nonReentrant whenNotPaused {
        require(_amount > minAdd[_token], "amount too small");
        addseq += 1;
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        emit LiquidityAdded(addseq, msg.sender, _token, _amount);
    }

    /**
     * @notice Add native token liquidity to the pool-based bridge.
     * @param _amount The amount to add.
     */
    function addNativeLiquidity(uint256 _amount) external payable nonReentrant whenNotPaused {
        require(msg.value == _amount, "Amount mismatch");
        require(nativeWrap != address(0), "Native wrap not set");
        require(_amount > minAdd[nativeWrap], "amount too small");
        addseq += 1;
        IWETH(nativeWrap).deposit{value: _amount}();
        emit LiquidityAdded(addseq, msg.sender, nativeWrap, _amount);
    }

    /**
     * @notice Withdraw funds from the bridge pool.
     * @param _wdmsg The serialized Withdraw protobuf.
     * @param _sigs The list of signatures sorted by signing addresses in ascending order. A withdrawal must be
     * signed-off by +2/3 of the bridge's current signing power to be delivered.
     * @param _signers The sorted list of signers.
     * @param _powers The signing powers of the signers.
     */
    function withdraw(
        bytes calldata _wdmsg,
        bytes[] calldata _sigs,
        address[] calldata _signers,
        uint256[] calldata _powers
    ) external whenNotPaused {
        bytes32 domain = keccak256(abi.encodePacked(block.chainid, address(this), "WithdrawMsg"));
        verifySigs(abi.encodePacked(domain, _wdmsg), _sigs, _signers, _powers);
        // decode and check wdmsg
        PbPool.WithdrawMsg memory wdmsg = PbPool.decWithdrawMsg(_wdmsg);
        // len = 8 + 8 + 20 + 20 + 32 = 88
        bytes32 wdId = keccak256(
            abi.encodePacked(wdmsg.chainid, wdmsg.seqnum, wdmsg.receiver, wdmsg.token, wdmsg.amount)
        );
        require(withdraws[wdId] == false, "withdraw already succeeded");
        withdraws[wdId] = true;
        _updateVolume(wdmsg.token, wdmsg.amount);
        uint256 delayThreshold = delayThresholds[wdmsg.token];
        if (delayThreshold > 0 && wdmsg.amount > delayThreshold) {
            _addDelayedTransfer(wdId, wdmsg.receiver, wdmsg.token, wdmsg.amount);
        } else {
            _sendToken(wdmsg.receiver, wdmsg.token, wdmsg.amount);
        }
        emit WithdrawDone(wdId, wdmsg.seqnum, wdmsg.receiver, wdmsg.token, wdmsg.amount, wdmsg.refid);
    }

    function executeDelayedTransfer(bytes32 id) external whenNotPaused {
        delayedTransfer memory transfer = _executeDelayedTransfer(id);
        _sendToken(transfer.receiver, transfer.token, transfer.amount);
    }

    function setMinAdd(address[] calldata _tokens, uint256[] calldata _amounts) external onlyGovernor {
        require(_tokens.length == _amounts.length, "length mismatch");
        for (uint256 i = 0; i < _tokens.length; i++) {
            minAdd[_tokens[i]] = _amounts[i];
            emit MinAddUpdated(_tokens[i], _amounts[i]);
        }
    }

    function _sendToken(
        address _receiver,
        address _token,
        uint256 _amount
    ) internal {
        if (_token == nativeWrap) {
            // withdraw then transfer native to receiver
            IWETH(nativeWrap).withdraw(_amount);
            (bool sent, ) = _receiver.call{value: _amount, gas: nativeTokenTransferGas}("");
            require(sent, "failed to send native token");
        } else {
            IERC20(_token).safeTransfer(_receiver, _amount);
        }
    }

    // set nativeWrap, for relay requests, if token == nativeWrap, will withdraw first then transfer native to receiver
    function setWrap(address _weth) external onlyOwner {
        nativeWrap = _weth;
    }

    // setNativeTransferGasUsed, native transfer will use this config.
    function setNativeTokenTransferGas(uint256 _gasUsed) external onlyGovernor {
        nativeTokenTransferGas = _gasUsed;
    }
}