# About

## The project

This is a small project for me to experiment with blockchain, especially ERC721.

It is mainly for me to learn about blockchain technology and get some feedback on my work.

Feel free to play around, and I will be very grateful if you even decide to show some
support by minting few boards for yourself.

I will also put the code on [github](https://github.com/bee5325/golnft).

## The minting

The boards are created according to [Convey's Game of Life](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life)
rules.

For now, the minting can only be done on chain Arbitrum. You can choose to mint the board
with rows between 3 and 16. The price will be the same regardless of the number of rows.

The minting is done randomly on the fly. One thing I realized is that it is very hard to have
randomness done on the chain, so the generation of boards are done off the chain, but some
tricks are used to prevent off chain generation to be exploit. If you saw loop holes, feel free
to contact me.

You can check your minted boards under page [mint](/mint).

## Why Arbitrum

Well the honest answer is because it is cheap. I just can't afford the high gas fee required
to deploy the contract on Ethereum mainnet. However, I am staying optimistic about the future
of Arbitrum, as it allows interaction with Ethereum mainnet at much lower price, and the
compatibility with EVM is important in my opinion.

If the request is high enough, I may try to implement some kind of bridge to transfer the tokens
to other chain. Please let me know if you have any opinion on that.

As for my future projects, I MAY consider to switch to other blockchain, just to experiment with
other technology and for learning purpose.

## Contact me

For any feedback / request, feel free to contact me using this form:

<ContactForm />

You can also contact me through email yb.bee5325@gmail.com.

I am also open for any project / job offer.
