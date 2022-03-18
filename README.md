# Intro

This is a site for you to mint your own NTF based on Conway's Game of Life.

The project can be divided into 3 parts: frontend, server and smart contract.

The project is served on the server using Docker, and you can access it at
https://golnft.yubin.my.

# Frontend

Frontend is written using Vue. Nothing much to say about it, except that Vue
is awesome!

# Server

The purpose of having server is to hide some implementation from the client,
for example random generation of the boards.

It also stores some info about the generated boards, to prevent fetching from
blockchain every time. However, all the info can be obtained from the blockchain
directly without the server, to make sure that the data cannot be manipulated
easily.

# Contract

The contract is written in solidity, and to be published to Arbitrum. It is based
on Openzeppelin ERC721 contract, with some extra functionaliy, like pay to mint
and setting price.

# Contact

If you have any request / bug report / question, feel free to contact me by email:
yb.bee5325@gmail.com.
