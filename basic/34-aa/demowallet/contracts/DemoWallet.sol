pragma solidity ^0.8.13;

import "./aa/IAccount.sol";
import "/aa/UserOperation.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DemoWallet is Ownable, IWallet{

    using UserOperationLib for UserOperation;
    enum CallType {CALL, DELEGATECALL}

    address payable private entryPoint;
    uint8 public threshold;
    uint256 public nonce;
    uint256 private constant SIG_VALIDATION_FAILED = 1;
    
    mapping(address=>bool) public signers;

    constructor(address payable _entryPoint, uint8 _threshold) {
        entryPoint = _entryPoint;
        threshold = _threshold;
    }
    
    function validateUserOp(UserOperation calldata userOp, bytes32 requestId, address aggregator, uint256 missingWalletFunds)
    external returns (uint256 deadline) {
        _requireFromEntrypoint();
        require(userOp.nonce == nonce, "Invalid nonce");
        bytes32 expectedUserOpHash = keccak256(abi.encode(userOp.hash(), address(entryPoint), block.chainid));
        require(requestId == expectedUserOpHash, "Invalid request id");
    
        bytes calldata signatures = userOp.signature;    
        if (signature.length != 85*uint256(threshold)) {
            return SIG_VALIDATION_FAILED;
        }
        for (uint256 i=0;i<threshold;i++) {
            try _slash(signatures, i) returns (bytes memory sig, address signer){
                require(signers[signer], "Invalid signer");
                require(SignatureChecker.isValidSignatureNow(signer, requestId, sig), "Invalid signature");
            }
            catch {
                return SIG_VALIDATION_FAILED;
            }
        }

        if (missingAccountFunds != 0){
            (bool success,) = entryPoint.call{value: missingAccountFunds}();
            require(success, "Depositing failed");
        }
        nonce++;
        return 0;
    }
    
    function execute(address to, CallType callType, bytes calldata data, uint256 value) external {
        _requireFromEntrypoint();
        if (callType == CallType.CALL) {
            (bool success, ) = to.call{value:value}(data);
            require(success, "Call failed");
        } else if(callType == CallType.DELEGATECALL){
            (bool success, ) = to.delegatecall{value:value}(data);
            require(success, "Delegate call failed");
        } else{
            revert("Invalid target address");
        }
    }

    function _requireFromEntrypoint() internal view {
        require(msg.sender == entryPoint, "Only entrypoint can call");
    }

    //signer(20bytes) + signature(65bytes)
    function _slash(bytes calldata signatures, uint256 i) internal pure returns(bytes memory signature, address signer) {
        uint256 skiped = 85*i;
        assembly {
            ofs := add(signatures.offset, skiped)
            signer := calldataload(sub(ofs, 12))
            signature := mload(0x40)
            mstore(0x40, add(signature, add(32, 65)))
            mstore(signature, 65)
            calldatacopy(add(signature, 32), add(ofs, 20), 65)
        }
    }

    receive() external payable {
        
    }

    function withdraw(address payable receiver, uint256 amount) external onlyOwner {
        require(amount > 0, "Invalid amount");
        (bool success,) = receiver.call{value:amount}();
        require(success, "transfer failed");
    }
}