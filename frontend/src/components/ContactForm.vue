<script setup lang="ts">
import axios from "axios";

let feedback = ref("");
let email = ref("");
let status = ref<"ready" | "submitting" | "submitted" | "error">("ready");

async function submit() {
  status.value = "submitting";
  try {
    await axios.post(`${import.meta.env.VITE_SERVER_URL}/feedback`, {
      feedback: feedback.value,
      email: email.value,
    });
    status.value = "submitted";
  } catch (err) {
    status.value = "error";
  }
}
</script>

<template>
  <form @submit.prevent="submit">
    <label class="block font-bold">Feedback</label>
    <textarea
      class="w-full md:w-xl md:mx-0 h-200px border-gray-300 border-1 border-solid px-2 py-1"
      v-model="feedback"
    ></textarea>
    <label class="block font-bold">Your email</label>
    <input
      class="w-full md:w-xl md:mx-0 border-gray-300 border-1 border-solid px-2 py-1 block"
      type="email"
      v-model="email"
    />
    <button
      class="btn ml-0 mt-5"
      type="submit"
      :disabled="status !== 'ready' && status !== 'error'"
    >
      Submit
    </button>
    <eos-icons-loading
      v-if="status === 'submitting'"
      class="align-middle inline-block ml-3 text-green-900"
    />
    <span v-if="status === 'error'" class="inline-block ml-3 text-red-700 my-0">
      Sorry, unexpected error occurred. Please try again later
    </span>
    <span
      v-else-if="status === 'submitted'"
      class="inline-block ml-3 text-green-700 my-0"
    >
      Thanks for your feedback.
    </span>
  </form>
</template>
