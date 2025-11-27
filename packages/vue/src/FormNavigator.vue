<script setup lang="ts">
import { watch, onMounted, onUnmounted } from "vue";
import { binder } from "@hyperbind-lib/core";

/**
 * FormNavigatorコンポーネントのプロパティ
 */
interface FormNavigatorProps {
  /** フォーム内の入力要素への参照の配列 */
  inputRefs: Array<{ value: HTMLInputElement | null }>;
}

const props = defineProps<FormNavigatorProps>();

let idTab: string | null = null;
let idTabShift: string | null = null;
let idEnter: string | null = null;

const setupKeybinds = () => {
  // 既存のキーバインドをクリーンアップ
  if (idTab) binder.unregisterById(idTab);
  if (idTabShift) binder.unregisterById(idTabShift);
  if (idEnter) binder.unregisterById(idEnter);

  // FormNavigatorは即座に登録（他のキーバインドより先）
  const moveNext = () => {
    const active = document.activeElement;
    const index = props.inputRefs.findIndex((ref) => ref.value === active);
    
    // テキストエリアや複数行入力の場合は何もしない
    if (active instanceof HTMLTextAreaElement) {
      return;
    }
    
    // FormNavigatorで管理されている要素の場合のみ移動
    if (index >= 0) {
      // nullの要素をスキップして次の有効な要素を見つける
      let nextIndex = (index + 1) % props.inputRefs.length;
      let attempts = 0;
      while (attempts < props.inputRefs.length) {
        const nextElement = props.inputRefs[nextIndex].value;
        if (nextElement) {
          nextElement.focus();
          return;
        }
        nextIndex = (nextIndex + 1) % props.inputRefs.length;
        attempts++;
      }
    }
  };

  const movePrev = () => {
    const active = document.activeElement;
    const index = props.inputRefs.findIndex((ref) => ref.value === active);
    
    // テキストエリアや複数行入力の場合は何もしない
    if (active instanceof HTMLTextAreaElement) {
      return;
    }
    
    // FormNavigatorで管理されている要素の場合のみ移動
    if (index >= 0) {
      // nullの要素をスキップして前の有効な要素を見つける
      let prevIndex = (index - 1 + props.inputRefs.length) % props.inputRefs.length;
      let attempts = 0;
      while (attempts < props.inputRefs.length) {
        const prevElement = props.inputRefs[prevIndex].value;
        if (prevElement) {
          prevElement.focus();
          return;
        }
        prevIndex = (prevIndex - 1 + props.inputRefs.length) % props.inputRefs.length;
        attempts++;
      }
    }
  };

  // Tab キーは通常の動作（フォーカス移動）
  idTab = `form-navigator-tab-${Date.now()}`;
  binder.registerWithId(idTab, "tab", moveNext, { preventDefault: true });
  idTabShift = `${idTab}-shift`;
  binder.registerWithId(idTabShift, "shift+tab", movePrev, { preventDefault: true });
  
  // Enter キーは管理されている要素でのみ preventDefault
  // すべての入力フィールドでEnterを処理（useInputKeybindは特定の要素にのみ反応）
  const handleEnter = (event?: KeyboardEvent) => {
    // IME入力中の場合は何もしない
    if (event && event.isComposing) {
      return;
    }
    
    const active = document.activeElement;
    
    // FormNavigatorで管理されている入力フィールドの場合のみ処理
    if ((active instanceof HTMLInputElement || active instanceof HTMLSelectElement || active instanceof HTMLButtonElement) && active !== document.body) {
      // data-form-navigator-skip属性がある場合はスキップ（独自のEnterキー処理がある場合）
      if (active.hasAttribute('data-form-navigator-skip')) {
        return;
      }
      const currentIndex = props.inputRefs.findIndex((ref) => ref.value === active);
      if (currentIndex >= 0) {
        // FormNavigatorで管理されている要素なので移動
        // セレクトボックスの場合、独自のonKeyDownハンドラでevent.stopPropagation()が呼ばれている場合は
        // この処理は実行されない（イベントが伝播しないため）
        if (event) {
          event.preventDefault();
        }
        // nullの要素をスキップして次の有効な要素を見つける
        let nextIndex = (currentIndex + 1) % props.inputRefs.length;
        let attempts = 0;
        while (attempts < props.inputRefs.length) {
          const nextElement = props.inputRefs[nextIndex].value;
          if (nextElement) {
            nextElement.focus();
            return;
          }
          nextIndex = (nextIndex + 1) % props.inputRefs.length;
          attempts++;
        }
      }
      // FormNavigatorで管理されていない要素（searchInputなど）の場合は何もしない
    }
  };

  idEnter = `form-navigator-enter-${Date.now()}`;
  binder.registerWithId(idEnter, "enter", handleEnter as any, { preventDefault: false });
};

watch(() => props.inputRefs, setupKeybinds, { immediate: true, deep: true });

onUnmounted(() => {
  if (idTab) binder.unregisterById(idTab);
  if (idTabShift) binder.unregisterById(idTabShift);
  if (idEnter) binder.unregisterById(idEnter);
});
</script>

<template>
  <!-- FormNavigatorは非表示コンポーネント -->
</template>

