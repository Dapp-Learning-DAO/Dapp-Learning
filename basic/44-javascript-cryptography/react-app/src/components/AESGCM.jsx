// displays a page header
import { Menu, Row, Col } from "antd";
import { Form, Input, Button, Radio } from 'antd';
import React, { useState } from "react";

function strToArrayBuffer(str) {
    var buf = new ArrayBuffer(str.length * 2);
    var bufView = new Uint16Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}
//The function arrayBufferToString converts fixed-length raw binary data buffer to 16-bit unsigned String as our plaintext
function arrayBufferToString(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
}
//This object below will generate our algorithm key
var algoKeyGen = {
    name: "AES-GCM",
    length: 256,
};
//This will generate random values of 8-bit unsigned integer
var iv = window.crypto.getRandomValues(new Uint8Array(12));

//This object will generate our encryption algorithm
var algoEncrypt = {
    name: "AES-GCM",
    iv: iv,
    tagLength: 128,
};

//states that key usage is for encrypting and decrypting
var keyUsages = ["encrypt", "decrypt"];
var secretKey;

export default function AESGCM() {

    const [plainText, setPlainText] = useState();

    const [encryptedMessage, setEncryptedMessage] = useState();

    const [cipherText, setCipherText] = useState();

    const [decryptedMessage, setDecryptedMessage] = useState();


    return (
        <div>
            <Row style={{ justifyContent: "center", padding: '20px 0' }}>
                <Col span={8}>
                    <Form.Item label="Plain Text" tooltip="Please input plain text">
                        <Input placeholder="Original Message" value={plainText} onChange={(event) => {
                            setPlainText(event.target.value);
                        }} />
                    </Form.Item>
                </Col>
            </Row>

            <Row style={{ justifyContent: "center", padding: '20px 0' }}>
                <Col span={8}>
                    <Form.Item label="Cipher Text">
                        <Input placeholder="Cipher Message" value={encryptedMessage} disabled />
                    </Form.Item>
                </Col>
            </Row>

            <Row style={{ justifyContent: "center", padding: '20px 0' }}>
                <Col span={8}>
                    <Form.Item label="Decrypted Message">
                        <Input placeholder="Decrypted Message" value={decryptedMessage} disabled />
                    </Form.Item>
                </Col>
            </Row>

            <Row style={{ justifyContent: "center", padding: '20px 0' }}>
                <Col span={2}>
                    <Form.Item>
                        <Button type="primary" onClick={() => {
                            window.crypto.subtle
                                .generateKey(algoKeyGen, false, keyUsages)
                                .then(function (key) {
                                    secretKey = key;
                                    //Encrypt plaintext with key and algorithm converting the plaintext to ArrayBuffer
                                    return window.crypto.subtle.encrypt(
                                        algoEncrypt,
                                        key,
                                        strToArrayBuffer(plainText)
                                    );
                                })
                                .then(function (cipherTexted) {
                                    setCipherText(cipherTexted);
                                    //This prints out the ciphertext, converting it from ArrayBuffer to 16-bit unsigned String
                                    setEncryptedMessage(arrayBufferToString(cipherTexted));
                                    console.log("Cipher Text: " + arrayBufferToString(cipherTexted));
                                    //This will decrypt ciphertext with secret key and algorithm
                                })
                                .catch(function (err) {
                                    console.log("Error: " + err.message);
                                });
                        }}>
                            Encrypt
                        </Button>
                    </Form.Item>
                </Col>

                <Col span={2}>
                    <Form.Item>
                        <Button type="primary" onClick={() => {
                            window.crypto.subtle.decrypt(algoEncrypt, secretKey, cipherText)
                                .then(function (plainedText) {
                                    console.log("Plain Text: " + arrayBufferToString(plainedText));
                                    setDecryptedMessage(arrayBufferToString(plainedText));
                                })
                                .catch(function (err) {
                                    console.log("Error: " + err.message);
                                });

                        }}>
                            Decrypt
                        </Button>
                    </Form.Item>
                </Col>
            </Row>
        </div>
    );
}
