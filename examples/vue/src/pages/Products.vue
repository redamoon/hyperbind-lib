<template>
  <div :style="{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }">
    <div :style="{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }">
      <RouterLink to="/" :style="{ color: '#2196F3', textDecoration: 'none' }">
        ← トップに戻る
      </RouterLink>
      <button 
        @click="toggle"
        :style="{
          backgroundColor: isEnabled ? '#4CAF50' : '#f44336',
          color: 'white',
          border: 'none',
          padding: '0.5rem 1rem',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold',
        }"
      >
        {{ isEnabled ? '✓ キーバインド: ON' : '✗ キーバインド: OFF' }}
      </button>
    </div>
    <ProductForm :isActive="true" />
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router";
import { useGlobalKeybindToggle } from "@hyperbind-lib/vue";
import ProductForm from "../ProductForm.vue";

const { isEnabled, toggle } = useGlobalKeybindToggle();
</script>

