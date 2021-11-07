// displays a page header
import { Menu, Row, Col } from "antd";
import { Form, Input, Button, Radio } from 'antd';
import React, { useState } from "react";
var crypto = require('crypto');

var alice = crypto.createECDH('secp256k1');

var bob = crypto.createECDH('secp256k1');

alice.generateKeys();
bob.generateKeys();

export default function ECDH() {

    const [alicePublicKey, setAlicePublicKey] = useState();

    const [bobPublicKey, setBobPublicKey] = useState();

    const [verifyResult, setVerifyResult] = useState();

    return (
        <div>

            <Row style={{ justifyContent: "center", padding: '20px 0' }}>
                <Col span={8}>
                    <Form.Item label="Alice Public Key" >
                        <Input placeholder="" value={alicePublicKey} disabled />
                    </Form.Item>
                </Col>
            </Row>

            <Row style={{ justifyContent: "center", padding: '20px 0' }}>
                <Col span={8}>
                    <Form.Item label="Bob Public Key" >
                        <Input placeholder="" value={bobPublicKey} disabled />
                    </Form.Item>
                </Col>
            </Row>

            <Row style={{ justifyContent: "center", padding: '20px 0' }}>
                <Col span={8}>
                    <Form.Item label="Verify Result" >
                        <Input placeholder="" value={verifyResult} disabled />
                    </Form.Item>
                </Col>
            </Row>


            <Row style={{ justifyContent: "center", padding: '20px 0' }}>
                <Col span={4}>
                    <Form.Item>
                        <Button type="primary" onClick={() => {
                            setAlicePublicKey(alice.getPublicKey());
                        }}>
                            Generate Alice Public Key
                        </Button>
                    </Form.Item>
                </Col>

                <Col span={4}>
                    <Form.Item>
                        <Button type="primary" onClick={() => {
                            setBobPublicKey(bob.getPublicKey());
                        }}>
                            Generate Bob Public Key
                        </Button>
                    </Form.Item>
                </Col>

                <Col span={4}>
                    <Form.Item>
                        <Button type="primary" onClick={() => {
                            //Compute common key
                            var alice_secret = alice.computeSecret(bob.getPublicKey(), null, 'hex');
                            var bob_secret = bob.computeSecret(alice.getPublicKey(), null, 'hex');
                            setVerifyResult(alice_secret == bob_secret)
                        }}>
                            Compute And Veirfy Common Key
                        </Button>
                    </Form.Item>
                </Col>
            </Row>

        </div>
    );
}
