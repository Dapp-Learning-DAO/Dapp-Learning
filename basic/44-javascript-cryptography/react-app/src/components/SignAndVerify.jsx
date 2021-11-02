// displays a page header
import { Menu, Row, Col } from "antd";
import { Form, Input, Button, Radio } from 'antd';
import React, { useState } from "react";

async function getMac(message, key, setSignMessage) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    mac = await crypto.subtle.sign("HMAC", key, data);
    setSignMessage(arrayBufferToString(mac));
}

async function verifyMac(message, key, mac, setVerifyresult) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    setVerifyresult(await crypto.subtle.verify("HMAC", key, mac, data));
}

async function generateKey() {
    key = await crypto.subtle.generateKey(
        {
            name: "HMAC",
            hash: { name: "SHA-256" } //可以是 "SHA-1", "SHA-256", "SHA-384", 或 "SHA-512"
        },
        true, // 是否可提取，比如用于导入导出
        ["sign", "verify"] // 用途
    );
}

function arrayBufferToString(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
}

var key;
var mac;


export default function SignAndVerify() {

    const [message, setMessage] = useState();

    const [signMessage, setSignMessage] = useState();

    const [verifyresult, setVerifyresult] = useState();

    return (
        <div>
            <Row style={{ justifyContent: "center", padding: '20px 0' }}>
                <Col span={8}>
                    <Form.Item label="Message" tooltip="Please input message">
                        <Input placeholder="Simple message" value={message} onChange={(event) => {
                            setMessage(event.target.value);
                        }} />
                    </Form.Item>
                </Col>
            </Row>


            <Row style={{ justifyContent: "center", padding: '20px 0' }}>
                <Col span={8}>
                    <Form.Item label="Signed Message" >
                        <Input placeholder="" value={signMessage} disabled />
                    </Form.Item>
                </Col>
            </Row>

            <Row style={{ justifyContent: "center", padding: '20px 0' }}>
                <Col span={8}>
                    <Form.Item label="Verify Result" >
                        <Input placeholder="" value={verifyresult} disabled />
                    </Form.Item>
                </Col>
            </Row>


            <Row style={{ justifyContent: "center", padding: '20px 0' }}>
                <Col span={2}>
                    <Form.Item>
                        <Button type="primary" onClick={() => {
                            generateKey();
                        }}>
                            Generate Key
                        </Button>
                    </Form.Item>
                </Col>

                <Col span={2}>
                    <Form.Item>
                        <Button type="primary" onClick={() => {
                            getMac(message, key, setSignMessage)
                        }}>
                            Sign Message
                        </Button>
                    </Form.Item>
                </Col>

                <Col span={2}>
                    <Form.Item>
                        <Button type="primary" onClick={() => {
                            verifyMac(message, key, mac, setVerifyresult)
                        }}>
                            Verify Result
                        </Button>
                    </Form.Item>
                </Col>
            </Row>

        </div>
    );
}
