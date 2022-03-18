require("@nomiclabs/hardhat-waffle");
require("./tasks/faucet");
require("./tasks/tsetup");
require("dotenv").config();

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.1",
  networks: {
    arbRinkeby: {
      url: process.env.ALCHEMY_ARBRINKEBY_API_URL,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
    },
    arbitrum: {
      url: process.env.ALCHEMY_ARBITRUM_API_URL,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
    }
  }
};
