import React, { useState } from "react";
import { isReservedKey, getReservedKeyWarning } from "./reservedKeys";

export interface KeyRecorderProps {
  value: string;
  onChange: (key: string) => void;
  showWarning?: boolean;
  onWarning?: (warning: string | null) => void;
}

export const KeyRecorder = ({
  value,
  onChange,
  showWarning = false,
  onWarning,
}: KeyRecorderProps) => {
  const [recording, setRecording] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
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

  const warning = showWarning ? getReservedKeyWarning(value) : null;

  return (
    <div style={{ position: "relative" }}>
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
          borderColor: warning ? "#ff9800" : undefined,
        }}
      />
      {warning && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: "0.5rem",
            marginTop: "0.25rem",
            padding: "0.5rem",
            backgroundColor: "#fff3cd",
            border: "1px solid #ff9800",
            borderRadius: "4px",
            fontSize: "0.8rem",
            color: "#856404",
            zIndex: 1000,
            maxWidth: "300px",
          }}
        >
          ⚠️ {warning}
        </div>
      )}
    </div>
  );
};
