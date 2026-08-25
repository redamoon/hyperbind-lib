import { getCurrentInstance } from "vue";

/**
 * setup外で呼ばれた場合のフォールバック用カウンタ
 */
let fallbackCounter = 0;

/**
 * 同一コンポーネント内で同じcomposableを複数回呼んでも衝突しないための連番
 */
let sequence = 0;

/**
 * コンポーネントインスタンスに紐づく安定したキーバインドIDを生成します
 *
 * `getCurrentInstance().uid`をベースにするため、
 * 同じコンポーネントが複数マウントされてもIDが衝突しません。
 * setup時に一度だけ評価し、watchの再実行をまたいで同じIDを使い回してください。
 *
 * @param prefix - IDの接頭辞（例: "modal"）
 * @returns 生成されたID（例: "modal-12-3"）
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useKeybindId } from '@hyperbind-lib/vue';
 *
 * const id = useKeybindId('my-keybind');
 * </script>
 * ```
 */
export const useKeybindId = (prefix: string): string => {
  const instance = getCurrentInstance();
  const scope = instance ? instance.uid : `x${++fallbackCounter}`;
  return `${prefix}-${scope}-${++sequence}`;
};
