<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from "vue";
import { isReservedKey, getReservedKeyWarning } from "./reservedKeys";
import { binder } from "@hyperbind-lib/core";

/**
 * KeyRecorderコンポーネントのプロパティ
 */
interface KeyRecorderProps {
  /** 現在のキーの組み合わせ */
  modelValue: string;
  /** 警告メッセージを表示するかどうか（デフォルト: false） */
  showWarning?: boolean;
  /** 警告状態が変化したときに呼ばれる関数 */
  onWarning?: (warning: string | null) => void;
}

const props = withDefaults(defineProps<KeyRecorderProps>(), {
  showWarning: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const recording = ref(false);

// 記録中は KeybindManager を一時無効化して、他のキーバインドが発火しないようにする
// 参照カウント方式のため、他の一時無効化（モーダルなど）と併用しても復活しない
let release: (() => void) | null = null;

watch(recording, (isRecording) => {
  if (isRecording) {
    if (!release) {
      release = binder.suspend();
    }
  } else {
    release?.();
    release = null;
  }
});

onUnmounted(() => {
  release?.();
  release = null;
});

const handleKeyDown = (e: KeyboardEvent) => {
  e.preventDefault();
  e.stopPropagation(); // イベントの伝播を完全に停止
  const parts: string[] = [];
  
  // Macの場合はmetaKey（Cmd）、Windows/Linuxの場合はctrlKey
  // どちらも"cmd"として統一（KeybindManagerで自動的に相互変換される）
  if (e.metaKey) parts.push("cmd");
  if (e.ctrlKey) parts.push("ctrl");
  if (e.shiftKey) parts.push("shift");
  if (e.altKey) parts.push("alt");
  
  parts.push(e.key.toLowerCase());
  const newKey = parts.join("+");
  
  // 予約キーチェック
  if (props.onWarning || props.showWarning) {
    const warning = getReservedKeyWarning(newKey);
    if (props.onWarning) {
      props.onWarning(warning);
    }
  }
  
  emit("update:modelValue", newKey);
  recording.value = false;
};
</script>

<template>
  <input
    type="text"
    readonly
    :value="recording ? '押してください...' : modelValue"
    @focus="recording = true"
    @keydown="handleKeyDown"
    style="margin-left: 0.5rem; width: 200px; cursor: pointer;"
  />
</template>

