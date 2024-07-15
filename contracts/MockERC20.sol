// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Defining the MockERC20 contract which inherits from ERC20 and Ownable
contract MockERC20 is ERC20, Ownable {
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);

    // Constructor function initializes the ERC20 token with a name MockERC20 and a symbol MERC20
    constructor(address initialOwner) ERC20("MockERC20", "MERC20") {
        // Pass the initialOwner address to the Ownable constructor
        Ownable.initialize(initialOwner);    }

    // Mint function that allows the contract owner to mint new tokens
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    // Burn function that allows any user to burn their own tokens
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }
    // Another mint function used by the Web3Function
    // Only the contract owner can call this function
    function mintForFunction(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }
}