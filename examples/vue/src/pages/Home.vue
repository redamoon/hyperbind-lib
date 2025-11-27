<template>
  <div :style="{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }">
    <div :style="{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'flex-end' }">
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
    <h1>🎹 HyperBind デモ</h1>
    <p :style="{ fontSize: '1.1rem', color: '#666', marginBottom: '2rem' }">
      キーボードショートカットを簡単に実装するためのライブラリのデモページです。
    </p>

    <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }">
      <div
        :style="{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '1.5rem',
          backgroundColor: '#f9f9f9',
        }"
      >
        <h2 :style="{ marginTop: 0 }">💼 会計</h2>
        <ul :style="{ paddingLeft: '1.5rem' }">
          <li>
            <RouterLink to="/accounting/dashboard" :style="{ color: '#2196F3', textDecoration: 'none' }">
              会計ダッシュボード
            </RouterLink>
          </li>
          <li>
            <RouterLink to="/accounting/invoices" :style="{ color: '#2196F3', textDecoration: 'none' }">
              振替伝票入力
            </RouterLink>
          </li>
          <li>
            <RouterLink to="/accounting/expenses" :style="{ color: '#2196F3', textDecoration: 'none' }">
              経費管理
            </RouterLink>
          </li>
        </ul>
      </div>

      <div
        :style="{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '1.5rem',
          backgroundColor: '#f9f9f9',
        }"
      >
        <h2 :style="{ marginTop: 0 }">📋 販売・営業支援</h2>
        <ul :style="{ paddingLeft: '1.5rem' }">
          <li>
            <RouterLink to="/sales/dashboard" :style="{ color: '#2196F3', textDecoration: 'none' }">
              販売ダッシュボード
            </RouterLink>
          </li>
          <li>
            <RouterLink to="/sales/orders" :style="{ color: '#2196F3', textDecoration: 'none' }">
              受注伝票入力
            </RouterLink>
          </li>
          <li>
            <RouterLink to="/sales/customers" :style="{ color: '#2196F3', textDecoration: 'none' }">
              取引先入力
            </RouterLink>
          </li>
          <li>
            <RouterLink to="/sales/products" :style="{ color: '#2196F3', textDecoration: 'none' }">
              商品入力
            </RouterLink>
          </li>
          <li>
            <RouterLink to="/sales/daily-report" :style="{ color: '#2196F3', textDecoration: 'none' }">
              営業日報入力
            </RouterLink>
          </li>
        </ul>
      </div>

      <div
        :style="{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '1.5rem',
          backgroundColor: '#f9f9f9',
        }"
      >
        <h2 :style="{ marginTop: 0 }">🏠 不動産</h2>
        <ul :style="{ paddingLeft: '1.5rem' }">
          <li>
            <RouterLink to="/real-estate/properties" :style="{ color: '#2196F3', textDecoration: 'none' }">
              物件台帳
            </RouterLink>
          </li>
          <li>
            <RouterLink to="/real-estate/contracts" :style="{ color: '#2196F3', textDecoration: 'none' }">
              契約管理
            </RouterLink>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router";
import { useGlobalKeybindToggle } from "@hyperbind-lib/vue";

const { isEnabled, toggle } = useGlobalKeybindToggle();
</script>

