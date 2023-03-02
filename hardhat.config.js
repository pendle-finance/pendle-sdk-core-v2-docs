// @ts-check

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
  networks: {
    hardhat: {
      forking: {
        url: 'https://rpc.ankr.com/eth',
      },
    },
  }
};

module.exports = config;