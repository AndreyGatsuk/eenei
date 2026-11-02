<script setup lang="ts">
import { ref } from "vue";
const name = ref("Navigate");
const active = ref(true);
</script>

<template>
  <!-- Directives contain expressions, not string literals. -->
  <button v-if="active" :title="name" @click="active = false">
    {{ name }}
  </button>
</template>

<style scoped>
button { color: var(--accent); }
</style>
