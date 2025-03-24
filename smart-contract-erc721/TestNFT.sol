// SPDX-License-Identifier: MIT
// https://ethereum.stackexchange.com/questions/150281/invalid-opcode-opcode-0x5f-not-defined
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract TestNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // Updated constructor syntax for Solidity 0.8.0+
    constructor() ERC721('TestNFT', 'TNF') {}

    function mintNFT(address recipient, string memory tokenURI) public onlyOwner returns (uint256) {
        _tokenIds.increment();

        uint256 newItemId = _tokenIds.current();
        _mint(recipient, newItemId);
        _setTokenURI(newItemId, tokenURI);

        return newItemId;
    }
}
