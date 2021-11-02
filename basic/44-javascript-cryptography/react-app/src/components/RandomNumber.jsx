// displays a page header
import { Menu, Row, Col } from "antd";
import { Form, Input, Button, Radio } from 'antd';
import React, { useState } from "react";

export default function RandomNumber() {

    const [plainText, setPlainText] = useState();

    return (
        <div>
            <Row style={{ justifyContent: "center", padding: '20px 0' }}>
                <Col span={8}>
                    <Input placeholder="" value={plainText} disabled />
                </Col>
            </Row>

                <Col span={32}>
                    <Form.Item>
                        <Button type="primary" onClick={() => {
                            //This will decrypt Cipheretext to plaintext
                            const secure = window.crypto.getRandomValues(new Uint8Array(10));
                            var uint8array = new TextEncoder().encode(secure);
                            var string = new TextDecoder().decode(uint8array);
                            setPlainText(string);
                        }}>
                            Generate Random Number
                        </Button>
                    </Form.Item>
                </Col>
           
        </div>
    );
}
