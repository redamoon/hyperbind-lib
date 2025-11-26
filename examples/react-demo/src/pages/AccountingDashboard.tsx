import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ALL_PRESET_KEYBINDS } from "@hyperbind-lib/core";
import { binder } from "@hyperbind-lib/core";
import { CalendarModal } from "../CalendarModal";
import { HelpDialog } from "../HelpDialog";
import { useGlobalKeybindToggle } from "@hyperbind-lib/react";

export const AccountingDashboard = () => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const { isEnabled, toggle } = useGlobalKeybindToggle();

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
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <Link to="/" style={{ color: "#2196F3", textDecoration: "none" }}>
          ← トップに戻る
        </Link>
        <button onClick={() => setShowCalendar(true)}>📅 カレンダー</button>
        <button onClick={() => setShowHelp(true)}>❓ ヘルプ</button>
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

      <h1 style={{ marginTop: 0 }}>💼 会計ダッシュボード</h1>
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

      {showCalendar && (
        <CalendarModal onClose={() => setShowCalendar(false)} />
      )}
      {showHelp && <HelpDialog onClose={() => setShowHelp(false)} />}
    </div>
  );
};

