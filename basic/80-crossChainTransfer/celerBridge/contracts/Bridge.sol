// SPDX-License-Identifier: GPL-3.0-only

pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./libraries/PbBridge.sol";
import "./Pool.sol";

/**
 * @title The liquidity-pool based bridge.
 */
contract Bridge is Pool {
    using SafeERC20 for IERC20;

    // liquidity events
    event Send(
        bytes32 transferId,
        address sender,
        address receiver,
        address token,
        uint256 amount,
        uint64 dstChainId,
        uint64 nonce,
        uint32 maxSlippage
    );
    event Relay(
        bytes32 transferId,
        address sender,
        address receiver,
        address token,
        uint256 amount,
        uint64 srcChainId,
        bytes32 srcTransferId
    );
    // gov events
    event MinSendUpdated(address token, uint256 amount);
    event MaxSendUpdated(address token, uint256 amount);

    mapping(bytes32 => bool) public transfers;
    mapping(address => uint256) public minSend; // send _amount must > minSend
    mapping(address => uint256) public maxSend;

    // min allowed max slippage uint32 value is slippage * 1M, eg. 0.5% -> 5000
    uint32 public minimalMaxSlippage;

    /**
     * @notice Send a cross-chain transfer via the liquidity pool-based bridge.
     * NOTE: This function DOES NOT SUPPORT fee-on-transfer / rebasing tokens.
     * @param _receiver The address of the receiver.
     * @param _token The address of the token.
     * @param _amount The amount of the transfer.
     * @param _dstChainId The destination chain ID.
     * @param _nonce A number input to guarantee uniqueness of transferId. Can be timestamp in practice.
     * @param _maxSlippage The max slippage accepted, given as percentage in point (pip). Eg. 5000 means 0.5%.
     * Must be greater than minimalMaxSlippage. Receiver is guaranteed to receive at least (100% - max slippage percentage) * amount or the
     * transfer can be refunded.
     */
    function send(
        address _receiver,
        address _token,
        uint256 _amount,
        uint64 _dstChainId,
        uint64 _nonce,
        uint32 _maxSlippage // slippage * 1M, eg. 0.5% -> 5000
    ) external nonReentrant whenNotPaused {
        bytes32 transferId = _send(_receiver, _token, _amount, _dstChainId, _nonce, _maxSlippage);
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        emit Send(transferId, msg.sender, _receiver, _token, _amount, _dstChainId, _nonce, _maxSlippage);
    }

    /**
     * @notice Send a cross-chain transfer via the liquidity pool-based bridge using the native token.
     * @param _receiver The address of the receiver.
     * @param _amount The amount of the transfer.
     * @param _dstChainId The destination chain ID.
     * @param _nonce A unique number. Can be timestamp in practice.
     * @param _maxSlippage The max slippage accepted, given as percentage in point (pip). Eg. 5000 means 0.5%.
     * Must be greater than minimalMaxSlippage. Receiver is guaranteed to receive at least (100% - max slippage percentage) * amount or the
     * transfer can be refunded.
     */
    function sendNative(
        address _receiver,
        uint256 _amount,
        uint64 _dstChainId,
        uint64 _nonce,
        uint32 _maxSlippage
    ) external payable nonReentrant whenNotPaused {
        require(msg.value == _amount, "Amount mismatch");
        require(nativeWrap != address(0), "Native wrap not set");
        bytes32 transferId = _send(_receiver, nativeWrap, _amount, _dstChainId, _nonce, _maxSlippage);
        IWETH(nativeWrap).deposit{value: _amount}();
        emit Send(transferId, msg.sender, _receiver, nativeWrap, _amount, _dstChainId, _nonce, _maxSlippage);
    }

    function _send(
        address _receiver,
        address _token,
        uint256 _amount,
        uint64 _dstChainId,
        uint64 _nonce,
        uint32 _maxSlippage
    ) private returns (bytes32) {
        require(_amount > minSend[_token], "amount too small");
        require(maxSend[_token] == 0 || _amount <= maxSend[_token], "amount too large");
        require(_maxSlippage > minimalMaxSlippage, "max slippage too small");
        bytes32 transferId = keccak256(
            // uint64(block.chainid) for consistency as entire system uses uint64 for chain id
            // len = 20 + 20 + 20 + 32 + 8 + 8 + 8 = 116
            abi.encodePacked(msg.sender, _receiver, _token, _amount, _dstChainId, _nonce, uint64(block.chainid))
        );
        require(transfers[transferId] == false, "transfer exists");
        transfers[transferId] = true;
        return transferId;
    }

    /**
     * @notice Relay a cross-chain transfer sent from a liquidity pool-based bridge on another chain.
     * @param _relayRequest The serialized Relay protobuf.
     * @param _sigs The list of signatures sorted by signing addresses in ascending order. A relay must be signed-off by
     * +2/3 of the bridge's current signing power to be delivered.
     * @param _signers The sorted list of signers.
     * @param _powers The signing powers of the signers.
     */
    function relay(
        bytes calldata _relayRequest,
        bytes[] calldata _sigs,
        address[] calldata _signers,
        uint256[] calldata _powers
    ) external whenNotPaused {
        bytes32 domain = keccak256(abi.encodePacked(block.chainid, address(this), "Relay"));
        verifySigs(abi.encodePacked(domain, _relayRequest), _sigs, _signers, _powers);
        PbBridge.Relay memory request = PbBridge.decRelay(_relayRequest);
        // len = 20 + 20 + 20 + 32 + 8 + 8 + 32 = 140
        bytes32 transferId = keccak256(
            abi.encodePacked(
                request.sender,
                request.receiver,
                request.token,
                request.amount,
                request.srcChainId,
                request.dstChainId,
                request.srcTransferId
            )
        );
        require(transfers[transferId] == false, "transfer exists");
        transfers[transferId] = true;
        _updateVolume(request.token, request.amount);
        uint256 delayThreshold = delayThresholds[request.token];
        if (delayThreshold > 0 && request.amount > delayThreshold) {
            _addDelayedTransfer(transferId, request.receiver, request.token, request.amount);
        } else {
            _sendToken(request.receiver, request.token, request.amount);
        }

        emit Relay(
            transferId,
            request.sender,
            request.receiver,
            request.token,
            request.amount,
            request.srcChainId,
            request.srcTransferId
        );
    }

    function setMinSend(address[] calldata _tokens, uint256[] calldata _amounts) external onlyGovernor {
        require(_tokens.length == _amounts.length, "length mismatch");
        for (uint256 i = 0; i < _tokens.length; i++) {
            minSend[_tokens[i]] = _amounts[i];
            emit MinSendUpdated(_tokens[i], _amounts[i]);
        }
    }

    function setMaxSend(address[] calldata _tokens, uint256[] calldata _amounts) external onlyGovernor {
        require(_tokens.length == _amounts.length, "length mismatch");
        for (uint256 i = 0; i < _tokens.length; i++) {
            maxSend[_tokens[i]] = _amounts[i];
            emit MaxSendUpdated(_tokens[i], _amounts[i]);
        }
    }

    function setMinimalMaxSlippage(uint32 _minimalMaxSlippage) external onlyGovernor {
        minimalMaxSlippage = _minimalMaxSlippage;
    }

    // This is needed to receive ETH when calling `IWETH.withdraw`
    receive() external payable {}
}