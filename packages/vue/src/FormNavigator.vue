<script setup lang="ts">
import { getCurrentInstance, onMounted, onUnmounted } from "vue";
import { binder } from "@hyperbind-lib/core";

/**
 * FormNavigatorコンポーネントのプロパティ
 */
interface FormNavigatorProps {
  /** フォーム内の入力要素への参照の配列 */
  inputRefs: Array<{ value: HTMLInputElement | null }>;
}

const props = defineProps<FormNavigatorProps>();

// インスタンスごとに安定したID（同一ミリ秒に複数マウントしても衝突しない）
const uid = getCurrentInstance()?.uid ?? 0;
const idTab = `form-navigator-tab-${uid}`;
const idTabShift = `form-navigator-tab-shift-${uid}`;
const idEnter = `form-navigator-enter-${uid}`;

/**
 * フォーカス中の要素がFormNavigatorの管理対象なら、そのインデックスを返す
 * 管理対象でない場合は -1
 */
const activeIndex = () => {
  const active = document.activeElement;

  // テキストエリアや複数行入力の場合は何もしない
  if (active instanceof HTMLTextAreaElement) {
    return -1;
  }

  return props.inputRefs.findIndex((ref) => ref.value === active);
};

/** nullの要素をスキップして、移動先の要素を探す（見つからない場合はnull） */
const findTarget = (index: number, step: number) => {
  const refs = props.inputRefs;
  let nextIndex = index;
  for (let attempts = 0; attempts < refs.length; attempts++) {
    nextIndex = (nextIndex + step + refs.length) % refs.length;
    const nextElement = refs[nextIndex]?.value;
    if (nextElement) {
      return nextElement;
    }
  }
  return null;
};

/**
 * 管理対象の要素にフォーカスがある場合のみ移動する
 *
 * 管理対象外の場合はpreventDefaultせずに返すため、
 * フォーム外ではブラウザ既定のフォーカス移動がそのまま動く
 */
const moveFocus = (event: KeyboardEvent, step: number) => {
  const index = activeIndex();
  if (index < 0) {
    return;
  }
  const target = findTarget(index, step);
  if (!target) {
    return;
  }
  event.preventDefault();
  target.focus();
};

const moveNext = (event: KeyboardEvent) => moveFocus(event, 1);
const movePrev = (event: KeyboardEvent) => moveFocus(event, -1);

// Enter キーは管理されている要素でのみ preventDefault
// すべての入力フィールドでEnterを処理（useInputKeybindは特定の要素にのみ反応）
// IME入力中かどうかのガードは core の handleKey で一元的に行われる
const handleEnter = (event: KeyboardEvent) => {
  const active = document.activeElement;

  // FormNavigatorで管理されている入力フィールドの場合のみ処理
  if (active instanceof HTMLInputElement || active instanceof HTMLSelectElement || active instanceof HTMLButtonElement) {
    // data-form-navigator-skip属性がある場合はスキップ（独自のEnterキー処理がある場合）
    if (active.hasAttribute("data-form-navigator-skip")) {
      return;
    }
    // セレクトボックスの場合、独自のonKeyDownハンドラでevent.stopPropagation()が呼ばれている場合は
    // この処理は実行されない（イベントが伝播しないため）
    // FormNavigatorで管理されていない要素（searchInputなど）の場合は何もしない
    moveFocus(event, 1);
  }
};

// ハンドラはpropsを実行時に参照するため、inputRefsが差し替わっても再登録は不要
onMounted(() => {
  // Tab / Shift+Tab は preventDefault: false で登録し、
  // 管理対象の要素にフォーカスがある場合のみハンドラ内でpreventDefaultする
  binder.registerWithId(idTab, "tab", moveNext, { preventDefault: false });
  binder.registerWithId(idTabShift, "shift+tab", movePrev, { preventDefault: false });
  binder.registerWithId(idEnter, "enter", handleEnter, { preventDefault: false });
});

onUnmounted(() => {
  binder.unregisterById(idTab);
  binder.unregisterById(idTabShift);
  binder.unregisterById(idEnter);
});
</script>

<template>
  <!-- FormNavigatorは非表示コンポーネント -->
</template>
