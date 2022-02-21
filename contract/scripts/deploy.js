async function main() {
  const GOLToken = await ethers.getContractFactory("GOLToken");

  const token = await GOLToken.deploy();
  await token.deployed();
  console.log("Contract deployed to address:", token.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })

