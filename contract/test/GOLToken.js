const { expect } = require("chai");
const { ethers } = require("hardhat");

let owner, addr1, addr2;
const MIN_PAYMENT = Math.pow(10, 15); // 0.001 ether

// helper functions
async function getSignature(rows, initState, address) {
  const abiCoder = ethers.utils.defaultAbiCoder;

  return await owner.signMessage(
    ethers.utils.arrayify(
      ethers.utils.keccak256(
        abiCoder.encode(["uint", "uint", "address"], [rows, initState, address])
      )
    )
  );
}

describe("GOL Token", () => {
  before(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();
  });

  describe("deployment", () => {
    it("should assign the owner", async () => {
      const Token = await ethers.getContractFactory("GOLToken");
      const hardhatToken = await Token.deploy();

      expect(await hardhatToken.owner()).to.equal(owner.address);
    });
  });

  describe("Pay to mint", () => {
    const ROWS = 5;
    const INIT_STATE = "00000015000400060003";
    const TOKEN_URI = "tokenUri";

    let hardhatToken;
    let SIGNATURE;

    beforeEach(async () => {
      const Token = await ethers.getContractFactory("GOLToken");
      hardhatToken = await Token.deploy();
      SIGNATURE = await getSignature(ROWS, INIT_STATE, addr1.address);
    });

    it("should revert if not paid enough", async () => {
      await expect(
        hardhatToken
          .connect(addr1)
          .payToMint(ROWS, INIT_STATE, TOKEN_URI, SIGNATURE, {
            value: MIN_PAYMENT - 1,
          })
      ).to.be.revertedWith("Please pay ETH to mint");
    });

    it("should transfer ether to owner", async () => {
      await expect(
        await hardhatToken
          .connect(addr1)
          .payToMint(ROWS, INIT_STATE, TOKEN_URI, SIGNATURE, {
            value: MIN_PAYMENT,
          })
      )
        .to.changeEtherBalance(addr1, -MIN_PAYMENT)
        .to.changeEtherBalance(owner, MIN_PAYMENT);
    });

    it("should revert if signature not verified", async () => {
      const NON_SIGNATURE = SIGNATURE.replace("1", "2");
      const INIT_STATE_2 = "000100010001";
      const SIGNATURE_2 = await getSignature(3, INIT_STATE_2, addr2.address);

      await expect(
        hardhatToken
          .connect(addr1)
          .payToMint(ROWS, INIT_STATE, TOKEN_URI, NON_SIGNATURE, {
            value: MIN_PAYMENT,
          })
      ).to.be.revertedWith("Signature not verified");

      // should not revert
      await hardhatToken
        .connect(addr1)
        .payToMint(ROWS, INIT_STATE, TOKEN_URI, SIGNATURE, {
          value: MIN_PAYMENT,
        });

      // should not revert
      await hardhatToken
        .connect(addr2)
        .payToMint(3, INIT_STATE_2, TOKEN_URI, SIGNATURE_2, {
          value: MIN_PAYMENT,
        });
    });

    it("should mint token to buyer", async () => {
      await hardhatToken
        .connect(addr1)
        .payToMint(ROWS, INIT_STATE, TOKEN_URI, SIGNATURE, {
          value: MIN_PAYMENT,
        });

      expect(await hardhatToken.balanceOf(addr1.address)).to.be.eq(1);
      expect(await hardhatToken.ownerOf(1)).to.be.eq(addr1.address);
    });

    it("should only allow minting between 3 and 16 rows", async () => {
      await expect(
        hardhatToken
          .connect(addr1)
          .payToMint(
            2,
            INIT_STATE,
            TOKEN_URI,
            await getSignature(2, INIT_STATE, addr1.address),
            { value: MIN_PAYMENT }
          )
      ).to.be.revertedWith("Rows should be between 3 and 16");

      await expect(
        hardhatToken
          .connect(addr1)
          .payToMint(
            17,
            INIT_STATE,
            TOKEN_URI,
            await getSignature(2, INIT_STATE, addr1.address),
            { value: MIN_PAYMENT }
          )
      ).to.be.revertedWith("Rows should be between 3 and 16");
    });

    it("should revert if init state already exists", async () => {
      await hardhatToken
        .connect(addr1)
        .payToMint(ROWS, INIT_STATE, TOKEN_URI, SIGNATURE, {
          value: MIN_PAYMENT,
        });

      // same init state should be reverted
      await expect(
        hardhatToken
          .connect(addr1)
          .payToMint(ROWS, INIT_STATE, TOKEN_URI, SIGNATURE, {
            value: MIN_PAYMENT,
          })
      ).to.be.revertedWith("Init state already exists");
    });

    it("should store token uri", async () => {
      await hardhatToken
        .connect(addr1)
        .payToMint(ROWS, INIT_STATE, "token uri for 1", SIGNATURE, {
          value: MIN_PAYMENT,
        });

      expect(await hardhatToken.tokenURI(1)).to.be.eq("token uri for 1");
    });
  });

  describe("tokenIdOf", () => {
    it("should return correct token id for given rows and init state", async () => {
      const Token = await ethers.getContractFactory("GOLToken");
      hardhatToken = await Token.deploy();

      // first mint 2 tokens with same init state hex but different row
      let rows = 3;
      let initState = "00000015000400060003";
      let signature = getSignature(rows, initState, addr1.address);
      await hardhatToken
        .connect(addr1)
        .payToMint(rows, initState, "token uri", signature, {
          value: MIN_PAYMENT,
        });

      rows = 4;
      initState = "000000000015000400060003";
      signature = getSignature(rows, initState, addr1.address);
      await hardhatToken
        .connect(addr1)
        .payToMint(rows, initState, "token uri", signature, {
          value: MIN_PAYMENT,
        });

      // token id should be correct according to number of rows
      expect(
        await hardhatToken.tokenIdOf(3, "000000000015000400060003")
      ).to.be.eq(1);
      expect(
        await hardhatToken.tokenIdOf(4, "000000000015000400060003")
      ).to.be.eq(2);
    });
  });

  describe("update price", () => {
    const ROWS = 5;
    const INIT_STATE = "00000015000400060003";
    const TOKEN_URI = "tokenUri";

    let hardhatToken;
    let SIGNATURE;

    beforeEach(async () => {
      const Token = await ethers.getContractFactory("GOLToken");
      hardhatToken = await Token.deploy();

      SIGNATURE = await getSignature(ROWS, INIT_STATE, addr1.address);
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
          .payToMint(ROWS, INIT_STATE, TOKEN_URI, SIGNATURE, { value: 1 })
      ).to.be.revertedWith("Please pay ETH to mint");

      // success
      await hardhatToken
        .connect(addr1)
        .payToMint(ROWS, INIT_STATE, TOKEN_URI, SIGNATURE, { value: 2 });
    });
  });
});
