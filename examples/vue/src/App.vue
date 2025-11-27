<script setup lang="ts">
import { ref } from "vue";

const message = ref("HyperBind Vue Demo");
</script>

<template>
  <div class="app">
    <h1>{{ message }}</h1>
    <p>Vue 3デモアプリケーション（実装予定）</p>
  </div>
</template>

<style scoped>
.app {
  padding: 2rem;
  text-align: center;
}

h1 {
  color: #42b983;
}
</style>

