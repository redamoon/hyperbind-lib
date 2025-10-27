import React, { useState } from "react";
import { CustomKeybind } from "./useCustomKeybinds";
import { KeyRecorder } from "./KeyRecorder";
import { isReservedKey } from "./reservedKeys";

/**
 * KeybindListコンポーネントのプロパティ
 */
export interface KeybindListProps {
  /** 表示するキーバインドの配列 */
  keybinds: CustomKeybind[];
  /** キーバインドの有効/無効を切り替えるときに呼ばれる関数 */
  onToggle: (id: string) => void;
  /** preventDefaultの有効/無効を切り替えるときに呼ばれる関数 */
  onTogglePreventDefault: (id: string) => void;
  /** キーバインドを削除するときに呼ばれる関数 */
  onRemove: (id: string) => void;
  /** キーバインドを更新するときに呼ばれる関数 */
  onUpdate: (id: string, updates: Partial<CustomKeybind>) => void;
}

/**
 * カスタムキーバインドの一覧を表示・編集するコンポーネント
 * 
 * 各キーバインドに対して以下の操作が可能です：
 * - 有効/無効の切り替え
 * - ラベルとキーの組み合わせの編集
 * - preventDefaultの切り替え
 * - 削除
 * 
 * 予約キーを使用している場合は、視覚的に警告を表示します。
 * 
 * @param props - コンポーネントのプロパティ
 * 
 * @example
 * ```tsx
 * function KeybindSettings() {
 *   const {
 *     keybinds,
 *     toggleKeybind,
 *     togglePreventDefault,
 *     removeKeybind,
 *     updateKeybind,
 *   } = useCustomKeybinds();
 *   
 *   return (
 *     <KeybindList
 *       keybinds={keybinds}
 *       onToggle={toggleKeybind}
 *       onTogglePreventDefault={togglePreventDefault}
 *       onRemove={removeKeybind}
 *       onUpdate={updateKeybind}
 *     />
 *   );
 * }
 * ```
 */
export const KeybindList = ({
  keybinds,
  onToggle,
  onTogglePreventDefault,
  onRemove,
  onUpdate,
}: KeybindListProps) => {
  const [warningMap, setWarningMap] = useState<Record<string, string | null>>({});

  const handleWarning = (id: string, warning: string | null) => {
    setWarningMap((prev) => ({ ...prev, [id]: warning }));
  };

  return (
    <div style={{ marginTop: "1rem" }}>
      {keybinds.length === 0 ? (
        <p style={{ color: "#999", fontSize: "0.9rem" }}>
          キーバインドが登録されていません
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {keybinds.map((kb) => (
            <div
              key={kb.id}
              style={{
                padding: "0.75rem",
                border: isReservedKey(kb.keyCombo) ? "2px solid #ff9800" : "1px solid #ddd",
                borderRadius: "4px",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                backgroundColor: kb.enabled ? "#fff" : "#f5f5f5",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  checked={kb.enabled}
                  onChange={() => onToggle(kb.id)}
                  title="有効/無効"
                />
                <input
                  type="text"
                  value={kb.label}
                  onChange={(e) => onUpdate(kb.id, { label: e.target.value })}
                  style={{
                    flex: 1,
                    padding: "0.25rem 0.5rem",
                    border: "1px solid #ccc",
                    borderRadius: "3px",
                  }}
                  placeholder="ラベル"
                />
                <KeyRecorder
                  value={kb.keyCombo}
                  onChange={(newKey) => onUpdate(kb.id, { keyCombo: newKey })}
                  showWarning
                  onWarning={(warning) => handleWarning(kb.id, warning)}
                />
                <label style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <input
                    type="checkbox"
                    checked={kb.preventDefault}
                    onChange={() => onTogglePreventDefault(kb.id)}
                    title="ブラウザのデフォルト動作を防止"
                  />
                  preventDefault
                </label>
                <button
                  onClick={() => onRemove(kb.id)}
                  style={{
                    padding: "0.25rem 0.5rem",
                    backgroundColor: "#f44336",
                    color: "#fff",
                    border: "none",
                    borderRadius: "3px",
                    cursor: "pointer",
                  }}
                >
                  削除
                </button>
              </div>
              {warningMap[kb.id] && (
                <div
                  style={{
                    padding: "0.5rem",
                    backgroundColor: "#fff3cd",
                    border: "1px solid #ff9800",
                    borderRadius: "3px",
                    fontSize: "0.85rem",
                    color: "#856404",
                  }}
                >
                  ⚠️ {warningMap[kb.id]}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

