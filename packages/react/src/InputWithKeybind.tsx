import React, { useRef } from "react";
import { useInputKeybind, UseInputKeybindOptions } from "./useInputKeybind";

export interface InputWithKeybindProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** キー組み合わせ（デフォルト: "Enter"） */
  triggerKey?: string;
  /** キーが押されたときに実行されるコールバック */
  onKeyPress?: () => void;
  /** キーバインドを有効にするか（デフォルト: true） */
  keybindEnabled?: boolean;
  /** preventDefaultを実行するか（デフォルト: true） */
  preventDefault?: boolean;
}

/**
 * キーバインド機能付きの入力フィールドコンポーネント
 * 
 * @example
 * ```tsx
 * <InputWithKeybind
 *   placeholder="名前を入力"
 *   triggerKey="Enter"
 *   onKeyPress={() => console.log("Enterが押されました！")}
 * />
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
