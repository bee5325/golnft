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
  mapping(uint => bool) taken;

  // event Minted(uint id, address to, uint tokenURI);

  constructor() ERC721("GOLToken", "GOLT") payable {
    price = 0.0001 ether;
  }

  function payToMint(uint rows, uint initState, bytes memory signature) payable public returns (uint) {
    require(msg.value >= price, "Please pay ETH to mint");
    require(rows >= 3 && rows <= 16, "Rows should be between 3 and 16");
    require(!taken[initState], "Init state already exists");

    bytes32 message = keccak256(
      abi.encodePacked(
        "\x19Ethereum Signed Message:\n32",
        keccak256(abi.encode(rows, initState, msg.sender))
      )
    );

    require(recoverSigner(message, signature) == owner(), "Signature not verified");

    taken[initState] = true;
    _tokenIds.increment();
    uint newId = _tokenIds.current();
    _safeMint(msg.sender, newId);

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

  function splitSignature(bytes memory sig)
    internal
    pure
    returns (uint8 v, bytes32 r, bytes32 s)
  {
    require(sig.length == 65);

    assembly {
      r := mload(add(sig, 32)) // first 32 bytes, after the length prefix.
      s := mload(add(sig, 64)) // second 32 bytes.
      v := byte(0, mload(add(sig, 96))) // final byte (first byte of the next 32 bytes).
    }

    return (v, r, s);
  }

  function recoverSigner(bytes32 message, bytes memory sig)
    internal
    pure
    returns (address)
  {
    (uint8 v, bytes32 r, bytes32 s) = splitSignature(sig);

    return ecrecover(message, v, r, s);
  }
}
