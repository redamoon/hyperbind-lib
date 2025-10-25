import React, { useState } from "react";

export const KeyRecorder = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (key: string) => void;
}) => {
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
    onChange(parts.join("+"));
    setRecording(false);
  };

  return (
    <input
      type="text"
      readOnly
      value={recording ? "押してください..." : value}
      onFocus={() => setRecording(true)}
      onKeyDown={handleKeyDown}
      style={{ marginLeft: "0.5rem", width: "200px", cursor: "pointer" }}
    />
  );
};
