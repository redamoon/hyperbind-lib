import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { FormNavigator } from "@hyperbind-lib/react";
import { usePresetKeybind } from "@hyperbind-lib/react";
import { useKeybind } from "@hyperbind-lib/react";
import { useModalKeybind } from "@hyperbind-lib/react";
import { useDisableCustomKeybindsWhileMounted } from "@hyperbind-lib/react";
import {
  CustomerMaster,
  searchCustomer,
  ExpenseTypeMaster,
  searchExpenseType,
  PaymentMethodMaster,
  searchPaymentMethod,
} from "./masters";
import { CalendarModal } from "./CalendarModal";
import { HelpDialog } from "./HelpDialog";

/**
 * 経費明細行のデータ型
 */
interface ExpenseRow {
  id: string;
  date: string; // 日付（取引日）
  expenseType: string; // 経費種別
  amount: number; // 金額
  vendorCode: string; // 支払先コード
  vendor: CustomerMaster | null; // 支払先情報
  paymentMethod: string; // 支払方法
  purpose: string; // 用途・内容
  hasReceipt: boolean; // 領収書の有無
  remarks: string; // 備考
}

/**
 * 経費ヘッダーのデータ型
 */
interface ExpenseHeader {
  date: string; // YYYY/MM/DD
}

interface ExpenseFormProps {
  isActive?: boolean;
}

/**
 * 経費入力画面コンポーネント
 */
export const ExpenseForm = ({ isActive = true }: ExpenseFormProps) => {
  // ヘッダー情報
  const [header, setHeader] = useState<ExpenseHeader>({
    date: new Date().toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).replace(/\//g, "/"),
  });

  // 付箋機能：前回入力した日付を保持
  const [stickyDate, setStickyDate] = useState<string>(header.date);

  // 明細行
  const [rows, setRows] = useState<ExpenseRow[]>([
    {
      id: "1",
      date: header.date,
      expenseType: "",
      amount: 0,
      vendorCode: "",
      vendor: null,
      paymentMethod: "",
      purpose: "",
      hasReceipt: false,
      remarks: "",
    },
  ]);

  // クリップボード（行コピー用）
  const [clipboard, setClipboard] = useState<ExpenseRow | null>(null);

  // サジェスト機能の状態管理
  const [suggestions, setSuggestions] = useState<{
    type: "expenseType" | "paymentMethod" | "vendor";
    field: string; // rowId-fieldName
    items: (ExpenseTypeMaster | PaymentMethodMaster | CustomerMaster)[];
    selectedIndex: number;
    position?: { top: number; left: number; width: number };
  } | null>(null);

  // カレンダーモーダルの表示状態
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState<"header" | string | null>(null); // "header" or rowId

  // ヘルプダイアログの表示状態
  const [showHelp, setShowHelp] = useState(false);

  // 入力フィールドの参照（FormNavigator用）
  const dateInputRef = useRef<HTMLInputElement>(null);

  // 各行の各フィールドのrefを管理するMap
  const rowInputRefsMap = useRef<Map<string, React.MutableRefObject<HTMLElement | null>[]>>(new Map());

  // 行のrefを取得または作成
  const getRowInputRefs = useCallback((rowId: string): React.MutableRefObject<HTMLElement | null>[] => {
    if (!rowInputRefsMap.current.has(rowId)) {
      rowInputRefsMap.current.set(rowId, [
        { current: null } as React.MutableRefObject<HTMLInputElement | null>, // date
        { current: null } as React.MutableRefObject<HTMLSelectElement | null>, // expenseType
        { current: null } as React.MutableRefObject<HTMLInputElement | null>, // amount
        { current: null } as React.MutableRefObject<HTMLInputElement | null>, // vendorCode
        { current: null } as React.MutableRefObject<HTMLSelectElement | null>, // paymentMethod
        { current: null } as React.MutableRefObject<HTMLInputElement | null>, // purpose
        { current: null } as React.MutableRefObject<HTMLInputElement | null>, // hasReceipt
        { current: null } as React.MutableRefObject<HTMLInputElement | null>, // remarks
      ]);
    }
    return rowInputRefsMap.current.get(rowId)!;
  }, []);

  // 不要なrefをクリーンアップ
  useEffect(() => {
    const currentRowIds = new Set(rows.map((r) => r.id));
    for (const [rowId] of rowInputRefsMap.current) {
      if (!currentRowIds.has(rowId)) {
        rowInputRefsMap.current.delete(rowId);
      }
    }
  }, [rows]);

  // サジェストドロップダウンを外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestions && !(e.target as Element).closest('.suggestions-container')) {
        setSuggestions(null);
      }
    };
    if (suggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [suggestions]);

  // スクロール時にサジェストの位置を再計算
  useEffect(() => {
    if (!suggestions) return;

    const handleScroll = () => {
      if (suggestions && suggestions.position) {
        const fieldParts = suggestions.field.split('-');
        const rowId = fieldParts[0];
        const fieldName = fieldParts[1];
        const row = rows.find((r) => r.id === rowId);
        if (row) {
          const rowRefs = getRowInputRefs(rowId);
          let targetElement: HTMLElement | null = null;
          
          if (fieldName === "vendorCode") {
            targetElement = rowRefs[3].current;
          }
          
          if (targetElement) {
            const position = calculatePosition(targetElement);
            if (position) {
              setSuggestions((prev) => prev ? { ...prev, position } : null);
            }
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    const tableContainer = document.querySelector('.overflow-x-auto');
    if (tableContainer) {
      tableContainer.addEventListener('scroll', handleScroll, true);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      if (tableContainer) {
        tableContainer.removeEventListener('scroll', handleScroll, true);
      }
    };
  }, [suggestions, rows, getRowInputRefs]);

  // すべての入力フィールドの参照を収集（FormNavigator用）
  const allInputRefs = React.useMemo(() => {
    const refs: React.RefObject<HTMLElement>[] = [
      dateInputRef as React.RefObject<HTMLElement>,
    ].map(ref => ref as React.RefObject<HTMLElement>);
    rows.forEach((row) => {
      const rowRefs = getRowInputRefs(row.id);
      refs.push(...rowRefs);
    });
    return refs as React.RefObject<HTMLInputElement>[];
  }, [rows, getRowInputRefs]);

  // 要素の位置を計算するヘルパー関数
  const calculatePosition = (element: HTMLElement | null): { top: number; left: number; width: number } | undefined => {
    if (!element) return undefined;
    const rect = element.getBoundingClientRect();
    return {
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
    };
  };

  // 金額フォーマット（3桁カンマ）
  const formatAmount = (amount: number): string => {
    return amount.toLocaleString("ja-JP");
  };

  // 金額のパース（カンマを除去）
  const parseAmount = (value: string): number => {
    return parseInt(value.replace(/,/g, "")) || 0;
  };

  // 月の日数を取得する関数
  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month, 0).getDate();
  };

  // 日付変換ロジック
  const parseDateInput = (input: string): string => {
    // 既にYYYY/MM/DD形式の場合はそのまま返す
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(input)) {
      return input;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // 数字のみの入力を処理
    const numericInput = input.replace(/\D/g, "");

    if (numericInput.length === 1) {
      // 1桁: 今月のその日
      const day = parseInt(numericInput, 10);
      const daysInMonth = getDaysInMonth(currentYear, currentMonth);
      if (day >= 1 && day <= daysInMonth) {
        const monthStr = currentMonth.toString().padStart(2, "0");
        const dayStr = day.toString().padStart(2, "0");
        return `${currentYear}/${monthStr}/${dayStr}`;
      }
    } else if (numericInput.length === 2) {
      // 2桁: 今月のその日
      const day = parseInt(numericInput, 10);
      const daysInMonth = getDaysInMonth(currentYear, currentMonth);
      if (day >= 1 && day <= daysInMonth) {
        const monthStr = currentMonth.toString().padStart(2, "0");
        const dayStr = day.toString().padStart(2, "0");
        return `${currentYear}/${monthStr}/${dayStr}`;
      }
    } else if (numericInput.length === 4) {
      // 4桁: MMDD形式として解釈
      const month = parseInt(numericInput.substring(0, 2), 10);
      const day = parseInt(numericInput.substring(2, 4), 10);
      if (month >= 1 && month <= 12) {
        const daysInMonth = getDaysInMonth(currentYear, month);
        if (day >= 1 && day <= daysInMonth) {
          const monthStr = month.toString().padStart(2, "0");
          const dayStr = day.toString().padStart(2, "0");
          return `${currentYear}/${monthStr}/${dayStr}`;
        }
      }
    }

    // 変換できない場合はそのまま返す
    return input;
  };

  // 合計計算
  const totalAmount = rows.reduce((sum, row) => sum + row.amount, 0);

  // 新規作成
  const handleNew = useCallback(() => {
    const newDate = stickyDate || new Date().toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).replace(/\//g, "/");
    setHeader({ date: newDate });
    setRows([
      {
        id: "1",
        date: newDate,
        expenseType: "",
        amount: 0,
        vendorCode: "",
        vendor: null,
        paymentMethod: "",
        purpose: "",
        hasReceipt: false,
        remarks: "",
      },
    ]);
    dateInputRef.current?.focus();
  }, [stickyDate]);

  // 登録
  const handleRegister = useCallback(() => {
    // バリデーション
    if (rows.length === 0) {
      alert("最低1行は必要です。");
      return;
    }

    const hasInvalidRow = rows.some(
      (row) => !row.expenseType || row.amount === 0
    );

    if (hasInvalidRow) {
      alert("経費種別または金額が未入力の行があります。");
      return;
    }

    // 日付を付箋に保存
    setStickyDate(header.date);

    alert(
      `経費を登録しました。\n日付: ${header.date}\n件数: ${rows.length}件\n合計金額: ${formatAmount(totalAmount)}円`
    );
  }, [rows, totalAmount, header]);

  // 削除
  const handleDelete = useCallback(() => {
    if (confirm("経費を削除しますか？")) {
      handleNew();
    }
  }, [handleNew]);

  // 行挿入
  const handleInsertRow = useCallback(() => {
    const newRow: ExpenseRow = {
      id: `row-${Date.now()}`,
      date: header.date,
      expenseType: "",
      amount: 0,
      vendorCode: "",
      vendor: null,
      paymentMethod: "",
      purpose: "",
      hasReceipt: false,
      remarks: "",
    };
    setRows((prev) => [...prev, newRow]);
    // 新しい行の最初のフィールド（日付）にフォーカス
    setTimeout(() => {
      const newRowRefs = getRowInputRefs(newRow.id);
      newRowRefs[0].current?.focus();
    }, 0);
  }, [getRowInputRefs, header.date]);

  // 行削除
  const handleDeleteRow = useCallback(
    (rowId: string) => {
      if (rows.length === 1) {
        alert("最低1行は必要です。");
        return;
      }
      setRows((prev) => prev.filter((row) => row.id !== rowId));
    },
    [rows.length]
  );

  // 行切り取り
  const handleCutRow = useCallback((rowId: string) => {
    const row = rows.find((r) => r.id === rowId);
    if (row) {
      setClipboard({ ...row });
      setRows((prev) => prev.filter((r) => r.id !== rowId));
    }
  }, [rows]);

  // 行コピー
  const handleCopyRow = useCallback((rowId: string) => {
    const row = rows.find((r) => r.id === rowId);
    if (row) {
      setClipboard({ ...row });
    }
  }, [rows]);

  // 行貼り付け
  const handlePasteRow = useCallback(
    (rowId: string) => {
      if (!clipboard) return;
      const newRow: ExpenseRow = {
        ...clipboard,
        id: `row-${Date.now()}`,
      };
      const index = rows.findIndex((r) => r.id === rowId);
      if (index >= 0) {
        setRows((prev) => {
          const newRows = [...prev];
          newRows.splice(index + 1, 0, newRow);
          return newRows;
        });
      }
    },
    [clipboard, rows]
  );

  // 現在フォーカスされている行を取得
  const getCurrentFocusedRow = useCallback((): ExpenseRow | null => {
    const activeElement = document.activeElement;
    if (!activeElement) return null;

    for (const row of rows) {
      const rowRefs = getRowInputRefs(row.id);
      for (const ref of rowRefs) {
        if (ref.current === activeElement) {
          return row;
        }
      }
    }
    return null;
  }, [rows, getRowInputRefs]);

  // キーバインド登録
  usePresetKeybind("voucher-entry-new", handleNew);
  usePresetKeybind("voucher-entry-register", handleRegister);
  usePresetKeybind("voucher-entry-delete", handleDelete);
  usePresetKeybind("voucher-entry-row-insert", handleInsertRow);
  usePresetKeybind("voucher-entry-row-cut", () => {
    const currentRow = getCurrentFocusedRow();
    if (currentRow) {
      handleCutRow(currentRow.id);
    }
  });
  usePresetKeybind("voucher-entry-row-copy", () => {
    const currentRow = getCurrentFocusedRow();
    if (currentRow) {
      handleCopyRow(currentRow.id);
    }
  });
  usePresetKeybind("voucher-entry-row-paste", () => {
    const currentRow = getCurrentFocusedRow();
    if (currentRow) {
      handlePasteRow(currentRow.id);
    }
  });
  usePresetKeybind("voucher-entry-row-delete", () => {
    const currentRow = getCurrentFocusedRow();
    if (currentRow) {
      handleDeleteRow(currentRow.id);
    }
  });

  // Ctrl+S: 登録
  useKeybind("ctrl+s", handleRegister);

  // F1: ヘルプダイアログ
  useKeybind("f1", () => {
    setShowHelp(true);
  });

  // F4: カレンダーまたはドロップダウン表示
  useModalKeybind({
    keyCombo: "f4",
    isOpen: showCalendar,
    onOpen: () => {
      const activeElement = document.activeElement;
      if (activeElement === dateInputRef.current) {
        setCalendarTarget("header");
        setShowCalendar(true);
      } else {
        // 行の日付フィールドの場合
        for (const row of rows) {
          const rowRefs = getRowInputRefs(row.id);
          if (activeElement === rowRefs[0].current) {
            setCalendarTarget(row.id);
            setShowCalendar(true);
            return;
          }
          // 経費種別フィールドの場合
          if (activeElement === rowRefs[1].current) {
            const inputElement = rowRefs[1].current;
            if (inputElement) {
              const position = calculatePosition(inputElement);
              if (position) {
                const expenseTypes = searchExpenseType("");
                setSuggestions({
                  type: "expenseType",
                  field: `${row.id}-expenseType`,
                  items: expenseTypes,
                  selectedIndex: 0,
                  position,
                });
              }
            }
            return;
          }
          // 支払方法フィールドの場合
          if (activeElement === rowRefs[4].current) {
            const inputElement = rowRefs[4].current;
            if (inputElement) {
              const position = calculatePosition(inputElement);
              if (position) {
                const paymentMethods = searchPaymentMethod("");
                setSuggestions({
                  type: "paymentMethod",
                  field: `${row.id}-paymentMethod`,
                  items: paymentMethods,
                  selectedIndex: 0,
                  position,
                });
              }
            }
            return;
          }
        }
      }
    },
    onClose: () => {
      setShowCalendar(false);
      setCalendarTarget(null);
    },
  });


  if (!isActive) return null;

  return (
    <div className="p-6 max-w-[1800px] mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">💰 経費入力</h2>

      {/* ヘッダー部 */}
      <div className="grid grid-cols-1 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            発生日
          </label>
          <input
            ref={dateInputRef}
            type="text"
            value={header.date}
            onChange={(e) =>
              setHeader((prev) => ({ ...prev, date: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                e.preventDefault();
                e.stopPropagation();
                if (/^\d{4}\/\d{2}\/\d{2}$/.test(header.date)) {
                  // 最初の行の最初のフィールドにフォーカス
                  if (rows.length > 0) {
                    const firstRowRefs = getRowInputRefs(rows[0].id);
                    firstRowRefs[0].current?.focus();
                  }
                } else {
                  const convertedDate = parseDateInput(header.date);
                  setHeader((prev) => ({ ...prev, date: convertedDate }));
                  setTimeout(() => {
                    if (rows.length > 0) {
                      const firstRowRefs = getRowInputRefs(rows[0].id);
                      firstRowRefs[0].current?.focus();
                    }
                  }, 0);
                }
              }
            }}
            placeholder="YYYY/MM/DD または 1, 20, 30 (今月のその日) または 0101 (1月1日)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
          />
        </div>
      </div>

      {/* 明細グリッド部 */}
      <div className="overflow-x-auto mb-4 shadow-sm rounded-lg border border-gray-200">
        <table className="w-full border-collapse bg-white">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="p-3 border-r border-gray-300 text-left text-sm font-semibold text-gray-700">日付</th>
              <th className="p-3 border-r border-gray-300 text-left text-sm font-semibold text-gray-700">経費種別</th>
              <th className="p-3 border-r border-gray-300 text-left text-sm font-semibold text-gray-700">金額</th>
              <th className="p-3 border-r border-gray-300 text-left text-sm font-semibold text-gray-700">支払先</th>
              <th className="p-3 border-r border-gray-300 text-left text-sm font-semibold text-gray-700">支払方法</th>
              <th className="p-3 border-r border-gray-300 text-left text-sm font-semibold text-gray-700">用途・内容</th>
              <th className="p-3 border-r border-gray-300 text-left text-sm font-semibold text-gray-700">領収書</th>
              <th className="p-3 text-left text-sm font-semibold text-gray-700">備考</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => {
              const rowRefs = getRowInputRefs(row.id);
              return (
                <tr key={row.id} data-row-id={row.id} className="hover:bg-gray-50 border-b border-gray-200 transition-colors">
                  {/* 日付 */}
                  <td className="p-2 border-r border-gray-300 overflow-hidden align-top">
                    <input
                      ref={rowRefs[0] as React.RefObject<HTMLInputElement>}
                      type="text"
                      value={row.date}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r) =>
                            r.id === row.id ? { ...r, date: e.target.value } : r
                          )
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                          e.preventDefault();
                          e.stopPropagation();
                          if (/^\d{4}\/\d{2}\/\d{2}$/.test(row.date)) {
                            rowRefs[1].current?.focus();
                          } else {
                            const convertedDate = parseDateInput(row.date);
                            setRows((prev) =>
                              prev.map((r) =>
                                r.id === row.id ? { ...r, date: convertedDate } : r
                              )
                            );
                            setTimeout(() => {
                              rowRefs[1].current?.focus();
                            }, 0);
                          }
                        }
                      }}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
                      placeholder="YYYY/MM/DD"
                    />
                  </td>
                  {/* 経費種別 */}
                  <td className="p-2 border-r border-gray-300 overflow-hidden align-top">
                    <div className="relative">
                      <select
                        ref={rowRefs[1] as React.RefObject<HTMLSelectElement>}
                        value={row.expenseType}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r) =>
                              r.id === row.id ? { ...r, expenseType: e.target.value } : r
                            )
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                            if (row.expenseType) {
                              e.preventDefault();
                              e.stopPropagation();
                              setTimeout(() => {
                                rowRefs[2].current?.focus();
                              }, 10);
                            }
                          }
                        }}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow appearance-none pr-8"
                      >
                        <option value="">選択してください</option>
                        {searchExpenseType("").map((type) => (
                          <option key={type.code} value={type.name}>
                            {type.code} - {type.name}
                          </option>
                        ))}
                      </select>
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">▼</span>
                    </div>
                    {suggestions &&
                      suggestions.field === `${row.id}-expenseType` &&
                      suggestions.items.length > 0 &&
                      suggestions.position && (
                        <div
                          className="fixed bg-white border border-gray-300 rounded max-h-[150px] overflow-y-auto z-[1000] shadow-lg mt-1 suggestions-container"
                          style={{
                            top: `${suggestions.position.top}px`,
                            left: `${suggestions.position.left}px`,
                            width: `${suggestions.position.width}px`,
                          }}
                        >
                          {(suggestions.items as ExpenseTypeMaster[]).map((item, index) => (
                            <div
                              key={item.code}
                              onClick={() => {
                                setRows((prev) =>
                                  prev.map((r) =>
                                    r.id === row.id ? { ...r, expenseType: item.name } : r
                                  )
                                );
                                setSuggestions(null);
                                rowRefs[2].current?.focus();
                              }}
                              className={`p-2 cursor-pointer text-sm ${
                                index === suggestions.selectedIndex
                                  ? "bg-blue-50"
                                  : "bg-white hover:bg-gray-50"
                              }`}
                            >
                              {item.code} - {item.name}
                            </div>
                          ))}
                        </div>
                      )}
                  </td>
                  {/* 金額 */}
                  <td className="p-2 border-r border-gray-300 overflow-hidden align-top">
                    <input
                      ref={rowRefs[2] as React.RefObject<HTMLInputElement>}
                      type="text"
                      value={row.amount > 0 ? formatAmount(row.amount) : ""}
                      onChange={(e) => {
                        const amount = parseAmount(e.target.value);
                        setRows((prev) =>
                          prev.map((r) =>
                            r.id === row.id ? { ...r, amount } : r
                          )
                        );
                      }}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
                    />
                  </td>
                  {/* 支払先 */}
                  <td className="p-2 border-r border-gray-300 overflow-hidden align-top">
                    <div className="relative">
                      <input
                        ref={rowRefs[3] as React.RefObject<HTMLInputElement>}
                        type="text"
                        value={row.vendorCode}
                        onChange={(e) => {
                          const value = e.target.value;
                          setRows((prev) =>
                            prev.map((r) =>
                              r.id === row.id
                                ? { ...r, vendorCode: value, vendor: null }
                                : r
                            )
                          );
                          if (value) {
                            const vendors = searchCustomer(value);
                            const inputElement = e.target as HTMLInputElement;
                            const position = calculatePosition(inputElement);
                            if (position) {
                              setSuggestions({
                                type: "vendor",
                                field: `${row.id}-vendorCode`,
                                items: vendors,
                                selectedIndex: 0,
                                position,
                              });
                            }
                          } else {
                            setSuggestions(null);
                          }
                        }}
                        onBlur={() => setTimeout(() => setSuggestions(null), 200)}
                        onKeyDown={(e) => {
                          // Cmd+EnterまたはCtrl+Enterで取引先検索
                          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                            e.preventDefault();
                            e.stopPropagation();
                            if (row.vendorCode) {
                              const results = searchCustomer(row.vendorCode);
                              if (results.length > 0) {
                                setRows((prev) =>
                                  prev.map((r) =>
                                    r.id === row.id
                                      ? { ...r, vendor: results[0], vendorCode: results[0].code }
                                      : r
                                  )
                                );
                                setSuggestions(null);
                                setTimeout(() => {
                                  rowRefs[4].current?.focus();
                                }, 0);
                              } else {
                                alert("取引先が見つかりませんでした。");
                              }
                            }
                            return;
                          }
                          
                          if (suggestions && suggestions.field === `${row.id}-vendorCode`) {
                            if (e.key === "ArrowDown") {
                              e.preventDefault();
                              setSuggestions((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      selectedIndex: Math.min(
                                        prev.selectedIndex + 1,
                                        prev.items.length - 1
                                      ),
                                    }
                                  : null
                              );
                            } else if (e.key === "ArrowUp") {
                              e.preventDefault();
                              setSuggestions((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      selectedIndex: Math.max(prev.selectedIndex - 1, 0),
                                    }
                                  : null
                              );
                            } else if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                              e.preventDefault();
                              e.stopPropagation();
                              const selected = suggestions.items[suggestions.selectedIndex] as CustomerMaster;
                              if (selected) {
                                setRows((prev) =>
                                  prev.map((r) =>
                                    r.id === row.id
                                      ? { ...r, vendor: selected, vendorCode: selected.code }
                                      : r
                                  )
                                );
                                setSuggestions(null);
                                rowRefs[4].current?.focus();
                              }
                            }
                          } else if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                            e.preventDefault();
                            e.stopPropagation();
                            rowRefs[4].current?.focus();
                          }
                        }}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
                        placeholder="取引先コード"
                      />
                      {row.vendor && (
                        <div className="text-xs text-gray-600 mt-1">{row.vendor.name}</div>
                      )}
                      {suggestions &&
                        suggestions.field === `${row.id}-vendorCode` &&
                        suggestions.items.length > 0 &&
                        suggestions.position && (
                          <div
                            className="fixed bg-white border border-gray-300 rounded max-h-[150px] overflow-y-auto z-[1000] shadow-lg mt-1 suggestions-container"
                            style={{
                              top: `${suggestions.position.top}px`,
                              left: `${suggestions.position.left}px`,
                              width: `${suggestions.position.width}px`,
                            }}
                          >
                            {(suggestions.items as CustomerMaster[]).map((item, index) => (
                              <div
                                key={item.code}
                                onClick={() => {
                                  setRows((prev) =>
                                    prev.map((r) =>
                                      r.id === row.id
                                        ? { ...r, vendor: item, vendorCode: item.code }
                                        : r
                                    )
                                  );
                                  setSuggestions(null);
                                  rowRefs[4].current?.focus();
                                }}
                                className={`p-2 cursor-pointer text-sm ${
                                  index === suggestions.selectedIndex
                                    ? "bg-blue-50"
                                    : "bg-white hover:bg-gray-50"
                                }`}
                              >
                                {item.code} - {item.name}
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  </td>
                  {/* 支払方法 */}
                  <td className="p-2 border-r border-gray-300 overflow-hidden align-top">
                    <div className="relative">
                      <select
                        ref={rowRefs[4] as React.RefObject<HTMLSelectElement>}
                        value={row.paymentMethod}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r) =>
                              r.id === row.id ? { ...r, paymentMethod: e.target.value } : r
                            )
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                            if (row.paymentMethod) {
                              e.preventDefault();
                              e.stopPropagation();
                              setTimeout(() => {
                                rowRefs[5].current?.focus();
                              }, 10);
                            }
                          }
                        }}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow appearance-none pr-8"
                      >
                        <option value="">選択してください</option>
                        {searchPaymentMethod("").map((method) => (
                          <option key={method.code} value={method.name}>
                            {method.code} - {method.name}
                          </option>
                        ))}
                      </select>
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">▼</span>
                    </div>
                    {suggestions &&
                      suggestions.field === `${row.id}-paymentMethod` &&
                      suggestions.items.length > 0 &&
                      suggestions.position && (
                        <div
                          className="fixed bg-white border border-gray-300 rounded max-h-[150px] overflow-y-auto z-[1000] shadow-lg mt-1 suggestions-container"
                          style={{
                            top: `${suggestions.position.top}px`,
                            left: `${suggestions.position.left}px`,
                            width: `${suggestions.position.width}px`,
                          }}
                        >
                          {(suggestions.items as PaymentMethodMaster[]).map((item, index) => (
                            <div
                              key={item.code}
                              onClick={() => {
                                setRows((prev) =>
                                  prev.map((r) =>
                                    r.id === row.id ? { ...r, paymentMethod: item.name } : r
                                  )
                                );
                                setSuggestions(null);
                                rowRefs[5].current?.focus();
                              }}
                              className={`p-2 cursor-pointer text-sm ${
                                index === suggestions.selectedIndex
                                  ? "bg-blue-50"
                                  : "bg-white hover:bg-gray-50"
                              }`}
                            >
                              {item.code} - {item.name}
                            </div>
                          ))}
                        </div>
                      )}
                  </td>
                  {/* 用途・内容 */}
                  <td className="p-2 border-r border-gray-300 overflow-hidden align-top">
                    <input
                      ref={rowRefs[5] as React.RefObject<HTMLInputElement>}
                      type="text"
                      value={row.purpose}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r) =>
                            r.id === row.id ? { ...r, purpose: e.target.value } : r
                          )
                        )
                      }
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
                      placeholder="用途・内容"
                    />
                  </td>
                  {/* 領収書の有無 */}
                  <td className="p-2 border-r border-gray-300 overflow-hidden align-top">
                    <label className="flex items-center cursor-pointer">
                      <input
                        ref={rowRefs[6] as React.RefObject<HTMLInputElement>}
                        type="checkbox"
                        checked={row.hasReceipt}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((r) =>
                              r.id === row.id
                                ? { ...r, hasReceipt: e.target.checked }
                                : r
                            )
                          )
                        }
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="ml-2 text-sm text-gray-700">あり</span>
                    </label>
                  </td>
                  {/* 備考 */}
                  <td className="p-2 overflow-hidden align-top">
                    <input
                      ref={rowRefs[7] as React.RefObject<HTMLInputElement>}
                      type="text"
                      value={row.remarks}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r) =>
                            r.id === row.id ? { ...r, remarks: e.target.value } : r
                          )
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                          e.preventDefault();
                          e.stopPropagation();
                          const isLastRow = rowIndex === rows.length - 1;
                          if (isLastRow) {
                            // 最後の行の場合は新しい行を追加
                            handleInsertRow();
                          } else {
                            // 次の行の最初のフィールド（日付）にフォーカス
                            const nextRowIndex = rowIndex + 1;
                            if (nextRowIndex < rows.length) {
                              const nextRowId = rows[nextRowIndex].id;
                              const nextRowRefs = getRowInputRefs(nextRowId);
                              nextRowRefs[0].current?.focus();
                            }
                          }
                        }
                      }}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
                      placeholder="備考"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* 合計行 */}
          <tfoot>
            <tr className="bg-gray-100 border-t-2 border-gray-400 font-semibold">
              <td colSpan={2} className="p-3 border-r border-gray-300 text-right text-gray-700">
                合計
              </td>
              <td className="p-3 border-r border-gray-300 text-right text-gray-800">
                {formatAmount(totalAmount)}
              </td>
              <td colSpan={5} className="p-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* フッター部 */}
      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg mb-4 border border-gray-200 shadow-sm">
        <div className="font-semibold">
          合計金額: {formatAmount(totalAmount)}円
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleInsertRow}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-lg font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm"
            title="行を追加"
          >
            +
          </button>
          <button
            onClick={handleRegister}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md font-semibold shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
          >
            保存 (F12 / Ctrl+S)
          </button>
        </div>
      </div>

      {/* カレンダーモーダル */}
      {showCalendar && (
        <CalendarModal
          onClose={() => {
            setShowCalendar(false);
            setCalendarTarget(null);
          }}
          onSelectDate={(date) => {
            if (calendarTarget === "header") {
              setHeader((prev) => ({ ...prev, date }));
            } else if (calendarTarget) {
              setRows((prev) =>
                prev.map((r) =>
                  r.id === calendarTarget ? { ...r, date } : r
                )
              );
            }
          }}
          onAfterSelect={() => {
            if (calendarTarget === "header") {
              if (rows.length > 0) {
                const firstRowRefs = getRowInputRefs(rows[0].id);
                firstRowRefs[0].current?.focus();
              }
            } else if (calendarTarget) {
              const rowRefs = getRowInputRefs(calendarTarget);
              rowRefs[1].current?.focus();
            }
          }}
          initialDate={
            calendarTarget === "header"
              ? header.date
              : calendarTarget
              ? rows.find((r) => r.id === calendarTarget)?.date
              : undefined
          }
        />
      )}

      {/* ヘルプダイアログ */}
      {showHelp && <HelpDialog onClose={() => setShowHelp(false)} />}

      {/* FormNavigator */}
      <FormNavigator inputRefs={allInputRefs} />
    </div>
  );
};

