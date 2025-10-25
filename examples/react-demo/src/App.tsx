import { useState, useRef, useEffect } from "react";
import { useKeybind, useCustomKeybinds, useModalKeybind, KeybindList, useInputKeybind, InputWithKeybind } from "@hyperbind/react";
import { KeyConfig } from "./KeyConfig";
import { KeyRecorder } from "@hyperbind/react";
import { CalendarModal } from "./CalendarModal";
import { HelpDialog } from "./HelpDialog";
import { FormNavigator } from "@hyperbind/react";
import { OrderForm } from "./OrderForm";

const STORAGE_KEY = "hyperbind_demo_bindings";

export const App = () => {
  const [bindings, setBindings] = useState({ save: "cmd+s" });
  const [showCalendar, setShowCalendar] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);

  const input1 = useRef<HTMLInputElement>(null);
  const input2 = useRef<HTMLInputElement>(null);
  const input3 = useRef<HTMLInputElement>(null);
  
  // useInputKeybind のデモ用
  const searchInput = useRef<HTMLInputElement>(null);
  const inputWithKeybindRef = useRef<HTMLInputElement>(null);
  const [searchResults, setSearchResults] = useState<string[]>([]);

  // Cmd+Enter (Mac) / Ctrl+Enter (Windows/Linux) キーで検索を実行
  useInputKeybind({
    elementRef: searchInput,
    keyCombo: "cmd+enter", // KeybindManagerが自動的にctrl+enterにも対応
    onTrigger: () => {
      if (searchInput.current) {
        const query = searchInput.current.value;
        if (query.trim()) {
          alert(`🔍 検索: "${query}"`);
          setSearchResults([`結果1: ${query}`, `結果2: ${query}関連`, `結果3: ${query}について`]);
        }
      }
    },
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

      <div style={{ marginBottom: "1rem" }}>
        <button onClick={() => setShowCalendar(true)}>📅 カレンダー</button>
        <button
          onClick={() => setShowHelp(true)}
          style={{ marginLeft: "1rem" }}
        >
          ❓ ヘルプ
        </button>
        <button
          onClick={() => setShowOrderForm(!showOrderForm)}
          style={{ marginLeft: "1rem" }}
        >
          📋 受注伝票
        </button>
      </div>

      {showOrderForm && <OrderForm />}

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

      <h2 style={{ marginTop: "2rem" }}>フォーム入力デモ</h2>
      <label>
        名前:
        <input ref={input1} type="text" />
      </label>
      <br />
      <label>
        メール:
        <input ref={input2} type="email" />
      </label>
      <br />
      <label>
        電話:
        <input ref={input3} type="tel" />
      </label>

      <FormNavigator inputRefs={[searchInput, inputWithKeybindRef, input1, input2, input3]} />

      {showCalendar && (
        <CalendarModal onClose={() => setShowCalendar(false)} />
      )}
      {showHelp && <HelpDialog onClose={() => setShowHelp(false)} />}
    </div>
  );
};
