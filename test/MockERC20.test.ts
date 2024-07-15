import { expect } from "chai";
import { ethers } from "hardhat";
import { MockERC20 } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("MockERC20", function () {
  let mockERC20: MockERC20;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    mockERC20 = await MockERC20Factory.deploy(owner.address);
    await mockERC20.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await mockERC20.owner()).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await mockERC20.name()).to.equal("MockERC20");
      expect(await mockERC20.symbol()).to.equal("MERC20");
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      await expect(mockERC20.mint(addr1.address, 100))
        .to.emit(mockERC20, "TokensMinted")
        .withArgs(addr1.address, 100);
      expect(await mockERC20.balanceOf(addr1.address)).to.equal(100);
    });

    it("Should not allow non-owner to mint tokens", async function () {
      await expect(mockERC20.connect(addr1).mint(addr2.address, 100)).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow owner to mint tokens using mintForFunction", async function () {
      await expect(mockERC20.mintForFunction(addr1.address, 100))
        .to.emit(mockERC20, "TokensMinted")
        .withArgs(addr1.address, 100);
      expect(await mockERC20.balanceOf(addr1.address)).to.equal(100);
    });

    it("Should not allow non-owner to mint tokens using mintForFunction", async function () {
      await expect(mockERC20.connect(addr1).mintForFunction(addr2.address, 100)).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      await mockERC20.mint(addr1.address, 1000);
    });

    it("Should allow users to burn their own tokens", async function () {
      await expect(mockERC20.connect(addr1).burn(100))
        .to.emit(mockERC20, "TokensBurned")
        .withArgs(addr1.address, 100);
      expect(await mockERC20.balanceOf(addr1.address)).to.equal(900);
    });

    it("Should not allow users to burn more tokens than they have", async function () {
      await expect(mockERC20.connect(addr1).burn(1001)).to.be.revertedWith("ERC20: burn amount exceeds balance");
    });
  });
});