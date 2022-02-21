const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GOL Token", () => {
  describe("deployment", () => {
    it("should assign the owner", async () => {
      const [owner] = await ethers.getSigners();
      const Token = await ethers.getContractFactory("GOLToken");
      const hardhatToken = await Token.deploy();

      expect(await hardhatToken.owner()).to.equal(owner.address);
    });
  });

  describe("Pay to mint", () => {
    let owner;
    let addr1;
    let hardhatToken;
    const minPayment = Math.pow(10, 14); // 0.0001 ether

    beforeEach(async () => {
      [owner, addr1] = await ethers.getSigners();
      const Token = await ethers.getContractFactory("GOLToken");
      hardhatToken = await Token.deploy();
    });

    it("should reject if not paid enough", async () => {
      await expect(
        hardhatToken
          .connect(addr1)
          .payToMint(5, { value: minPayment - 1 }))
        .to.be.revertedWith("Please pay ETH to mint");
    });

    it("should transfer ether to owner", async () => {
      await expect(
        await hardhatToken
          .connect(addr1)
          .payToMint(5, { value: minPayment }))
        .to.changeEtherBalance(addr1, -minPayment);

      await expect(
        await hardhatToken
          .connect(addr1)
          .payToMint(5, { value: minPayment }))
        .to.changeEtherBalance(owner, minPayment);
    });

    it("should mint token to buyer", async () => {
      await hardhatToken
        .connect(addr1)
        .payToMint(5, { value: minPayment });

      expect(await hardhatToken.balanceOf(addr1.address)).to.be.eq(1);
      expect(await hardhatToken.ownerOf(1)).to.be.eq(addr1.address);
    });

    it("should only allow minting between 3 and 16 rows", async () => {
      await expect(hardhatToken.connect(addr1)
        .payToMint(2, { value: minPayment }))
        .to.be.revertedWith("Rows should be between 3 and 16");

      await expect(hardhatToken.connect(addr1)
        .payToMint(17, { value: minPayment }))
        .to.be.revertedWith("Rows should be between 3 and 16");
    });

    // it.only("should generate initial state with correct length", async () => {
    //   for (let i=0; i<10; i++) {
    //     let res = await hardhatToken.connect(addr1)
    //       .payToMint(16, { value: minPayment });
    //     console.log(await hardhatToken.connect(addr1).estimateGas.payToMint(16, { value: minPayment }));
    //   }

    //   let minted = await hardhatToken.queryFilter(hardhatToken.filters.Minted());
    //   let initialState = minted.map((m) => m.args.initialState.toHexString().padStart(62, " "));
    //   // make sure it is in format of (b'00000000000xxxxx)*5 times = 80bits
    //   // we can check by AND with inverse of 0x001F (0xFFE0) * 5 times and the result should be 0
    //   console.log(initialState);
    //   // expect(initialState | 0xFFE0FFE0FFE0FFE0FFE0).to.be.eq(0);
    // });
  });

  describe("update price", () => {
    let addr1;
    let hardhatToken;

    beforeEach(async () => {
      [owner, addr1] = await ethers.getSigners();
      const Token = await ethers.getContractFactory("GOLToken");
      hardhatToken = await Token.deploy();
    });

    it("should reject call by non-owner", async () => {
      await expect(hardhatToken.connect(addr1).setPrice(1)).to.be.reverted;
    });

    it("should update price", async () => {
      await hardhatToken.setPrice(2);
      expect(await hardhatToken.getPrice()).to.be.eq(2);
    });

    it("should change minting min payment value", async () => {
      await hardhatToken.setPrice(2);

      await expect(
        hardhatToken
          .connect(addr1)
          .payToMint(5, { value: 1 }))
        .to.be.revertedWith("Please pay ETH to mint");

      // success
      await hardhatToken
        .connect(addr1)
        .payToMint(5, { value: 2 });
    });
  });
});
