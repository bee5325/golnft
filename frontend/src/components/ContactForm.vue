<script setup lang="ts">
import { config } from "../config";
import axios from "axios";

let feedback = ref("");
let email = ref("");
let submited = ref(false);

async function submit() {
  axios.post(`${config.SERVER_URL}/feedback`, { feedback: feedback.value, email: email.value });
  submited.value = true;
}
</script>

<template>
  <form @submit.prevent="submit">
    <label class="block font-bold">Feedback</label>
    <textarea class="w-full md:w-xl md:mx-0 h-200px border-gray-300 border-1 border-solid px-2 py-1" v-model="feedback"></textarea>
    <label class="block font-bold">Your email</label>
    <input class="w-full md:w-xl md:mx-0 border-gray-300 border-1 border-solid px-2 py-1 block" type="email" v-model="email" />
    <button class="btn ml-0 mt-5" type="submit" :disabled="submited">Submit</button>
    <p v-if="submited" class="inline-block ml-3 text-green-700">Thanks for your feedback.</p>
  </form>
</template>
