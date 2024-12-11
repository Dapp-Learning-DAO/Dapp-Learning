
### 设置并启动闪电网络节点的 Shell 脚本

```bash
#!/bin/bash

# 设置变量
BITCOIN_USER="your_rpc_user"                # 替换为你的比特币 RPC 用户名
BITCOIN_PASSWORD="your_rpc_password"        # 替换为你的比特币 RPC 密码
BITCOIN_CONF_PATH="$HOME/.bitcoin/bitcoin.conf"
LND_CONF_PATH="$HOME/.lnd/lnd.conf"

# 步骤 1：安装必要的依赖项
echo "Updating system and installing dependencies..."
sudo apt-get update -y && sudo apt-get upgrade -y
sudo apt-get install -y wget jq unzip

# 步骤 2：下载并安装 Bitcoin Core
echo "Downloading and installing Bitcoin Core..."
wget https://bitcoin.org/bin/bitcoin-core-24.0.1/bitcoin-24.0.1-x86_64-linux-gnu.tar.gz
tar -xzf bitcoin-24.0.1-x86_64-linux-gnu.tar.gz
sudo install -m 0755 -o root -t /usr/local/bin bitcoin-24.0.1/bin/*

# 步骤 3：配置比特币节点
echo "Configuring Bitcoin node..."
mkdir -p "$HOME/.bitcoin"
cat <<EOF > "$BITCOIN_CONF_PATH"
server=1
txindex=1
prune=600                   # 如果存储空间有限
rpcuser=$BITCOIN_USER
rpcpassword=$BITCOIN_PASSWORD
EOF

# 启动比特币节点
echo "Starting Bitcoin node..."
bitcoind -daemon
sleep 10  # 等待节点启动

# 步骤 4：下载并安装 lnd
echo "Downloading and installing lnd..."
wget https://github.com/lightningnetwork/lnd/releases/download/v0.15.0-beta/lnd-linux-amd64-v0.15.0-beta.tar.gz
tar -xzf lnd-linux-amd64-v0.15.0-beta.tar.gz
sudo install -m 0755 -o root -t /usr/local/bin lnd-linux-amd64-*/lnd
sudo install -m 0755 -o root -t /usr/local/bin lnd-linux-amd64-*/lncli

# 步骤 5：配置 lnd 节点
echo "Configuring lnd node..."
mkdir -p "$HOME/.lnd"
cat <<EOF > "$LND_CONF_PATH"
[Application Options]
alias=YourNodeAlias          # 设置节点别名
color=#FF0000                # 设置节点颜色

[Bitcoin]
bitcoin.active=1
bitcoin.mainnet=1
bitcoin.node=bitcoind

[Bitcoind]
bitcoind.rpcuser=$BITCOIN_USER
bitcoind.rpcpass=$BITCOIN_PASSWORD
bitcoind.rpchost=localhost
bitcoind.zmqpubrawblock=tcp://127.0.0.1:28332
bitcoind.zmqpubrawtx=tcp://127.0.0.1:28333
EOF

# 步骤 6：启动 lnd 节点
echo "Starting lnd node..."
lnd --configfile="$LND_CONF_PATH" &

# 步骤 7：等待 lnd 启动后初始化钱包
sleep 15  # 等待 lnd 完全启动
echo "Creating lnd wallet..."
echo "Please follow the instructions to create a wallet for your lnd node:"
lncli create

echo "Lightning Network node setup is complete!"
```