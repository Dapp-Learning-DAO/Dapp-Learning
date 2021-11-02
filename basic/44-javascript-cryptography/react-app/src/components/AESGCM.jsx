// displays a page header
import { Menu, Row, Col } from "antd";
import { Form, Input, Button, Radio } from 'antd';
import React, { useState } from "react";

export default function AESGCM() {

    const [plainText, setPlainText] = useState();

    const [encryptMessage, setEncryptMessage] = useState();

    const [cipherText, setCipherText] = useState();

    const [privateKey, setPrivateKey] = useState();

    const [decryptedMessage, setDecryptedMessage] = useState();

    /*The function strToArrayBuffer converts string to fixed-length raw binary data buffer because 
    encrypt method must return a Promise that fulfills with an ArrayBuffer containing the "ciphertext"*/
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

    var keyUsages = ["encrypt", "decrypt"];
    let secretKey;

    return (
        <div>
            <Row style={{ justifyContent: "center", padding: '20px 0' }}>
                <Col span={8}>
                    <Form.Item label="Plain Text" tooltip="Please input plain text">
                        <Input placeholder="Original Message" value={plainText} onChange={(event) => {
                            setPlainText(event.target.value);
                            console.log(event.target.value);
                        }} />
                    </Form.Item>
                </Col>
            </Row>

            <Row style={{ justifyContent: "center", padding: '20px 0' }}>
                <Col span={8}>
                    <Form.Item label="Cipher Text">
                        <Input placeholder="Cipher Message" value={encryptMessage} disabled="true" />
                    </Form.Item>
                </Col>
            </Row>

            <Row style={{ justifyContent: "center", padding: '20px 0' }}>
                <Col span={8}>
                    <Form.Item label="Decrypted Message">
                        <Input placeholder="Decrypted Message" value={decryptedMessage} disabled="true" />
                    </Form.Item>
                </Col>
            </Row>

            <Row style={{ justifyContent: "center", padding: '20px 0' }}>
                <Col span={2}>
                    <Form.Item>
                        <Button type="primary" onClick={() => {
                            //This generates our secret Key with key generation algorithm
                            window.crypto.subtle
                                .generateKey(algoKeyGen, false, keyUsages)
                                .then(function (key) {
                                    setPrivateKey(key);
                                    secretKey = key;
                                    console.log("key====",key)
                                    //Encrypt plaintext with key and algorithm converting the plaintext to ArrayBuffer
                                    return window.crypto.subtle.encrypt(
                                        algoEncrypt,
                                        key,
                                        strToArrayBuffer(plainText)
                                    );
                                })
                                .then(function (cipheredText) {
                                    //print out Ciphertext in console
                                    setEncryptMessage(arrayBufferToString(cipheredText));
                                    setCipherText(cipheredText);
                                    return window.crypto.subtle.decrypt(algoEncrypt, secretKey, cipheredText)
                                })
                                .then(function (plainedText) {
                                    console.log("Plain Text: " + arrayBufferToString(plainedText));
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
                            //This will decrypt Cipheretext to plaintext
                            window.crypto.subtle.decrypt(algoEncrypt, privateKey, cipherText)
                            .then(function (decryptedText) {
                                setDecryptedMessage(arrayBufferToString(decryptedText));
                              })
                              .catch(function (err) {
                                console.log("Error: 111" + err.message);
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
