module.exports = {
  networks: {
    sepolia: {
      http: `https://sepolia.infura.io/v3/${process.env.INFURA_ID}`,
      ws: `wss://sepolia.infura.io/ws/v3/${process.env.INFURA_ID}`,
    },
    // 可添加其他网络配置
  },
  gas: {
    limit: 8000000,
    // 可添加 gasPrice 策略
  },
  contracts: {
    incrementer: {
      initialValue: 5,
    },
  },
};