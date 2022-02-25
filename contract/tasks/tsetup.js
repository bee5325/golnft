require("dotenv").config();

task("tsetup", "Sends ETH to an address and then deploy contract")
  .addOptionalPositionalParam(
    "receiver",
    "The address that will receive the ETH",
    process.env.PUBLIC_KEY
  )
  .setAction(async ({ receiver }, { ethers }) => {
    // Faucet
    if (network.name === "hardhat") {
      console.warn(
        "You are running the faucet task with Hardhat network, which" +
          "gets automatically created and destroyed every time. Use the Hardhat" +
          " option '--network localhost'"
      );
    }

    const [sender] = await ethers.getSigners();
    const tx = await sender.sendTransaction({
      to: receiver,
      value: ethers.constants.WeiPerEther,
    });
    await tx.wait();

    console.log(`Transferred 1 ETH to ${receiver}`);

    // Deploy contract
    const GOLToken = await ethers.getContractFactory("GOLToken");

    const token = await GOLToken.deploy();
    await token.deployed();
    console.log("Contract deployed to address:", token.address);
  });
