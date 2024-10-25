import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
const { ethers } = require("hardhat");

describe("MultiSig  Test", function () {
  async function deployMultiSigFixture() {
    const [owner, address1, address2, address3, address4, receiver, nonSigner] =
      await hre.ethers.getSigners();

    const MultiSig = await hre.ethers.getContractFactory("MultiSig");
    const multiSig = await MultiSig.deploy(
      [address1.address, address2.address, address3.address, address4.address],
      2,
      { value: hre.ethers.parseEther("1") }
    );

    return {
      multiSig,
      owner,
      address1,
      address2,
      address3,
      address4,
      receiver,
      nonSigner,
    };
  }

  describe("MultiSig  Tests", function () {
    describe("Deployment", () => {
      it("Should check if the contract deployed and owner has been set", async function () {
        const { multiSig, owner } = await loadFixture(deployMultiSigFixture);

        expect(await multiSig);
      });

      it("  valid signer can initiate  transaction  ", async function () {
        const { multiSig, address1, receiver, nonSigner } = await loadFixture(
          deployMultiSigFixture
        );

        await expect(
          multiSig
            .connect(address1)
            .initiateTransaction(hre.ethers.parseEther("0.1"), receiver.address)
        );

        await expect(
          multiSig
            .connect(nonSigner)
            .initiateTransaction(hre.ethers.parseEther("0.1"), receiver.address)
        ).to.be.revertedWith("not valid signer");
      });

      it("Should approve transaction and execute if  quorum is reached", async function () {
        const { multiSig, address1, address2, receiver } = await loadFixture(
          deployMultiSigFixture
        );

        const amount = hre.ethers.parseEther("0.05");

        const txId = await multiSig
          .connect(address1)
          .initiateTransaction(amount, receiver.address);

        const txIdNumber = Number(txId);

        await expect(multiSig.connect(address1).approveTransaction(txIdNumber));

        await expect(multiSig.connect(address2).approveTransaction(txIdNumber));

        const transactions = await multiSig.getAllTransactions();
        const tx = transactions[txIdNumber];
      });

      it(" transfer Ownership", async function () {
        const { multiSig, owner, nonSigner } = await loadFixture(
          deployMultiSigFixture
        );

        await multiSig.connect(owner).transferOwnership(nonSigner.address);

        await expect(multiSig.connect(nonSigner).claimOwnership());
      });

      it("Should add a valid signer ", async function () {
        const { multiSig, owner, address4 } = await loadFixture(
          deployMultiSigFixture
        );

        const newSigner = {
          address: "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
        };
        await multiSig.connect(owner).addValidSigner(newSigner.address);
      });

      it("Should revert if a non owner tries to add a signer", async function () {
        const { multiSig, address1, address2 } = await loadFixture(
          deployMultiSigFixture
        );

        await expect(
          multiSig.connect(address1).addValidSigner(address2.address)
        ).to.be.revertedWith("not owner");
      });

      it("Should remove a valid signer ", async function () {
        const { multiSig, owner, address1, address2 } = await loadFixture(
          deployMultiSigFixture
        );

        const index = 0;
        await multiSig.connect(owner).removeSigner(index);
      });
    });
  });
});