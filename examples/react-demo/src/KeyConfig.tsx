import React from "react";

export const KeyConfig = ({
  children,
}: {
  bindings?: Record<string, string>;
  onChange?: (v: Record<string, string>) => void;
  children?: React.ReactNode;
}) => (
  <div style={{ marginTop: "1.5rem" }}>
    <h2>⚙️ キーバインド設定</h2>
    {children}
    <p style={{ fontSize: "0.9rem", color: "#666" }}>
      設定はブラウザに保存されます
    </p>
  </div>
);
