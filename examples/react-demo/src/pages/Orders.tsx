import React from "react";
import { Link } from "react-router-dom";
import { OrderForm } from "../OrderForm";
import { useGlobalKeybindToggle } from "@hyperbind-lib/react";

export const Orders = () => {
  const { isEnabled, toggle } = useGlobalKeybindToggle();

  return (
    <div>
      <div style={{ padding: "2rem 2rem 0 2rem", maxWidth: "1400px", margin: "0 auto", display: "flex", alignItems: "center", gap: "1rem" }}>
        <Link to="/" style={{ color: "#2196F3", textDecoration: "none" }}>
          ← トップに戻る
        </Link>
        <button 
          onClick={toggle}
          style={{
            backgroundColor: isEnabled ? "#4CAF50" : "#f44336",
            color: "white",
            border: "none",
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {isEnabled ? "✓ キーバインド: ON" : "✗ キーバインド: OFF"}
        </button>
      </div>
      <OrderForm isActive={true} />
    </div>
  );
};

