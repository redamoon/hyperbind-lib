import { useState, useCallback } from "react";
import { usePresetKeybind } from "@hyperbind-lib/react";

/**
 * 仕訳行のタイプ
 */
type RowType = "detail" | "memo" | "subtotal";

/**
 * 仕訳行のデータ構造
 */
interface JournalRow {
  id: string;
  type: RowType;
  debitAccount: string;
  debitAmount: number;
  creditAccount: string;
  creditAmount: number;
  description: string;
  fixedDebit: boolean;
  fixedCredit: boolean;
}

/**
 * 仕訳入力タブコンポーネント
 * 表形式で仕訳行を表示し、Shift+F2からF7のキーバインドで行操作を行う
 */
export const JournalTab = () => {
  const [rows, setRows] = useState<JournalRow[]>([
    {
      id: "1",
      type: "detail",
      debitAccount: "現金",
      debitAmount: 100000,
      creditAccount: "売上",
      creditAmount: 100000,
      description: "商品売上（現金）",
      fixedDebit: false,
      fixedCredit: false,
    },
    {
      id: "2",
      type: "detail",
      debitAccount: "売掛金",
      debitAmount: 50000,
      creditAccount: "売上",
      creditAmount: 50000,
      description: "商品売上（掛）",
      fixedDebit: false,
      fixedCredit: false,
    },
    {
      id: "3",
      type: "memo",
      debitAccount: "",
      debitAmount: 0,
      creditAccount: "",
      creditAmount: 0,
      description: "※メモ: キャンペーン売上を含む",
      fixedDebit: false,
      fixedCredit: false,
    },
    {
      id: "4",
      type: "detail",
      debitAccount: "仕入",
      debitAmount: 30000,
      creditAccount: "買掛金",
      creditAmount: 30000,
      description: "商品仕入",
      fixedDebit: false,
      fixedCredit: false,
    },
    {
      id: "5",
      type: "subtotal",
      debitAccount: "",
      debitAmount: 0,
      creditAccount: "",
      creditAmount: 0,
      description: "小計: 売上関連仕訳",
      fixedDebit: false,
      fixedCredit: false,
    },
  ]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(0);
  const [clipboard, setClipboard] = useState<JournalRow | null>(null);

  // Shift+F2: 明細行挿入
  usePresetKeybind("account-breakdown-detail-insert", () => {
    if (selectedIndex === null) {
      alert("行を選択してください");
      return;
    }
    const newRow: JournalRow = {
      id: `row-${Date.now()}`,
      type: "detail",
      debitAccount: "",
      debitAmount: 0,
      creditAccount: "",
      creditAmount: 0,
      description: "",
      fixedDebit: false,
      fixedCredit: false,
    };
    setRows((prev) => {
      const newRows = [...prev];
      newRows.splice(selectedIndex, 0, newRow);
      return newRows;
    });
    setSelectedIndex(selectedIndex);
    alert("明細行を挿入しました");
  });

  // Shift+F3: メモ行挿入
  usePresetKeybind("account-breakdown-memo-insert", () => {
    if (selectedIndex === null) {
      alert("行を選択してください");
      return;
    }
    const newRow: JournalRow = {
      id: `row-${Date.now()}`,
      type: "memo",
      debitAccount: "",
      debitAmount: 0,
      creditAccount: "",
      creditAmount: 0,
      description: "",
      fixedDebit: false,
      fixedCredit: false,
    };
    setRows((prev) => {
      const newRows = [...prev];
      newRows.splice(selectedIndex, 0, newRow);
      return newRows;
    });
    setSelectedIndex(selectedIndex);
    alert("メモ行を挿入しました");
  });

  // Shift+F4: 小計行挿入
  usePresetKeybind("account-breakdown-subtotal-insert", () => {
    if (selectedIndex === null) {
      alert("行を選択してください");
      return;
    }
    const newRow: JournalRow = {
      id: `row-${Date.now()}`,
      type: "subtotal",
      debitAccount: "",
      debitAmount: 0,
      creditAccount: "",
      creditAmount: 0,
      description: "小計",
      fixedDebit: false,
      fixedCredit: false,
    };
    setRows((prev) => {
      const newRows = [...prev];
      newRows.splice(selectedIndex, 0, newRow);
      return newRows;
    });
    setSelectedIndex(selectedIndex);
    alert("小計行を挿入しました");
  });

  // Shift+F5: 行切り取り
  usePresetKeybind("account-breakdown-row-cut", () => {
    if (selectedIndex === null || selectedIndex >= rows.length) {
      alert("行を選択してください");
      return;
    }
    const rowToCut = rows[selectedIndex];
    setClipboard({ ...rowToCut });
    setRows((prev) => prev.filter((_, index) => index !== selectedIndex));
    setSelectedIndex(null);
    alert("行を切り取りました");
  });

  // Shift+F6: 行コピー
  usePresetKeybind("account-breakdown-row-copy", () => {
    if (selectedIndex === null || selectedIndex >= rows.length) {
      alert("行を選択してください");
      return;
    }
    const rowToCopy = rows[selectedIndex];
    setClipboard({ ...rowToCopy });
    alert("行をコピーしました");
  });

  // Shift+F7: 行貼り付け
  usePresetKeybind("account-breakdown-row-paste", () => {
    if (clipboard === null) {
      alert("クリップボードが空です");
      return;
    }
    if (selectedIndex === null) {
      // 選択がない場合は最後に追加
      const newRow: JournalRow = {
        ...clipboard,
        id: `row-${Date.now()}`,
      };
      setRows((prev) => [...prev, newRow]);
      setSelectedIndex(rows.length);
    } else {
      // 選択行の後に挿入
      const newRow: JournalRow = {
        ...clipboard,
        id: `row-${Date.now()}`,
      };
      setRows((prev) => {
        const newRows = [...prev];
        newRows.splice(selectedIndex + 1, 0, newRow);
        return newRows;
      });
      setSelectedIndex(selectedIndex + 1);
    }
    alert("行を貼り付けました");
  });

  // F9 / Ctrl+Del: 仕訳削除
  usePresetKeybind("journal-entry-delete-f9", () => {
    if (selectedIndex === null || selectedIndex >= rows.length) {
      alert("行を選択してください");
      return;
    }
    if (confirm("選択した行を削除しますか？")) {
      setRows((prev) => prev.filter((_, index) => index !== selectedIndex));
      setSelectedIndex(null);
      alert("行を削除しました");
    }
  });

  usePresetKeybind("journal-entry-delete-ctrldel", () => {
    if (selectedIndex === null || selectedIndex >= rows.length) {
      alert("行を選択してください");
      return;
    }
    if (confirm("選択した行を削除しますか？")) {
      setRows((prev) => prev.filter((_, index) => index !== selectedIndex));
      setSelectedIndex(null);
      alert("行を削除しました");
    }
  });

  // F12: 仕訳登録
  usePresetKeybind("journal-entry-register", () => {
    // バリデーション
    const hasInvalidRow = rows.some(
      (row) =>
        row.type === "detail" &&
        (row.debitAccount === "" ||
          row.creditAccount === "" ||
          row.debitAmount === 0 ||
          row.creditAmount === 0)
    );

    if (hasInvalidRow) {
      alert("未入力の項目があります");
      return;
    }

    // 借方と貸方の合計が一致するかチェック
    const totalDebit = rows
      .filter((row) => row.type === "detail")
      .reduce((sum, row) => sum + row.debitAmount, 0);
    const totalCredit = rows
      .filter((row) => row.type === "detail")
      .reduce((sum, row) => sum + row.creditAmount, 0);

    if (totalDebit !== totalCredit) {
      alert(`借方と貸方の合計が一致しません\n借方: ${totalDebit.toLocaleString()}\n貸方: ${totalCredit.toLocaleString()}`);
      return;
    }

    alert(`仕訳を登録しました\n行数: ${rows.length}\n借方合計: ${totalDebit.toLocaleString()}\n貸方合計: ${totalCredit.toLocaleString()}`);
  });

  // Shift+F11: 借方項目の固定/解除
  usePresetKeybind("journal-entry-debit-fix", () => {
    if (selectedIndex === null || selectedIndex >= rows.length) {
      alert("行を選択してください");
      return;
    }
    setRows((prev) =>
      prev.map((row, index) =>
        index === selectedIndex ? { ...row, fixedDebit: !row.fixedDebit } : row
      )
    );
    const newFixed = !rows[selectedIndex].fixedDebit;
    alert(`借方項目を${newFixed ? "固定" : "解除"}しました`);
  });

  // Shift+F12: 貸方項目の固定/解除
  usePresetKeybind("journal-entry-credit-fix", () => {
    if (selectedIndex === null || selectedIndex >= rows.length) {
      alert("行を選択してください");
      return;
    }
    setRows((prev) =>
      prev.map((row, index) =>
        index === selectedIndex ? { ...row, fixedCredit: !row.fixedCredit } : row
      )
    );
    const newFixed = !rows[selectedIndex].fixedCredit;
    alert(`貸方項目を${newFixed ? "固定" : "解除"}しました`);
  });

  // Ctrl+K: 行切り取り
  usePresetKeybind("journal-entry-row-cut", () => {
    if (selectedIndex === null || selectedIndex >= rows.length) {
      alert("行を選択してください");
      return;
    }
    const rowToCut = rows[selectedIndex];
    setClipboard({ ...rowToCut });
    setRows((prev) => prev.filter((_, index) => index !== selectedIndex));
    setSelectedIndex(null);
    alert("行を切り取りました");
  });

  // Ctrl+L: 行コピー
  usePresetKeybind("journal-entry-row-copy", () => {
    if (selectedIndex === null || selectedIndex >= rows.length) {
      alert("行を選択してください");
      return;
    }
    const rowToCopy = rows[selectedIndex];
    setClipboard({ ...rowToCopy });
    alert("行をコピーしました");
  });

  // Ctrl+Y: 行貼り付け
  usePresetKeybind("journal-entry-row-paste", () => {
    if (clipboard === null) {
      alert("クリップボードが空です");
      return;
    }
    if (selectedIndex === null) {
      const newRow: JournalRow = {
        ...clipboard,
        id: `row-${Date.now()}`,
      };
      setRows((prev) => [...prev, newRow]);
      setSelectedIndex(rows.length);
    } else {
      const newRow: JournalRow = {
        ...clipboard,
        id: `row-${Date.now()}`,
      };
      setRows((prev) => {
        const newRows = [...prev];
        newRows.splice(selectedIndex + 1, 0, newRow);
        return newRows;
      });
      setSelectedIndex(selectedIndex + 1);
    }
    alert("行を貼り付けました");
  });

  // Ctrl+Ins: 新規行挿入
  usePresetKeybind("journal-entry-row-insert", () => {
    const insertIndex = selectedIndex === null ? rows.length : selectedIndex + 1;
    const newRow: JournalRow = {
      id: `row-${Date.now()}`,
      type: "detail",
      debitAccount: "",
      debitAmount: 0,
      creditAccount: "",
      creditAmount: 0,
      description: "",
      fixedDebit: false,
      fixedCredit: false,
    };
    setRows((prev) => {
      const newRows = [...prev];
      newRows.splice(insertIndex, 0, newRow);
      return newRows;
    });
    setSelectedIndex(insertIndex);
    alert("新規行を挿入しました");
  });

  const getRowTypeLabel = (type: RowType): string => {
    switch (type) {
      case "detail":
        return "明細";
      case "memo":
        return "メモ";
      case "subtotal":
        return "小計";
    }
  };

  const totalDebit = rows
    .filter((row) => row.type === "detail")
    .reduce((sum, row) => sum + row.debitAmount, 0);
  const totalCredit = rows
    .filter((row) => row.type === "detail")
    .reduce((sum, row) => sum + row.creditAmount, 0);

  return (
    <>
      <h2 style={{ marginTop: "2rem" }}>📝 仕訳入力</h2>
      <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "1rem" }}>
        表の行をクリックして選択し、Shift+F2からF7のキーバインドで行操作を行えます。
      </p>

      <div style={{ marginBottom: "1rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "0.5rem",
            marginBottom: "1rem",
            padding: "1rem",
            backgroundColor: "#f9f9f9",
            borderRadius: "8px",
          }}
        >
          <div>
            <strong>行操作:</strong>
            <ul style={{ margin: "0.5rem 0", paddingLeft: "1.5rem" }}>
              <li>Shift+F2: 明細行挿入</li>
              <li>Shift+F3: メモ行挿入</li>
              <li>Shift+F4: 小計行挿入</li>
              <li>Shift+F5: 行切り取り</li>
              <li>Shift+F6: 行コピー</li>
              <li>Shift+F7: 行貼り付け</li>
            </ul>
          </div>
          <div>
            <strong>仕訳操作:</strong>
            <ul style={{ margin: "0.5rem 0", paddingLeft: "1.5rem" }}>
              <li>F9 / Ctrl+Del: 行削除</li>
              <li>F12: 仕訳登録</li>
              <li>Shift+F11: 借方固定/解除</li>
              <li>Shift+F12: 貸方固定/解除</li>
              <li>Ctrl+K: 行切り取り</li>
              <li>Ctrl+L: 行コピー</li>
              <li>Ctrl+Y: 行貼り付け</li>
              <li>Ctrl+Ins: 新規行挿入</li>
            </ul>
          </div>
        </div>
      </div>

      <div style={{ overflowX: "auto", marginBottom: "1rem" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            backgroundColor: "white",
            border: "1px solid #ddd",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f5f5f5" }}>
              <th style={{ padding: "0.75rem", border: "1px solid #ddd", textAlign: "left" }}>
                行タイプ
              </th>
              <th style={{ padding: "0.75rem", border: "1px solid #ddd", textAlign: "left" }}>
                借方科目
              </th>
              <th style={{ padding: "0.75rem", border: "1px solid #ddd", textAlign: "right" }}>
                借方金額
              </th>
              <th style={{ padding: "0.75rem", border: "1px solid #ddd", textAlign: "left" }}>
                貸方科目
              </th>
              <th style={{ padding: "0.75rem", border: "1px solid #ddd", textAlign: "right" }}>
                貸方金額
              </th>
              <th style={{ padding: "0.75rem", border: "1px solid #ddd", textAlign: "left" }}>
                摘要
              </th>
              <th style={{ padding: "0.75rem", border: "1px solid #ddd", textAlign: "center" }}>
                固定
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "#999" }}>
                  行がありません。Shift+F2で明細行を挿入してください。
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={row.id}
                  onClick={() => setSelectedIndex(index)}
                  style={{
                    backgroundColor:
                      selectedIndex === index
                        ? "#e3f2fd"
                        : row.type === "memo"
                        ? "#fff9e6"
                        : row.type === "subtotal"
                        ? "#f0f0f0"
                        : "white",
                    cursor: "pointer",
                    border: selectedIndex === index ? "2px solid #2196F3" : "1px solid #ddd",
                  }}
                >
                  <td style={{ padding: "0.75rem", border: "1px solid #ddd" }}>
                    {getRowTypeLabel(row.type)}
                  </td>
                  <td style={{ padding: "0.75rem", border: "1px solid #ddd" }}>
                    {row.fixedDebit && "🔒 "}
                    {row.debitAccount || "-"}
                  </td>
                  <td style={{ padding: "0.75rem", border: "1px solid #ddd", textAlign: "right" }}>
                    {row.debitAmount > 0 ? row.debitAmount.toLocaleString() : "-"}
                  </td>
                  <td style={{ padding: "0.75rem", border: "1px solid #ddd" }}>
                    {row.fixedCredit && "🔒 "}
                    {row.creditAccount || "-"}
                  </td>
                  <td style={{ padding: "0.75rem", border: "1px solid #ddd", textAlign: "right" }}>
                    {row.creditAmount > 0 ? row.creditAmount.toLocaleString() : "-"}
                  </td>
                  <td style={{ padding: "0.75rem", border: "1px solid #ddd" }}>
                    {row.description || "-"}
                  </td>
                  <td style={{ padding: "0.75rem", border: "1px solid #ddd", textAlign: "center" }}>
                    {row.fixedDebit && "借"}
                    {row.fixedDebit && row.fixedCredit && "・"}
                    {row.fixedCredit && "貸"}
                    {!row.fixedDebit && !row.fixedCredit && "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
              <td colSpan={2} style={{ padding: "0.75rem", border: "1px solid #ddd", textAlign: "right" }}>
                合計:
              </td>
              <td style={{ padding: "0.75rem", border: "1px solid #ddd", textAlign: "right" }}>
                {totalDebit.toLocaleString()}
              </td>
              <td colSpan={2} style={{ padding: "0.75rem", border: "1px solid #ddd", textAlign: "right" }}>
                合計:
              </td>
              <td style={{ padding: "0.75rem", border: "1px solid #ddd", textAlign: "right" }}>
                {totalCredit.toLocaleString()}
              </td>
              <td style={{ padding: "0.75rem", border: "1px solid #ddd" }}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {clipboard && (
        <div
          style={{
            padding: "0.75rem",
            backgroundColor: "#e8f5e9",
            border: "1px solid #4caf50",
            borderRadius: "4px",
            marginTop: "1rem",
          }}
        >
          <strong>クリップボード:</strong> {getRowTypeLabel(clipboard.type)} - {clipboard.description || "（摘要なし）"}
        </div>
      )}
    </>
  );
};

