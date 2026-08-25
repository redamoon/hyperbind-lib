<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from "vue";
import { isReservedKey, getReservedKeyWarning } from "./reservedKeys";
import { binder, keyComboFromEvent } from "@hyperbind-lib/core";

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

  // 修飾キーの順序・別名を正準形に揃える（KeybindManagerと同じ正規化）
  const newKey = keyComboFromEvent(e);

  // 修飾キー単体（Shiftだけを押した場合など）は記録しない
  if (!newKey) {
    return;
  }

  // 修飾キーなしの単独キーは KeybindManager が既定で無視するため記録しない
  // （binder.setOptions({ allowSingleKeyBindings: true }) で許可できる）
  if (!binder.isSingleKeyBindingAllowed() && !newKey.includes("+") && newKey.length === 1) {
    if (props.onWarning) {
      props.onWarning(
        "修飾キー（Ctrl / Cmd / Shift / Alt）を組み合わせてください。単独のキーは既定では発火しません。"
      );
    }
    return;
  }

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

