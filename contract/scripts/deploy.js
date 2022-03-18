async function main() {
  const GOLToken = await ethers.getContractFactory("GOLToken");

  console.log("Start to deploy");
  const token = await GOLToken.deploy();
  console.log(token.deployTransaction);
  console.log("Awaiting deploy to finish");
  await token.deployed();
  console.log("Contract deployed to address:", token.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
