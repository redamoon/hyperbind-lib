<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { binder } from "@hyperbind-lib/core";
import { useKeybindId } from "./useKeybindId";

/**
 * FormNavigatorコンポーネントのプロパティ
 */
interface FormNavigatorProps {
  /** フォーム内の入力要素への参照の配列 */
  inputRefs: Array<{ value: HTMLInputElement | null }>;
}

const props = defineProps<FormNavigatorProps>();

// 同一ミリ秒内に複数マウントされてもIDが衝突しないよう、
// コンポーネントインスタンスごとに一意な安定IDをsetup時に一度だけ生成する
const baseId = useKeybindId("form-navigator");
const idTab = `${baseId}-tab`;
const idTabShift = `${baseId}-shift`;
const idEnter = `${baseId}-enter`;

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
// IME入力中のガードは KeybindManager 側で一元的に行っている
const handleEnter = (event: KeyboardEvent) => {
  const active = document.activeElement;

  // FormNavigatorで管理されている入力フィールドの場合のみ処理
  if (
    active instanceof HTMLInputElement ||
    active instanceof HTMLSelectElement ||
    active instanceof HTMLButtonElement
  ) {
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
// （インラインの配列リテラルを渡されても登録・解除が繰り返されない）
onMounted(() => {
  // Tab / Shift+Tab は preventDefault: false で登録し、
  // 管理対象の要素にフォーカスがある場合のみハンドラ内でpreventDefaultする
  // （preventDefault: true で登録すると、KeybindManagerがコールバックより先に
  //   preventDefault()を実行するため、フォーム外でもTabによるフォーカス移動が死ぬ）
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
