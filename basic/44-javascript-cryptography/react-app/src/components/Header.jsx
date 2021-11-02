import { PageHeader } from "antd";
import React from "react";

// displays a page header

export default function Header() {
  return (
    <a href="https://github.com/rebase-network/Dapp-Learning" target="_blank" rel="noopener noreferrer">
      <PageHeader
        title="Dapp-Learning"
        subTitle="🖼 Cryptography Show"
        style={{ cursor: "pointer" }}
      />
    </a>
  );
}
