import { useState, useRef, useEffect, useCallback } from "react";
import { useKeybind, useCustomKeybinds, useModalKeybind, KeybindList, useInputKeybind, InputWithKeybind, useGlobalKeybindToggle } from "@hyperbind/react";
import { KeyConfig } from "./KeyConfig";
import { KeyRecorder } from "@hyperbind/react";
import { CalendarModal } from "./CalendarModal";
import { HelpDialog } from "./HelpDialog";
import { FormNavigator } from "@hyperbind/react";
import { OrderForm } from "./OrderForm";

const STORAGE_KEY = "hyperbind_demo_bindings";

type TabType = "order" | "keybind-demo" | "custom-keybind" | "form-demo";

export const App = () => {
  const [bindings, setBindings] = useState({ save: "cmd+s" });
  const [showCalendar, setShowCalendar] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("order");
  
  // グローバルキーバインドのON/OFF制御
  const { isEnabled, toggle } = useGlobalKeybindToggle();

  const input1 = useRef<HTMLInputElement>(null);
  const input2 = useRef<HTMLInputElement>(null);
  const input3 = useRef<HTMLInputElement>(null);
  
  // useInputKeybind のデモ用
  const searchInput = useRef<HTMLInputElement>(null);
  const inputWithKeybindRef = useRef<HTMLInputElement>(null);
  const [searchResults, setSearchResults] = useState<string[]>([]);

  // Cmd+Enter (Mac) / Ctrl+Enter (Windows/Linux) キーで検索を実行
  const handleSearch = useCallback(() => {
    if (searchInput.current) {
      const query = searchInput.current.value;
      if (query.trim()) {
        alert(`🔍 検索: "${query}"`);
        setSearchResults([`結果1: ${query}`, `結果2: ${query}関連`, `結果3: ${query}について`]);
      }
    }
  }, []);

  // 検索のときに実行される（keybind-demoタブでのみ有効）
  useInputKeybind({
    elementRef: searchInput,
    keyCombo: "cmd+enter", // KeybindManagerが自動的にctrl+enterにも対応
    onTrigger: handleSearch,
    enabled: activeTab === "keybind-demo",
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setBindings(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings));
  }, [bindings]);

  useKeybind(bindings.save, () => alert("💾 保存しました！"));

  // F5でヘルプダイアログを開く
  useModalKeybind({
    keyCombo: "f5",
    onOpen: () => setShowHelp(true),
    onClose: () => setShowHelp(false),
    isOpen: showHelp,
  });

  // カスタムキーバインド管理
  const {
    keybinds,
    addKeybind,
    removeKeybind,
    updateKeybind,
    toggleKeybind,
    togglePreventDefault,
  } = useCustomKeybinds({
    onTrigger: (id) => {
      const kb = keybinds.find((k) => k.id === id);
      if (kb) {
        alert(`🎯 ${kb.label} が実行されました！`);
      }
    },
  });

  return (
    <div style={{ padding: "2rem" }}>
      <h1>🎹 HyperBind 完全デモ</h1>

      <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <button onClick={() => setShowCalendar(true)}>📅 カレンダー</button>
        <button onClick={() => setShowHelp(true)}>❓ ヘルプ</button>
        
        <button
          onClick={toggle}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: isEnabled ? "#4CAF50" : "#f44336",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
            marginLeft: "auto",
          }}
          title={isEnabled ? "キーバインドを無効化" : "キーバインドを有効化"}
        >
          {isEnabled ? "⌨️ キーバインド: ON" : "🚫 キーバインド: OFF"}
        </button>
      </div>
      
      {!isEnabled && (
        <div
          style={{
            padding: "1rem",
            backgroundColor: "#fff3cd",
            border: "1px solid #ff9800",
            borderRadius: "4px",
            marginBottom: "1rem",
            color: "#856404",
          }}
        >
          ⚠️ キーバインドが無効化されています。すべてのキーボードショートカットが動作しません。
        </div>
      )}

      {/* タブ切り替え */}
      <div style={{ marginBottom: "2rem", borderBottom: "2px solid #ddd" }}>
        <button
          onClick={() => setActiveTab("order")}
          style={{
            padding: "0.75rem 1.5rem",
            border: "none",
            borderBottom: activeTab === "order" ? "3px solid #4CAF50" : "none",
            background: activeTab === "order" ? "#f5f5f5" : "transparent",
            cursor: "pointer",
            fontWeight: activeTab === "order" ? "bold" : "normal",
          }}
        >
          📋 受注伝票
        </button>
        <button
          onClick={() => setActiveTab("keybind-demo")}
          style={{
            padding: "0.75rem 1.5rem",
            border: "none",
            borderBottom: activeTab === "keybind-demo" ? "3px solid #4CAF50" : "none",
            background: activeTab === "keybind-demo" ? "#f5f5f5" : "transparent",
            cursor: "pointer",
            fontWeight: activeTab === "keybind-demo" ? "bold" : "normal",
          }}
        >
          🎯 入力専用キーバインド
        </button>
        <button
          onClick={() => setActiveTab("custom-keybind")}
          style={{
            padding: "0.75rem 1.5rem",
            border: "none",
            borderBottom: activeTab === "custom-keybind" ? "3px solid #4CAF50" : "none",
            background: activeTab === "custom-keybind" ? "#f5f5f5" : "transparent",
            cursor: "pointer",
            fontWeight: activeTab === "custom-keybind" ? "bold" : "normal",
          }}
        >
          ⚙️ カスタムキーバインド
        </button>
        <button
          onClick={() => setActiveTab("form-demo")}
          style={{
            padding: "0.75rem 1.5rem",
            border: "none",
            borderBottom: activeTab === "form-demo" ? "3px solid #4CAF50" : "none",
            background: activeTab === "form-demo" ? "#f5f5f5" : "transparent",
            cursor: "pointer",
            fontWeight: activeTab === "form-demo" ? "bold" : "normal",
          }}
        >
          📝 フォーム入力
        </button>
      </div>

      {/* 受注伝票タブ */}
      {activeTab === "order" && <OrderForm />}

      {/* 入力専用キーバインドデモタブ */}
      {activeTab === "keybind-demo" && (
        <>
          <h2 style={{ marginTop: "2rem" }}>入力フィールド専用キーバインドデモ</h2>
          <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "1rem" }}>
            特定の入力フィールドに個別のキーバインドを設定できます。Cmd+Enter (Mac) / Ctrl+Enter (Windows/Linux) キーで検索が実行されます。
          </p>
          <div style={{ marginBottom: "2rem" }}>
            <label>
              検索:
              <input
                ref={searchInput}
                type="text"
                placeholder="検索キーワードを入力して⌘+Enterを押す"
                style={{ marginLeft: "0.5rem", padding: "0.5rem", width: "300px" }}
              />
            </label>
            {searchResults.length > 0 && (
              <ul style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
                {searchResults.map((result, i) => (
                  <li key={i}>{result}</li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ marginBottom: "2rem" }}>
            <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.5rem" }}>
              InputWithKeybindコンポーネントを使用した例（Command+Kでフォーカス）:
            </p>
            <InputWithKeybind
              ref={inputWithKeybindRef}
              triggerKey="cmd+k"
              onKeyPress={() => {
                alert("⌘K が押されました！フォーカスされました。");
              }}
              placeholder="⌘Kを押してください"
              style={{ padding: "0.5rem", width: "300px" }}
            />
          </div>
        </>
      )}

      {/* カスタムキーバインド管理タブ */}
      {activeTab === "custom-keybind" && (
        <>
          <KeyConfig bindings={bindings} onChange={(v) => setBindings(v as typeof bindings)}>
            <label>
              保存キー:
              <KeyRecorder
                value={bindings.save}
                onChange={(v) => setBindings({ ...bindings, save: v })}
              />
            </label>
          </KeyConfig>

          <h2 style={{ marginTop: "2rem" }}>カスタムキーバインド管理</h2>
          <p style={{ fontSize: "0.9rem", color: "#666" }}>
            独自のキーバインドを追加・管理できます。F5キーでヘルプを開閉できます。
          </p>
          <button
            onClick={() =>
              addKeybind({
                label: "新しいアクション",
                keyCombo: "ctrl+k",
                enabled: true,
                preventDefault: true,
              })
            }
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#4CAF50",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            ➕ キーバインドを追加
          </button>
          <KeybindList
            keybinds={keybinds}
            onToggle={toggleKeybind}
            onTogglePreventDefault={togglePreventDefault}
            onRemove={removeKeybind}
            onUpdate={updateKeybind}
          />
        </>
      )}

      {/* フォーム入力デモタブ */}
      {activeTab === "form-demo" && (
        <>
          <h2 style={{ marginTop: "2rem" }}>フォーム入力デモ</h2>
          <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "1rem" }}>
            EnterキーまたはTabキーで次の入力フィールドへ移動できます。
          </p>
          
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>
              名前:
              <input 
                ref={input1} 
                type="text" 
                style={{ marginLeft: "0.5rem", padding: "0.5rem", width: "300px" }}
              />
              <span style={{ marginLeft: "1rem", fontSize: "0.9rem", color: "#666" }}>
                Enter: 次へ移動
              </span>
            </label>
          </div>
          
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>
              メール:
              <input 
                ref={input2} 
                type="email" 
                style={{ marginLeft: "0.5rem", padding: "0.5rem", width: "300px" }}
              />
              <span style={{ marginLeft: "1rem", fontSize: "0.9rem", color: "#666" }}>
                Enter: 次へ移動
              </span>
            </label>
          </div>
          
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>
              電話:
              <input 
                ref={input3} 
                type="tel" 
                style={{ marginLeft: "0.5rem", padding: "0.5rem", width: "300px" }}
              />
              <span style={{ marginLeft: "1rem", fontSize: "0.9rem", color: "#666" }}>
                Enter: 先頭へ戻る
              </span>
            </label>
          </div>

          <FormNavigator inputRefs={[input1, input2, input3]} />
          
          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "1.5rem",
              backgroundColor: "#f9f9f9",
              marginTop: "2rem",
            }}
          >
            <h3 style={{ marginTop: 0 }}>📋 キーボードショートカット</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem" }}>
              <div><strong>Enter:</strong> 次の入力フィールドへ移動</div>
              <div><strong>Tab:</strong> 次の入力フィールドへ移動</div>
              <div><strong>Shift+Tab:</strong> 前の入力フィールドへ移動</div>
            </div>
          </div>
        </>
      )}

      {showCalendar && (
        <CalendarModal onClose={() => setShowCalendar(false)} />
      )}
      {showHelp && <HelpDialog onClose={() => setShowHelp(false)} />}
    </div>
  );
};
