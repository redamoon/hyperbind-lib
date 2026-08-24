import React, { useState, useEffect } from "react";
import { isReservedKey, getReservedKeyWarning } from "./reservedKeys";
import { binder, keyComboFromEvent } from "@hyperbind-lib/core";

/**
 * KeyRecorderコンポーネントのプロパティ
 */
export interface KeyRecorderProps {
  /** 現在のキーの組み合わせ */
  value: string;
  /** キーが記録されたときに呼ばれる関数 */
  onChange: (key: string) => void;
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
 * @param props - コンポーネントのプロパティ
 * 
 * @example
 * ```tsx
 * function KeybindSettings() {
 *   const [keyCombo, setKeyCombo] = useState('ctrl+s');
 *   
 *   return (
 *     <div>
 *       <label>
 *         キーバインド:
 *         <KeyRecorder
 *           value={keyCombo}
 *           onChange={setKeyCombo}
 *           showWarning={true}
 *         />
 *       </label>
 *     </div>
 *   );
 * }
 * ```
 */
export const KeyRecorder = ({
  value,
  onChange,
  showWarning = false,
  onWarning,
}: KeyRecorderProps) => {
  const [recording, setRecording] = useState(false);

  // 記録中は KeybindManager を無効化して、他のキーバインドが発火しないようにする
  useEffect(() => {
    if (recording) {
      binder.disable();
      return () => {
        binder.enable();
      };
    }
  }, [recording]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
      if (onWarning) {
        onWarning(
          "修飾キー（Ctrl / Cmd / Shift / Alt）を組み合わせてください。単独のキーは既定では発火しません。"
        );
      }
      return;
    }

    // 予約キーチェック
    if (onWarning || showWarning) {
      const warning = getReservedKeyWarning(newKey);
      if (onWarning) {
        onWarning(warning);
      }
    }

    onChange(newKey);
    setRecording(false);
  };

  return (
    <input
      type="text"
      readOnly
      value={recording ? "押してください..." : value}
      onFocus={() => setRecording(true)}
      onKeyDown={handleKeyDown}
      style={{
        marginLeft: "0.5rem",
        width: "200px",
        cursor: "pointer",
      }}
    />
  );
};
