import React from "react";
import { useDisableKeyBindsWhileMounted } from "@hyperbind/react";

export const CalendarModal = ({ onClose }: { onClose: () => void }) => {
  useDisableKeyBindsWhileMounted();

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h3>📅 カレンダー</h3>
        <p>このモーダルが開いている間、キーバインドは無効化されます。</p>
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
  minWidth: "300px",
};
