import { useState, useRef, useEffect, useCallback } from "react";
import { useKeybind, useCustomKeybinds, useModalKeybind, KeybindList, useInputKeybind, InputWithKeybind, useGlobalKeybindToggle, usePresetKeybind } from "@hyperbind-lib/react";
import { ALL_PRESET_KEYBINDS } from "@hyperbind-lib/core";
import { binder } from "@hyperbind-lib/core";
import { KeyConfig } from "./KeyConfig";
import { KeyRecorder } from "@hyperbind-lib/react";
import { CalendarModal } from "./CalendarModal";
import { HelpDialog } from "./HelpDialog";
import { FormNavigator } from "@hyperbind-lib/react";
import { OrderForm } from "./OrderForm";
import { JournalTab } from "./JournalTab";

const STORAGE_KEY = "hyperbind_demo_bindings";

type TabType = "order" | "keybind-demo" | "custom-keybind" | "form-demo" | "accounting" | "journal";

export const App = () => {
  const [bindings, setBindings] = useState({ save: "cmd+s" });
  const [showCalendar, setShowCalendar] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("accounting");
  
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
          onClick={() => setActiveTab("accounting")}
          style={{
            padding: "0.75rem 1.5rem",
            border: "none",
            borderBottom: activeTab === "accounting" ? "3px solid #4CAF50" : "none",
            background: activeTab === "accounting" ? "#f5f5f5" : "transparent",
            cursor: "pointer",
            fontWeight: activeTab === "accounting" ? "bold" : "normal",
          }}
        >
          💼 会計処理
        </button>
        <button
          onClick={() => setActiveTab("journal")}
          style={{
            padding: "0.75rem 1.5rem",
            border: "none",
            borderBottom: activeTab === "journal" ? "3px solid #4CAF50" : "none",
            background: activeTab === "journal" ? "#f5f5f5" : "transparent",
            cursor: "pointer",
            fontWeight: activeTab === "journal" ? "bold" : "normal",
          }}
        >
          📝 仕訳入力
        </button>
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
      {activeTab === "order" && <OrderForm isActive={activeTab === "order"} />}

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

      {/* 仕訳入力タブ */}
      {activeTab === "journal" && <JournalTab />}

      {/* 会計処理タブ */}
      {activeTab === "accounting" && (
        <AccountingTab />
      )}

      {showCalendar && (
        <CalendarModal onClose={() => setShowCalendar(false)} />
      )}
      {showHelp && <HelpDialog onClose={() => setShowHelp(false)} />}
    </div>
  );
};

/**
 * 会計処理タブコンポーネント
 * すべてのプリセットキーバインドを登録し、alertで表示します
 */
const AccountingTab = () => {
  const categoryLabels: Record<string, string> = {
    common: '共通操作',
    'print-export': '印刷・エクスポート関連',
    search: '検索',
    'account-department': '（科目・部門）作成／編集／削除',
    'journal-entry': '仕訳入力',
    'journal-ledger': '仕訳日記帳・帳簿',
    'voucher-entry': '伝票入力',
    'summary-table': '集計表',
    'financial-statement': '決算書設定（法人）',
    'account-breakdown': '勘定科目内訳書',
    'consumption-tax': '消費税申告書',
    'transaction-schedule': '取引予定表',
    other: 'その他',
    ledger: '台帳',
    invoice: '伝票',
    report: 'レポート',
    general: '全般',
  };

  useEffect(() => {
    // キーごとにキーバインドをグループ化
    const keybindsByKeyCombo = ALL_PRESET_KEYBINDS.reduce((acc, preset) => {
      const keyCombo = preset.keyCombo.toLowerCase();
      if (!acc[keyCombo]) {
        acc[keyCombo] = [];
      }
      acc[keyCombo].push(preset);
      return acc;
    }, {} as Record<string, typeof ALL_PRESET_KEYBINDS>);

    // すべてのプリセットキーバインドを登録
    const registeredIds: string[] = [];
    
    Object.entries(keybindsByKeyCombo).forEach(([keyCombo, presets]) => {
      // 同じキーが複数登録されている場合、すべてを実行
      if (presets.length > 1) {
        const id = `accounting-${keyCombo}-multiple`;
        registeredIds.push(id);
        
        // preventDefaultは、いずれかがtrueの場合はtrueにする
        const preventDefault = presets.some(p => p.preventDefault);
        
        binder.registerWithId(
          id,
          keyCombo,
          () => {
            // すべてのキーバインドの情報をalertで表示
            // カテゴリとラベルでソートして表示順を統一
            const sortedPresets = [...presets].sort((a, b) => {
              const categoryA = categoryLabels[a.category] || a.category;
              const categoryB = categoryLabels[b.category] || b.category;
              if (categoryA !== categoryB) {
                return categoryA.localeCompare(categoryB);
              }
              return a.label.localeCompare(b.label);
            });
            
            const messages = sortedPresets.map((preset) => {
              const categoryName = categoryLabels[preset.category] || preset.category;
              return `🎯 ${preset.label}\nカテゴリ: ${categoryName}\n説明: ${preset.description}`;
            });
            alert(messages.join('\n\n---\n\n'));
          },
          { preventDefault }
        );
      } else {
        // 単一のキーバインドの場合
        const preset = presets[0];
        const id = `accounting-${preset.id}`;
        registeredIds.push(id);
        
        const categoryName = categoryLabels[preset.category] || preset.category;
        
        binder.registerWithId(
          id,
          preset.keyCombo,
          () => {
            alert(`🎯 ${preset.label}\n\nカテゴリ: ${categoryName}\nキー: ${preset.keyCombo}\n説明: ${preset.description}`);
          },
          { preventDefault: preset.preventDefault }
        );
      }
    });

    // クリーンアップ関数
    return () => {
      registeredIds.forEach((id) => {
        binder.unregisterById(id);
      });
    };
  }, [categoryLabels]);

  // カテゴリ別にキーバインドをグループ化
  const keybindsByCategory = ALL_PRESET_KEYBINDS.reduce((acc, kb) => {
    if (!acc[kb.category]) {
      acc[kb.category] = [];
    }
    acc[kb.category].push(kb);
    return acc;
  }, {} as Record<string, typeof ALL_PRESET_KEYBINDS>);

  return (
    <>
      <h2 style={{ marginTop: "2rem" }}>💼 会計処理キーバインドデモ</h2>
      <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "1rem" }}>
        すべてのプリセットキーバインドが登録されています。各キーを押すとalertで動作が確認できます。
      </p>

      <div style={{ marginTop: "2rem" }}>
        {Object.entries(keybindsByCategory).map(([category, keybinds]) => (
          <div
            key={category}
            style={{
              marginBottom: "2rem",
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "1.5rem",
              backgroundColor: "#f9f9f9",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "1rem", color: "#333" }}>
              {categoryLabels[category] || category}
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "0.75rem",
              }}
            >
              {keybinds.map((kb) => (
                <div
                  key={kb.id}
                  style={{
                    padding: "0.75rem",
                    backgroundColor: "white",
                    borderRadius: "4px",
                    border: "1px solid #e0e0e0",
                  }}
                >
                  <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>
                    {kb.label}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.25rem" }}>
                    <code style={{ backgroundColor: "#f5f5f5", padding: "0.2rem 0.4rem", borderRadius: "3px" }}>
                      {kb.keyCombo}
                    </code>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#888" }}>
                    {kb.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
