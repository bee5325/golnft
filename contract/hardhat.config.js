require("@nomiclabs/hardhat-waffle");
require("./tasks/faucet");
require("./tasks/tsetup");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.1",
};
