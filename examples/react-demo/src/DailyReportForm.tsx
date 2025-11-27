import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { FormNavigator } from "@hyperbind-lib/react";
import { usePresetKeybind } from "@hyperbind-lib/react";
import { useKeybind } from "@hyperbind-lib/react";
import { useModalKeybind } from "@hyperbind-lib/react";
import { useDisableCustomKeybindsWhileMounted } from "@hyperbind-lib/react";
import { CustomerMaster, searchCustomer } from "./masters";
import { CalendarModal } from "./CalendarModal";

/**
 * 営業日報ヘッダーのデータ型
 */
interface DailyReportHeader {
  date: string; // YYYY/MM/DD
}

/**
 * 営業日報明細行のデータ型
 */
interface DailyReportRow {
  id: string;
  customerCode: string;
  customer: CustomerMaster | null;
  interviewer: string; // 面談者
  discussionContent: string; // 商談内容
  nextAction: string; // 次回アクション
  remarks: string; // 所感・上司への報告
}

interface DailyReportFormProps {
  isActive?: boolean;
}

/**
 * 営業日報入力画面コンポーネント
 */
export const DailyReportForm = ({ isActive = true }: DailyReportFormProps) => {
  // ヘッダー情報
  const [header, setHeader] = useState<DailyReportHeader>({
    date: new Date().toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).replace(/\//g, "/"),
  });

  // 付箋機能：前回入力した日付を保持
  const [stickyDate, setStickyDate] = useState<string>(header.date);

  // カレンダーモーダルの表示状態
  const [showCalendar, setShowCalendar] = useState(false);

  // 明細行
  const [rows, setRows] = useState<DailyReportRow[]>([
    {
      id: "1",
      customerCode: "",
      customer: null,
      interviewer: "",
      discussionContent: "",
      nextAction: "",
      remarks: "",
    },
  ]);

  // サジェスト機能の状態管理
  const [suggestions, setSuggestions] = useState<{
    type: "customer";
    field: string; // rowId-customerCode
    items: CustomerMaster[];
    selectedIndex: number;
    position?: { top: number; left: number; width: number };
  } | null>(null);

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
        { current: null } as React.MutableRefObject<HTMLInputElement | null>, // customerCode
        { current: null } as React.MutableRefObject<HTMLInputElement | null>, // interviewer
        { current: null } as React.MutableRefObject<HTMLTextAreaElement | null>, // discussionContent
        { current: null } as React.MutableRefObject<HTMLTextAreaElement | null>, // nextAction
        { current: null } as React.MutableRefObject<HTMLTextAreaElement | null>, // remarks
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

  // 訪問件数の自動集計
  const visitCount = useMemo(() => rows.length, [rows.length]);

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
        if (row && fieldName === "customerCode") {
          const rowRefs = getRowInputRefs(rowId);
          const targetElement = rowRefs[0].current;
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
    return refs as React.RefObject<HTMLInputElement | HTMLTextAreaElement>[];
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

  // 新規日報
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
        customerCode: "",
        customer: null,
        interviewer: "",
        discussionContent: "",
        nextAction: "",
        remarks: "",
      },
    ]);
    dateInputRef.current?.focus();
  }, [stickyDate]);

  // 日報登録
  const handleRegister = useCallback(() => {
    // バリデーション
    if (rows.length === 0) {
      alert("訪問先を最低1件入力してください。");
      return;
    }

    const hasInvalidRow = rows.some(
      (row) => !row.customer
    );

    if (hasInvalidRow) {
      alert("訪問先が未選択の行があります。");
      return;
    }

    // 日付を付箋に保存
    setStickyDate(header.date);

    alert(
      `営業日報を登録しました。\n日付: ${header.date}\n訪問件数: ${visitCount}件`
    );
  }, [rows, visitCount, header]);

  // 日報削除
  const handleDelete = useCallback(() => {
    if (confirm("日報を削除しますか？")) {
      handleNew();
    }
  }, [handleNew]);

  // 行挿入
  const handleInsertRow = useCallback(() => {
    const newRow: DailyReportRow = {
      id: `row-${Date.now()}`,
      customerCode: "",
      customer: null,
      interviewer: "",
      discussionContent: "",
      nextAction: "",
      remarks: "",
    };
    setRows((prev) => [...prev, newRow]);
    // 新しい行の最初のフィールド（訪問先コード）にフォーカス
    setTimeout(() => {
      const newRowRefs = getRowInputRefs(newRow.id);
      newRowRefs[0].current?.focus();
    }, 0);
  }, [getRowInputRefs]);

  // 行削除
  const handleDeleteRow = useCallback(
    (rowId: string) => {
      if (rows.length === 1) {
        alert("最低1行は必要です。");
        return;
      }
      const deletedIndex = rows.findIndex((r) => r.id === rowId);
      setRows((prev) => {
        const newRows = prev.filter((row) => row.id !== rowId);
        // 削除後にフォーカスを移動
        setTimeout(() => {
          if (newRows.length > 0) {
            // 削除された行が最後の行だった場合は前の行に、そうでなければ次の行にフォーカス
            const focusIndex = deletedIndex >= newRows.length ? newRows.length - 1 : deletedIndex;
            const focusRowId = newRows[focusIndex].id;
            const focusRowRefs = getRowInputRefs(focusRowId);
            focusRowRefs[0].current?.focus(); // 訪問先コードフィールドにフォーカス
          }
        }, 0);
        return newRows;
      });
    },
    [rows, getRowInputRefs]
  );

  // 現在フォーカスされている行を取得
  const getFocusedRowId = useCallback((): string | null => {
    const activeElement = document.activeElement;
    if (!activeElement) return null;

    // すべての行をチェックして、activeElementがどの行のrefに属しているかを確認
    for (const row of rows) {
      const rowRefs = getRowInputRefs(row.id);
      for (const ref of rowRefs) {
        if (ref.current === activeElement) {
          return row.id;
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
  usePresetKeybind("voucher-entry-row-delete", () => {
    const focusedRowId = getFocusedRowId();
    if (focusedRowId) {
      handleDeleteRow(focusedRowId);
    } else if (rows.length > 0) {
      // フォーカスされている行がない場合は最後の行を削除
      handleDeleteRow(rows[rows.length - 1].id);
    }
  });

  // Ctrl+S: 登録
  useKeybind("ctrl+s", handleRegister);

  // Ctrl+Delete: 現在フォーカスされている行を削除
  useKeybind("ctrl+delete", () => {
    const focusedRowId = getFocusedRowId();
    if (focusedRowId) {
      handleDeleteRow(focusedRowId);
    } else if (rows.length > 0) {
      // フォーカスされている行がない場合は最後の行を削除
      handleDeleteRow(rows[rows.length - 1].id);
    }
  });

  // Alt+D: 日付へ移動
  usePresetKeybind("voucher-entry-date", () => {
    dateInputRef.current?.focus();
  });

  // F1: ヘルプ表示
  useModalKeybind({
    keyCombo: "f1",
    onOpen: () => setShowHelp(true),
    onClose: () => setShowHelp(false),
    isOpen: showHelp,
  });

  return (
    <div className="p-6 max-w-[1800px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">📋 営業日報入力</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCalendar(true)}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-sm font-semibold shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            title="カレンダーを表示"
          >
            📅 カレンダー
          </button>
          <button
            onClick={() => setShowHelp(true)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-semibold shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            title="F1: ヘルプを表示"
          >
            ❓ ヘルプ (F1)
          </button>
        </div>
      </div>

      {/* ヘッダー部 */}
      <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            日付
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
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            訪問件数（自動集計）
          </label>
          <div className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-100 text-gray-700 font-semibold">
            {visitCount} 件
          </div>
        </div>
      </div>

      {/* 明細テーブル部 */}
      <div className="overflow-x-auto mb-4 shadow-sm rounded-lg border border-gray-200">
        <table className="w-full border-collapse bg-white">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="p-3 border-r border-gray-300 text-left text-sm font-semibold text-gray-700">訪問先</th>
              <th className="p-3 border-r border-gray-300 text-left text-sm font-semibold text-gray-700">面談者</th>
              <th className="p-3 border-r border-gray-300 text-left text-sm font-semibold text-gray-700">商談内容</th>
              <th className="p-3 border-r border-gray-300 text-left text-sm font-semibold text-gray-700">次回アクション</th>
              <th className="p-3 border-r border-gray-300 text-left text-sm font-semibold text-gray-700">所感・上司への報告</th>
              <th className="p-3 text-left text-sm font-semibold text-gray-700">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => {
              const rowRefs = getRowInputRefs(row.id);
              return (
                <tr key={row.id} data-row-id={row.id} className="hover:bg-gray-50 border-b border-gray-200 transition-colors">
                  {/* 訪問先 */}
                  <td className="p-2 border-r border-gray-300 overflow-hidden align-top">
                    <div className="relative">
                      <input
                        ref={rowRefs[0] as React.RefObject<HTMLInputElement>}
                        type="text"
                        value={row.customerCode}
                        onChange={(e) => {
                          const value = e.target.value;
                          setRows((prev) =>
                            prev.map((r) =>
                              r.id === row.id ? { ...r, customerCode: value, customer: null } : r
                            )
                          );
                          if (value) {
                            const customers = searchCustomer(value);
                            const inputElement = e.target as HTMLInputElement;
                            const position = calculatePosition(inputElement);
                            setSuggestions({
                              type: "customer",
                              field: `${row.id}-customerCode`,
                              items: customers,
                              selectedIndex: 0,
                              position,
                            });
                          } else {
                            setSuggestions(null);
                          }
                        }}
                        onBlur={() => setTimeout(() => setSuggestions(null), 200)}
                        onKeyDown={(e) => {
                          if (suggestions && suggestions.field === `${row.id}-customerCode`) {
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
                                      ? {
                                          ...r,
                                          customerCode: selected.code,
                                          customer: selected,
                                        }
                                      : r
                                  )
                                );
                                setSuggestions(null);
                                rowRefs[1].current?.focus(); // 面談者へ移動
                              }
                            }
                          } else if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                            // サジェストが表示されていない場合もEnterキーで次のフィールドへ移動
                            e.preventDefault();
                            e.stopPropagation();
                            rowRefs[1].current?.focus(); // 面談者へ移動
                          }
                        }}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
                        placeholder="顧客コード"
                      />
                      {suggestions &&
                        suggestions.field === `${row.id}-customerCode` &&
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
                            {suggestions.items.map((item, index) => {
                              const customer = item as CustomerMaster;
                              return (
                                <div
                                  key={customer.code}
                                  onClick={() => {
                                    setRows((prev) =>
                                      prev.map((r) =>
                                        r.id === row.id
                                          ? {
                                              ...r,
                                              customerCode: customer.code,
                                              customer: customer,
                                            }
                                          : r
                                      )
                                    );
                                    setSuggestions(null);
                                    rowRefs[1].current?.focus(); // 面談者へ移動
                                  }}
                                  className={`p-2 cursor-pointer text-xs ${
                                    index === suggestions.selectedIndex
                                      ? "bg-blue-50"
                                      : "bg-white hover:bg-gray-50"
                                  }`}
                                >
                                  {customer.code} - {customer.name}
                                </div>
                              );
                            })}
                          </div>
                        )}
                    </div>
                    {row.customer && (
                      <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                        <div><strong>会社名:</strong> {row.customer.name}</div>
                        {row.customer.contactPerson && (
                          <div><strong>担当者:</strong> {row.customer.contactPerson}</div>
                        )}
                      </div>
                    )}
                  </td>
                  {/* 面談者 */}
                  <td className="p-2 border-r border-gray-300 overflow-hidden align-top">
                    <input
                      ref={rowRefs[1] as React.RefObject<HTMLInputElement>}
                      type="text"
                      value={row.interviewer}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r) =>
                            r.id === row.id ? { ...r, interviewer: e.target.value } : r
                          )
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                          e.preventDefault();
                          e.stopPropagation();
                          rowRefs[2].current?.focus(); // 商談内容へ移動
                        }
                      }}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
                      placeholder="面談者名"
                    />
                  </td>
                  {/* 商談内容 */}
                  <td className="p-2 border-r border-gray-300 overflow-hidden align-top">
                    <textarea
                      ref={rowRefs[2] as React.RefObject<HTMLTextAreaElement>}
                      value={row.discussionContent}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r) =>
                            r.id === row.id ? { ...r, discussionContent: e.target.value } : r
                          )
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Tab" && !e.shiftKey) {
                          e.preventDefault();
                          rowRefs[3].current?.focus(); // 次回アクションへ移動
                        }
                      }}
                      rows={3}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow resize-none"
                      placeholder="商談内容を入力"
                    />
                  </td>
                  {/* 次回アクション */}
                  <td className="p-2 border-r border-gray-300 overflow-hidden align-top">
                    <textarea
                      ref={rowRefs[3] as React.RefObject<HTMLTextAreaElement>}
                      value={row.nextAction}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r) =>
                            r.id === row.id ? { ...r, nextAction: e.target.value } : r
                          )
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Tab" && !e.shiftKey) {
                          e.preventDefault();
                          rowRefs[4].current?.focus(); // 所感へ移動
                        }
                      }}
                      rows={3}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow resize-none"
                      placeholder="次回アクションを入力"
                    />
                  </td>
                  {/* 所感・上司への報告 */}
                  <td className="p-2 border-r border-gray-300 overflow-hidden align-top">
                    <textarea
                      ref={rowRefs[4] as React.RefObject<HTMLTextAreaElement>}
                      value={row.remarks}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r) =>
                            r.id === row.id ? { ...r, remarks: e.target.value } : r
                          )
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.shiftKey) {
                          // Shift+Enterで次の行へ
                          e.preventDefault();
                          e.stopPropagation();
                          const isLastRow = rowIndex === rows.length - 1;
                          if (isLastRow) {
                            // 最後の行の場合は新しい行を追加
                            handleInsertRow();
                          } else {
                            // 次の行の最初のフィールド（訪問先コード）にフォーカス
                            const nextRowIndex = rowIndex + 1;
                            if (nextRowIndex < rows.length) {
                              const nextRowId = rows[nextRowIndex].id;
                              const nextRowRefs = getRowInputRefs(nextRowId);
                              nextRowRefs[0].current?.focus();
                            }
                          }
                        }
                      }}
                      rows={3}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow resize-none"
                      placeholder="所感・上司への報告を入力"
                    />
                  </td>
                  {/* 操作 */}
                  <td className="p-2 overflow-hidden align-top">
                    <button
                      onClick={() => handleDeleteRow(row.id)}
                      className="px-3 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                      title="この行を削除"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* フッター部 */}
      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg mb-4 border border-gray-200 shadow-sm">
        <div className="font-semibold text-lg">
          訪問件数: {visitCount} 件
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

      {/* FormNavigator */}
      <FormNavigator inputRefs={allInputRefs} />

      {/* カレンダーモーダル */}
      {showCalendar && (
        <CalendarModal
          onClose={() => setShowCalendar(false)}
          onSelectDate={(dateStr) => {
            setHeader((prev) => ({ ...prev, date: dateStr }));
            setShowCalendar(false);
          }}
          initialDate={header.date}
        />
      )}

      {/* ヘルプダイアログ */}
      {showHelp && <DailyReportFormHelpDialog onClose={() => setShowHelp(false)} />}
    </div>
  );
};

/**
 * 営業日報入力画面のヘルプダイアログ
 */
const DailyReportFormHelpDialog = ({ onClose }: { onClose: () => void }) => {
  useDisableCustomKeybindsWhileMounted();

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()} tabIndex={-1}>
        <h3>❓ 営業日報入力 - ヘルプ</h3>
        
        <div style={{ textAlign: "left", marginTop: "1rem" }}>
          {/* 移動の流れ */}
          <section style={{ marginBottom: "1.5rem" }}>
            <h4 style={{ fontSize: "1.1rem", fontWeight: "bold", marginBottom: "0.5rem" }}>📋 入力の流れ</h4>
            <ol style={{ paddingLeft: "1.5rem", lineHeight: "1.8" }}>
              <li><strong>日付</strong> → 日付を入力（例: "5" → 今月5日、 "1225" → 12月25日）</li>
              <li><strong>訪問先</strong> → 顧客コードを入力するとサジェストが表示されます</li>
              <li><strong>面談者</strong> → 面談者名を入力</li>
              <li><strong>商談内容</strong> → 商談内容を入力（Tabキーで次へ）</li>
              <li><strong>次回アクション</strong> → 次回アクションを入力（Tabキーで次へ）</li>
              <li><strong>所感・上司への報告</strong> → 所感を入力（Shift+Enterで次の行へ）</li>
            </ol>
          </section>

          {/* キーボードショートカット */}
          <section style={{ marginBottom: "1.5rem" }}>
            <h4 style={{ fontSize: "1.1rem", fontWeight: "bold", marginBottom: "0.5rem" }}>⌨️ キーボードショートカット</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem", fontSize: "0.9rem" }}>
              <div>
                <div><strong>F1</strong>: ヘルプ表示</div>
                <div><strong>F2</strong> / <strong>Shift+F8</strong>: 新規作成</div>
                <div><strong>F12</strong> / <strong>Ctrl+S</strong>: 登録</div>
                <div><strong>Alt+D</strong>: 日付へ移動</div>
              </div>
              <div>
                <div><strong>Ctrl+Insert</strong>: 行挿入</div>
                <div><strong>Ctrl+Delete</strong>: 現在の行を削除</div>
                <div><strong>Tab</strong>: 次のフィールドへ移動</div>
                <div><strong>Shift+Enter</strong>: 次の行へ（所感フィールドで）</div>
                <div><strong>↑↓</strong>: サジェスト内で移動</div>
                <div><strong>Esc</strong>: ダイアログを閉じる</div>
              </div>
            </div>
          </section>

          {/* 便利な機能 */}
          <section style={{ marginBottom: "1.5rem" }}>
            <h4 style={{ fontSize: "1.1rem", fontWeight: "bold", marginBottom: "0.5rem" }}>💡 便利な機能</h4>
            <ul style={{ paddingLeft: "1.5rem", lineHeight: "1.8" }}>
              <li><strong>訪問件数の自動集計</strong>: 明細行数が自動的に訪問件数として表示されます</li>
              <li><strong>サジェスト機能</strong>: 訪問先コードを入力すると、候補が表示されます</li>
              <li><strong>日付の簡易入力</strong>: "5"（今月5日）、"1225"（12月25日）など、短い形式で入力できます</li>
              <li><strong>行の追加</strong>: 所感フィールドでShift+Enterキーを押すと、自動的に次の行が追加されます</li>
              <li><strong>行の削除</strong>: 削除ボタンをクリックするか、Ctrl+Deleteキーで行を削除できます</li>
            </ul>
          </section>

          {/* 注意事項 */}
          <section>
            <h4 style={{ fontSize: "1.1rem", fontWeight: "bold", marginBottom: "0.5rem" }}>⚠️ 注意事項</h4>
            <ul style={{ paddingLeft: "1.5rem", lineHeight: "1.8" }}>
              <li>最低1行の明細が必要です</li>
              <li>登録時には訪問先の選択が必須です</li>
            </ul>
          </section>
        </div>

        <button 
          onClick={onClose}
          style={{
            padding: "0.5rem 1.5rem",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: "bold",
            marginTop: "1rem",
          }}
        >
          閉じる
        </button>
      </div>
    </div>
  );
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.3)",
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
  maxWidth: "800px",
  maxHeight: "90vh",
  overflowY: "auto",
};

