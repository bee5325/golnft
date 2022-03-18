require("@nomiclabs/hardhat-waffle");
require("./tasks/faucet");
require("./tasks/tsetup");
require("dotenv").config();

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.1",
    settings: {
      optimizer: {
        enabled: true,
        runs: 100,
      },
    },
  },
  networks: {
    arbRinkeby: {
      url: process.env.ALCHEMY_ARBRINKEBY_API_URL,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
    },
    arbitrum: {
      url: process.env.ALCHEMY_ARBITRUM_API_URL,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
    },
  },
};
