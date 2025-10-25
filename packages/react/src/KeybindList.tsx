import React from "react";
import { CustomKeybind } from "./useCustomKeybinds";
import { KeyRecorder } from "./KeyRecorder";

export interface KeybindListProps {
  keybinds: CustomKeybind[];
  onToggle: (id: string) => void;
  onTogglePreventDefault: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<CustomKeybind>) => void;
}

export const KeybindList = ({
  keybinds,
  onToggle,
  onTogglePreventDefault,
  onRemove,
  onUpdate,
}: KeybindListProps) => {
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
                border: "1px solid #ddd",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                backgroundColor: kb.enabled ? "#fff" : "#f5f5f5",
              }}
            >
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
          ))}
        </div>
      )}
    </div>
  );
};

