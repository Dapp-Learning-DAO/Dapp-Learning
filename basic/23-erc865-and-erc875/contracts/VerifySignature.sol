// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';
import '@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol';
import 'hardhat/console.sol';

contract VerifySignature is EIP712 {
    using ECDSA for bytes32;

    // domain version
    constructor() EIP712('Ether Mail', '1') {}

    function getMessageHash(string memory _message) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_message));
    }

    function getEthSignedMessageHash(bytes32 _messageHash) public pure returns (bytes32) {
        /*
        Signature is produced by signing a keccak256 hash with the following format:
        "\x19Ethereum Signed Message\n" + len(msg) + msg
        */
        return keccak256(abi.encodePacked('\x19Ethereum Signed Message:\n32', _messageHash));
    }

    /* 4. Verify signature
     *  message = "coffee and donuts"
     *  signature =
        0x993dab3dd91f5c6dc28e17439be475478f5635c92a56e17e82349d3fb2f166196f466c0b4e0c146f285204f0dcb13e5ae67bc33f4b888ec32dfe0a063e8f3f781b
    */

    function verify(string memory _message, bytes memory signature) public pure returns (address) {
        // 1、先生成hash
        bytes32 messageHash = getMessageHash(_message);

        // 2、生成一个eth signed 的hash
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);

        // 3、从hash里计算出signer
        // return recoverSigner(ethSignedMessageHash, signature);
        return ECDSA.recover(ethSignedMessageHash, signature);
    }

    function verify2(bytes32 _hash, bytes memory _signature) public pure returns (address) {
        return _hash.toEthSignedMessageHash().recover(_signature);
    }

    /**
         Person: [
          { name: 'name', type: 'string' },
          { name: 'wallet', type: 'address' },
        ],
        Mail: [
          { name: 'from', type: 'Person' },
          { name: 'to', type: 'Person' },
          { name: 'contents', type: 'string' },
        ],
      */
    struct Person {
        string name;
        address wallet;
    }

    struct Mail {
        Person from;
        Person to;
        string contents;
    }

    bytes32 constant MAIL_TYPE_HASH = keccak256('Mail(Person from,Person to,string contents)Person(string name,address wallet)');
    bytes32 constant PERSON_TYPE_HASH = keccak256('Person(string name,address wallet)');

    function hash(Person calldata person) internal view returns (bytes32) {
        return keccak256(abi.encode(PERSON_TYPE_HASH, keccak256(bytes(person.name)), person.wallet));
    }

    function hash(Mail calldata mail) internal view returns (bytes32) {
        return keccak256(abi.encode(MAIL_TYPE_HASH, hash(mail.from), hash(mail.to), keccak256(bytes(mail.contents))));
    }

    function verify3(Mail calldata mail, bytes memory _signature) public view returns (address) {
        bytes32 structHash = hash(mail);
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, _signature);
        return signer;
    }

    struct Message {
        string[] data;
    }

    // struct PersonV2 {
    //     string name;
    //     address[] wallet;
    // }

    // struct MailV2 {
    //     PersonV2 from;
    //     PersonV2[] to;
    //     string contents;
    // }

    // bytes32 constant MAIL_V2_TYPE_HASH = keccak256('MailV2(PersonV2 from,PersonV2[] to,string contents)PersonV2(string name,address[] wallet)');
    // bytes32 constant PERSON_V2_TYPE_HASH = keccak256('PersonV2(string name,address[] wallet)');
    bytes32 constant Message_TYPE_HASH = keccak256('Message(string[] data)');

    // function hash(MailV2 calldata mail) internal view returns (bytes32) {
    //     //  如何计算数组的keccak256？
    //     bytes32[] storage temp;
    //     for (uint256 i = 0; i < mail.to.length; i++) {
    //         // temp[i] = hash[mail.to[i]];
    //     }
    //     return
    //         keccak256(
    //             abi.encode(
    //                 MAIL_V2_TYPE_HASH,
    //                 // hash(mail.from),
    //                 // hash(mail.to),
    //                 keccak256(bytes(mail.contents))
    //             )
    //         );
    // }

    function hash(Message calldata message) internal view returns (bytes32) {
        bytes32[] memory keccakData = new bytes32[](message.data.length);
        for (uint256 i = 0; i < message.data.length; i++) {
            keccakData[i] = keccak256(bytes(message.data[i]));
        }
        bytes32 computedHash5 = keccak256(abi.encodePacked(keccakData));
        return keccak256(abi.encode(Message_TYPE_HASH, computedHash5));
    }

    function verify4(Message calldata message, bytes memory _signature) public view returns (address) {
        console.log(message.data.length);
        bytes32 structHash = hash(message);
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, _signature);
        return signer;
    }

    function recoverSigner(bytes32 _ethSignedMessageHash, bytes memory _signature) public pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);
        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    function splitSignature(bytes memory sig)
        public
        pure
        returns (
            bytes32 r,
            bytes32 s,
            uint8 v
        )
    {
        require(sig.length == 65, 'invalid signature length');

        assembly {
            /*
            First 32 bytes stores the length of the signature
            add(sig, 32) = pointer of sig + 32
            effectively, skips first 32 bytes of signature
            mload(p) loads next 32 bytes starting at the memory address p into memory
            */

            // first 32 bytes, after the length prefix
            r := mload(add(sig, 32))
            // second 32 bytes
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(sig, 96)))
        }
        // implicitly return (r, s, v)
    }
}
