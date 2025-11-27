<script setup lang="ts">
import { ref } from "vue";
import { useInputKeybind, type UseInputKeybindOptions } from "./useInputKeybind";

/**
 * InputWithKeybindコンポーネントのプロパティ
 * 
 * 通常のinput要素のすべてのプロパティに加えて、
 * キーバインド機能を提供するための追加プロパティを含みます。
 */
interface InputWithKeybindProps extends Omit<UseInputKeybindOptions, "elementRef"> {
  /** キーの組み合わせ（デフォルト: "Enter"） */
  triggerKey?: string;
  /** キーが押されたときに実行されるコールバック関数 */
  onKeyPress?: () => void;
  /** キーバインドを有効にするか（デフォルト: true） */
  keybindEnabled?: boolean;
  /** デフォルトのブラウザ動作を防ぐか（デフォルト: true） */
  preventDefault?: boolean;
}

const props = withDefaults(defineProps<InputWithKeybindProps>(), {
  triggerKey: "Enter",
  keybindEnabled: true,
  preventDefault: true,
});

const inputRef = ref<HTMLInputElement | null>(null);

useInputKeybind({
  elementRef: inputRef,
  keyCombo: props.triggerKey,
  onTrigger: props.onKeyPress || (() => {}),
  enabled: props.keybindEnabled,
  preventDefault: props.preventDefault,
});
</script>

<template>
  <input ref="inputRef" v-bind="$attrs" />
</template>

