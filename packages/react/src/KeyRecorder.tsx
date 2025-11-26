import React, { useState, useEffect } from "react";
import { isReservedKey, getReservedKeyWarning } from "./reservedKeys";
import { binder } from "hyperbind-core";

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
    const parts: string[] = [];
    
    // Macの場合はmetaKey（Cmd）、Windows/Linuxの場合はctrlKey
    // どちらも"cmd"として統一（KeybindManagerで自動的に相互変換される）
    if (e.metaKey) parts.push("cmd");
    if (e.ctrlKey) parts.push("ctrl");
    if (e.shiftKey) parts.push("shift");
    if (e.altKey) parts.push("alt");
    
    parts.push(e.key.toLowerCase());
    const newKey = parts.join("+");
    
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
