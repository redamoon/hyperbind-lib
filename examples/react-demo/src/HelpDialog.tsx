import React from "react";
import { useDisableKeyBindsWhileMounted } from "@hyperbind-lib/react";

export const HelpDialog = ({ onClose }: { onClose: () => void }) => {
  useDisableKeyBindsWhileMounted();

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h3>❓ ヘルプ</h3>
        <ul style={{ textAlign: "left" }}>
          <li>キーを記録するには、テキストフィールドをクリックしてキーを押してください</li>
          <li>Cmd+S (Mac) / Ctrl+S (Windows/Linux) で保存のデモを実行できます</li>
          <li>フォームではEnter/Tabで次のフィールドに移動します</li>
          <li>MacとWindows/Linuxのキーの違いを自動的に吸収します</li>
          <li>このダイアログ表示中はキーバインドが無効化されます</li>
        </ul>
        <button onClick={onClose}>閉じる</button>
      </div>
    </div>
  );
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
  background: "#fff",
  padding: "2rem",
  borderRadius: "8px",
  minWidth: "400px",
};
