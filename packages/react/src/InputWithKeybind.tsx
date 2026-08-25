import React, { useRef } from "react";
import { useInputKeybind } from "./useInputKeybind";

/**
 * InputWithKeybindコンポーネントのプロパティ
 *
 * 通常のinput要素のすべてのプロパティに加えて、
 * キーバインド機能を提供するための追加プロパティを含みます。
 */
export interface InputWithKeybindProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** キーの組み合わせ（デフォルト: "Enter"） */
  triggerKey?: string;
  /** キーが押されたときに実行されるコールバック関数 */
  onKeyPress?: () => void;
  /** キーバインドを有効にするか（デフォルト: true） */
  keybindEnabled?: boolean;
  /** デフォルトのブラウザ動作を防ぐか（デフォルト: true） */
  preventDefault?: boolean;
}

/**
 * キーバインド機能付きの入力フィールドコンポーネント
 *
 * 標準のHTML input要素に、カスタムキーバインド機能を追加したコンポーネントです。
 * 特定のキーが押されたときにコールバック関数を実行できます。
 *
 * 通常のinputプロパティ（placeholder、value、onChangeなど）もすべて使用可能です。
 *
 * @example
 * ```tsx
 * function SearchBox() {
 *   const [query, setQuery] = useState('');
 *
 *   return (
 *     <InputWithKeybind
 *       placeholder="検索ワードを入力"
 *       value={query}
 *       onChange={(e) => setQuery(e.target.value)}
 *       triggerKey="cmd+enter"
 *       onKeyPress={() => {
 *         console.log('検索実行:', query);
 *       }}
 *     />
 *   );
 * }
 * ```
 */
export const InputWithKeybind = React.forwardRef<HTMLInputElement, InputWithKeybindProps>(
  (
    {
      triggerKey = "Enter",
      onKeyPress,
      keybindEnabled = true,
      preventDefault = true,
      ...inputProps
    },
    ref
  ) => {
    const internalRef = useRef<HTMLInputElement>(null);
    const inputRef = (ref || internalRef) as React.RefObject<HTMLInputElement>;

    useInputKeybind({
      elementRef: inputRef,
      keyCombo: triggerKey,
      onTrigger: onKeyPress || (() => {}),
      enabled: keybindEnabled,
      preventDefault,
    });

    return <input {...inputProps} ref={inputRef} />;
  }
);

InputWithKeybind.displayName = "InputWithKeybind";
