// SPDX-License-Identifier: unlicense
// https://ethereum.stackexchange.com/questions/150281/invalid-opcode-opcode-0x5f-not-defined
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("TestToken", "ABC") {
        _mint(msg.sender, initialSupply);
    }
}
