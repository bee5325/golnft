// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "hardhat/console.sol";

contract GOLToken is ERC721URIStorage, Ownable {
  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;
  uint price;

  event Minted(uint id, address to, uint tokenURI);

  constructor() ERC721("GOLToken", "GOLT") payable {
    price = 0.0001 ether;
  }

  function payToMint(uint rows) payable public returns (uint) {
    require(msg.value >= price, "Please pay ETH to mint");
    require(rows >= 3 && rows <= 16, "Rows should be between 3 and 16");

    _tokenIds.increment();
    uint newId = _tokenIds.current();
    _safeMint(msg.sender, newId);

    // uint initialState = _randomizeInitialState(rows);
    // _setTokenURI(newId, tokenURI);

    payable(owner()).transfer(msg.value);

    // emit Minted(newId, msg.sender, tokenURI);
    return newId;
  }

  function setPrice(uint _price) onlyOwner() public {
    price = _price;
  }

  function getPrice() public view returns (uint) {
    return price;
  }

  // function _randomizeInitialState(uint rows) private view returns (uint) {
  //   uint initialState = 0;
  //   for (uint r=0; r<rows; r++) {
  //     uint rowState = 0;
  //     for (uint c=0; c<rows; c++) {
  //       // for alive cells
  //       if (_randomAlive(r*rows+c)) {
  //         rowState += 1 << c;
  //       }
  //     }
  //     initialState += (rowState << r*16);
  //   }
  //   return initialState;
  // }

  // function _randomAlive(uint seed) private view returns (bool) {
  //   return (uint(keccak256(abi.encodePacked(block.difficulty, block.timestamp, seed))) % 10) < 2;
  // }
}
