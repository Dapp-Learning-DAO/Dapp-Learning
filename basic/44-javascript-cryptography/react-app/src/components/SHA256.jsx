// displays a page header
import { Menu, Row, Col } from "antd";
import { Form, Input, Button, Radio } from 'antd';
import React, { useState } from "react";

async function digestMessage(message,setHashMessage) {
    const encode = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", encode); // hash the message
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(""); // convert bytes to hex string
      setHashMessage(hashHex);
  }

export default function SHA256() {

    const [plainText, setPlainText] = useState();

    const [hashMessage, setHashMessage] = useState();

    return (
        <div>
            <Row style={{ justifyContent: "center", padding: '20px 0' }}>
                <Col span={8}>
                    <Form.Item label="Message" tooltip="Please input message">
                        <Input placeholder="Simple message" value={plainText} onChange={(event) => {
                            setPlainText(event.target.value);
                            console.log(plainText);
                        }} />
                    </Form.Item>
                </Col>
            </Row>

            <Row style={{ justifyContent: "center", padding: '20px 0' }}>
                <Col span={8}>
                    <Input placeholder="" value={hashMessage} disabled />
                </Col>
            </Row>

                <Col span={32}>
                    <Form.Item>
                        <Button type="primary" onClick={() => {
                            digestMessage(plainText,setHashMessage);
                        }}>
                            Hashing the message
                        </Button>
                    </Form.Item>
                </Col>
           
        </div>
    );
}
