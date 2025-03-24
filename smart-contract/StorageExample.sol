// SPDX-License-Identifier: UNLICENSED
// https://ethereum.stackexchange.com/questions/150281/invalid-opcode-opcode-0x5f-not-defined
pragma solidity ^0.8.0;

contract StorageExample {
  uint public storedData;
  event stored(address _to, uint _amount);

  constructor(uint initVal) public {
    emit stored(msg.sender, initVal);
    storedData = initVal;
  }

  function set(uint x) public {
    emit stored(msg.sender, x);
    storedData = x;
  }

  function get() view public returns (uint retVal) {
    return storedData;
  }
}