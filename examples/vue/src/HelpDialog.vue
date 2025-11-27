<template>
  <div :style="overlayStyle" @click="onClose">
    <div :style="modalStyle" @click.stop tabindex="-1">
      <h3>❓ ヘルプ</h3>
      <ul :style="{ textAlign: 'left' }">
        <li>キーを記録するには、テキストフィールドをクリックしてキーを押してください</li>
        <li>Cmd+S (Mac) / Ctrl+S (Windows/Linux) で保存のデモを実行できます</li>
        <li>フォームではEnter/Tabで次のフィールドに移動します</li>
        <li>MacとWindows/Linuxのキーの違いを自動的に吸収します</li>
        <li>このダイアログ表示中はキーバインドが無効化されます</li>
      </ul>
      <button 
        @click="onClose"
        :style="{
          padding: '0.5rem 1.5rem',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '1rem',
          fontWeight: 'bold',
          marginTop: '1rem',
        }"
      >
        閉じる
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDisableCustomKeybindsWhileMounted } from "@hyperbind-lib/vue";

interface Props {
  onClose: () => void;
}

defineProps<Props>();

useDisableCustomKeybindsWhileMounted();

const overlayStyle = {
  position: "fixed" as const,
  inset: 0,
  background: "rgba(0,0,0,0.3)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalStyle = {
  background: "#fff",
  padding: "2rem",
  borderRadius: "8px",
  minWidth: "400px",
};
</script>

