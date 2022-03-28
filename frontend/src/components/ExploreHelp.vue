<script setup lang="ts"></script>

<template>
  <div
    class="flex justify-between border-green-500 border-solid border-1 p-3 rounded bg-white"
  >
    <div class="basis-11/12 text-left">
      <ul class="list-disc pl-5">
        <li>
          You can change the initial state of the board to see how it effects
          the evolution
        </li>
        <li>Choose the number of rows for the board between 3 and 16</li>
        <li>Click on any cell to change its initial state</li>
        <li>
          You can also try random initial state, see if it brings any surprise
        </li>
      </ul>
    </div>
    <carbon-close @click="$emit('closeHelp')" class="cursor-pointer" />
  </div>
</template>
