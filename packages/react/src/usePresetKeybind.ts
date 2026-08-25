import { useEffect, useId } from "react";
import { binder } from "@hyperbind-lib/core";
import { getKeybindById } from "@hyperbind-lib/core";

/**
 * プリセットキーバインドを使用するReactフック
 *
 * プリセットIDを指定して、処理（callback）だけを定義できます。
 * キーの組み合わせとpreventDefault設定は、プリセット定義から自動的に取得されます。
 *
 * @param presetId - プリセットキーバインドのID（例: 'common-help', 'search-show'）
 * @param callback - キー押下時に実行される関数
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   // プリセットIDを指定して、処理だけを定義
 *   usePresetKeybind('common-help', () => {
 *     // F1キーが押された時の処理
 *     showHelpDialog();
 *   });
 *
 *   usePresetKeybind('search-show', () => {
 *     // F3キーが押された時の処理
 *     openSearchDialog();
 *   });
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export const usePresetKeybind = (presetId: string, callback: () => void) => {
  // 同じプリセットを複数のコンポーネントで使ってもIDが衝突しないよう、
  // コンポーネントインスタンスごとに一意なuseId()を組み合わせる
  const uid = useId();

  useEffect(() => {
    const preset = getKeybindById(presetId);

    if (!preset) {
      console.warn(`Preset keybind with id "${presetId}" not found.`);
      return;
    }

    const id = `preset-${presetId}-${uid}`;

    binder.registerWithId(id, preset.keyCombo, callback, { preventDefault: preset.preventDefault });

    return () => {
      binder.unregisterById(id);
    };
  }, [presetId, callback, uid]);
};
