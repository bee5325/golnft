<template>
  <nav class="text-xl m-0 mb-5 w-full bg-green-600 text-gray-50 flex items-center justify-between p-5 flex-wrap">
    <span class="w-full text-left md:w-auto md:grow md:mr-auto">Conway's Game of Life NFT</span>

    <router-link class="icon-btn mx-2 ml-auto md:ml-0" to="/" title="Home">
      Home
    </router-link>

    <router-link class="icon-btn mx-2" to="/mint" title="Mint">
      Mint
    </router-link>

    <router-link class="icon-btn mx-2" to="/about" title="about">
      About
    </router-link>
  </nav>
</template>
