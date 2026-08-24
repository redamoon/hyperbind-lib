import React, { useState, useEffect, useCallback } from "react";
import { getReservedKeyWarning } from "./reservedKeys";
import { binder, buildKeyComboFromEvent, isModifierKey } from "@hyperbind-lib/core";

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
  /** ボタン要素に付与するクラス名 */
  className?: string;
  /** ボタン要素に適用するスタイル（既定のスタイルにマージされる） */
  style?: React.CSSProperties;
}

/** スクリーンリーダー専用（視覚的には非表示）のスタイル */
const visuallyHidden: React.CSSProperties = {
  position: "absolute",
  width: "1px",
  height: "1px",
  margin: "-1px",
  padding: 0,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
};

/**
 * キーボード入力を記録するコンポーネント
 *
 * ユーザーがキーを押すと、その組み合わせ（"ctrl+s"など）を記録します。
 * 予約キー（ブラウザやOSで使用されるキー）の使用時には警告を表示します。
 * 記録中は他のキーバインドを一時的に無効化します。
 *
 * フォーカス（またはクリック / Enter）で記録が始まり、Escapeキーを押すか
 * フォーカスが外れると記録を確定せずに終了します。Shiftなどの修飾キー単独では
 * 確定せず、押下中の修飾キーを表示するだけにとどめます。
 *
 * 見た目は `className` / `style` で上書きできるほか、
 * 以下のCSS変数でテーマを変更できます。
 * `--hyperbind-recorder-bg` / `--hyperbind-recorder-recording-bg` /
 * `--hyperbind-recorder-color` / `--hyperbind-recorder-border` /
 * `--hyperbind-recorder-radius` / `--hyperbind-recorder-width` /
 * `--hyperbind-recorder-padding` / `--hyperbind-recorder-font-size`
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
  className,
  style,
}: KeyRecorderProps) => {
  const [recording, setRecording] = useState(false);
  // 記録中に押されている修飾キー（例: "ctrl+shift"）
  const [pressedModifiers, setPressedModifiers] = useState("");
  // スクリーンリーダーへの状態通知
  const [status, setStatus] = useState("");

  // 記録中は KeybindManager を無効化して、他のキーバインドが発火しないようにする
  useEffect(() => {
    if (recording) {
      binder.disable();
      return () => {
        binder.enable();
      };
    }
  }, [recording]);

  const startRecording = useCallback(() => {
    setRecording(true);
    setPressedModifiers("");
    setStatus("キーを記録しています。記録したいキーを押してください。Escapeキーで取り消します。");
  }, []);

  /** 確定せずに記録を終了する */
  const cancelRecording = useCallback((message: string) => {
    setRecording(false);
    setPressedModifiers("");
    setStatus(message);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    // 記録していないときは Enter / Space をボタンのクリックとして扱う
    if (!recording) return;

    e.preventDefault();
    e.stopPropagation(); // イベントの伝播を完全に停止

    // Escapeは記録のキャンセルに割り当てているため、キーバインドとしては記録しない
    if (e.key === "Escape") {
      cancelRecording("記録を取り消しました。");
      return;
    }

    // Shift / Control / Alt / Meta / CapsLock などの修飾キー単独では確定しない
    if (isModifierKey(e.key)) {
      const modifiers = buildKeyComboFromEvent(e.nativeEvent);
      setPressedModifiers(modifiers);
      setStatus(modifiers ? `${modifiers} を押しています。` : "");
      return;
    }

    // KeybindManagerと同じ順序・同じ正規化でキーの組み合わせを組み立てる
    const newKey = buildKeyComboFromEvent(e.nativeEvent);

    // 予約キーチェック
    if (onWarning || showWarning) {
      const warning = getReservedKeyWarning(newKey);
      if (onWarning) {
        onWarning(warning);
      }
    }

    onChange(newKey);
    setRecording(false);
    setPressedModifiers("");
    setStatus(`${newKey} を記録しました。`);
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!recording) return;
    // 修飾キーを離したときは表示を更新する
    if (isModifierKey(e.key)) {
      setPressedModifiers(buildKeyComboFromEvent(e.nativeEvent));
    }
  };

  const handleBlur = () => {
    // フォーカスが外れたまま recording が true で残ると binder.enable() が呼ばれず、
    // アプリ全体のキーバインドが無効のまま復帰しなくなる
    if (recording) {
      cancelRecording("記録を終了しました。");
    }
  };

  const displayValue = recording
    ? pressedModifiers
      ? `${pressedModifiers}+…`
      : "キーを押してください..."
    : value || "未設定";

  const label = recording
    ? "キーの組み合わせを記録中です。記録したいキーを押してください。Escapeキーで取り消します。"
    : `キーバインド: ${value || "未設定"}。Enterキーまたはクリックで記録を開始します。`;

  return (
    <span className="hyperbind-key-recorder">
      <button
        type="button"
        className={className}
        aria-label={label}
        aria-pressed={recording}
        onFocus={startRecording}
        onBlur={handleBlur}
        onClick={() => {
          if (!recording) {
            startRecording();
          }
        }}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        style={{
          marginLeft: "0.5rem",
          width: "var(--hyperbind-recorder-width, 200px)",
          padding: "var(--hyperbind-recorder-padding, 0.25rem 0.5rem)",
          fontSize: "var(--hyperbind-recorder-font-size, inherit)",
          fontFamily: "inherit",
          textAlign: "left",
          cursor: "pointer",
          color: "var(--hyperbind-recorder-color, inherit)",
          border: "var(--hyperbind-recorder-border, 1px solid #ccc)",
          borderRadius: "var(--hyperbind-recorder-radius, 3px)",
          backgroundColor: recording
            ? "var(--hyperbind-recorder-recording-bg, #fff8e1)"
            : "var(--hyperbind-recorder-bg, #fff)",
          ...style,
        }}
      >
        {displayValue}
      </button>
      <span role="status" aria-live="polite" style={visuallyHidden}>
        {status}
      </span>
    </span>
  );
};
