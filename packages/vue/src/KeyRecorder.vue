<script lang="ts">
// class / style をルートのspanではなくボタンへ渡すため
export default {
  inheritAttrs: false,
};
</script>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from "vue";
import { getReservedKeyWarning } from "./reservedKeys";
import { binder, buildKeyComboFromEvent, isModifierKey } from "@hyperbind-lib/core";

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

/**
 * キーボード入力を記録するコンポーネント
 *
 * ユーザーがキーを押すと、その組み合わせ（"ctrl+s"など）を記録します。
 * 予約キー（ブラウザやOSで使用されるキー）の使用時には警告を表示します。
 * 記録中は他のキーバインドを一時的に無効化します。
 *
 * フォーカス（またはクリック / Enter）で記録が始まり、Escapeキーを押すか
 * フォーカスが外れると記録を確定せずに終了します。Shiftなどの修飾キー単独では
 * 確定せず、押下中の修飾キーを表示するだけにとどめます。
 *
 * class / style は内側のボタン要素に適用されます。
 * 以下のCSS変数でもテーマを変更できます。
 * `--hyperbind-recorder-bg` / `--hyperbind-recorder-recording-bg` /
 * `--hyperbind-recorder-color` / `--hyperbind-recorder-border` /
 * `--hyperbind-recorder-radius` / `--hyperbind-recorder-width` /
 * `--hyperbind-recorder-padding` / `--hyperbind-recorder-font-size`
 */
const props = withDefaults(defineProps<KeyRecorderProps>(), {
  showWarning: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const recording = ref(false);
// 記録中に押されている修飾キー（例: "ctrl+shift"）
const pressedModifiers = ref("");
// スクリーンリーダーへの状態通知
const status = ref("");

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

const startRecording = () => {
  if (recording.value) return;
  recording.value = true;
  pressedModifiers.value = "";
  status.value =
    "キーを記録しています。記録したいキーを押してください。Escapeキーで取り消します。";
};

/** 確定せずに記録を終了する */
const cancelRecording = (message: string) => {
  recording.value = false;
  pressedModifiers.value = "";
  status.value = message;
};

const handleKeyDown = (e: KeyboardEvent) => {
  // 記録していないときは Enter / Space をボタンのクリックとして扱う
  if (!recording.value) return;

  e.preventDefault();
  e.stopPropagation(); // イベントの伝播を完全に停止

  // Escapeは記録のキャンセルに割り当てているため、キーバインドとしては記録しない
  if (e.key === "Escape") {
    cancelRecording("記録を取り消しました。");
    return;
  }

  // Shift / Control / Alt / Meta / CapsLock などの修飾キー単独では確定しない
  if (isModifierKey(e.key)) {
    const modifiers = buildKeyComboFromEvent(e);
    pressedModifiers.value = modifiers;
    status.value = modifiers ? `${modifiers} を押しています。` : "";
    return;
  }

  // KeybindManagerと同じ順序・同じ正規化でキーの組み合わせを組み立てる
  const newKey = buildKeyComboFromEvent(e);

  // 予約キーチェック
  if (props.onWarning || props.showWarning) {
    const warning = getReservedKeyWarning(newKey);
    if (props.onWarning) {
      props.onWarning(warning);
    }
  }

  emit("update:modelValue", newKey);
  recording.value = false;
  pressedModifiers.value = "";
  status.value = `${newKey} を記録しました。`;
};

const handleKeyUp = (e: KeyboardEvent) => {
  if (!recording.value) return;
  // 修飾キーを離したときは表示を更新する
  if (isModifierKey(e.key)) {
    pressedModifiers.value = buildKeyComboFromEvent(e);
  }
};

const handleBlur = () => {
  // フォーカスが外れたまま recording が true で残ると binder.enable() が呼ばれず、
  // アプリ全体のキーバインドが無効のまま復帰しなくなる
  if (recording.value) {
    cancelRecording("記録を終了しました。");
  }
};

const displayValue = computed(() => {
  if (!recording.value) return props.modelValue || "未設定";
  return pressedModifiers.value ? `${pressedModifiers.value}+…` : "キーを押してください...";
});

const label = computed(() =>
  recording.value
    ? "キーの組み合わせを記録中です。記録したいキーを押してください。Escapeキーで取り消します。"
    : `キーバインド: ${props.modelValue || "未設定"}。Enterキーまたはクリックで記録を開始します。`
);
</script>

<template>
  <span class="hyperbind-key-recorder">
    <button
      type="button"
      :aria-label="label"
      :aria-pressed="recording"
      :style="{
        marginLeft: '0.5rem',
        width: 'var(--hyperbind-recorder-width, 200px)',
        padding: 'var(--hyperbind-recorder-padding, 0.25rem 0.5rem)',
        fontSize: 'var(--hyperbind-recorder-font-size, inherit)',
        fontFamily: 'inherit',
        textAlign: 'left',
        cursor: 'pointer',
        color: 'var(--hyperbind-recorder-color, inherit)',
        border: 'var(--hyperbind-recorder-border, 1px solid #ccc)',
        borderRadius: 'var(--hyperbind-recorder-radius, 3px)',
        backgroundColor: recording
          ? 'var(--hyperbind-recorder-recording-bg, #fff8e1)'
          : 'var(--hyperbind-recorder-bg, #fff)',
      }"
      v-bind="$attrs"
      @focus="startRecording"
      @blur="handleBlur"
      @click="startRecording"
      @keydown="handleKeyDown"
      @keyup="handleKeyUp"
    >
      {{ displayValue }}
    </button>
    <span
      role="status"
      aria-live="polite"
      style="position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;"
    >
      {{ status }}
    </span>
  </span>
</template>
