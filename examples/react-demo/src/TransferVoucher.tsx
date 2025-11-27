import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { FormNavigator } from "@hyperbind-lib/react";
import { usePresetKeybind } from "@hyperbind-lib/react";
import { useKeybind } from "@hyperbind-lib/react";
import { useInputKeybind } from "@hyperbind-lib/react";
import {
  ACCOUNT_MASTERS,
  DEPARTMENT_MASTERS,
  TAX_TYPES,
  searchAccount,
  searchSubAccount,
  searchDepartment,
  searchDescription,
  type AccountMaster,
  type SubAccountMaster,
  type DepartmentMaster,
} from "./masters";

/**
 * タグのデータ型
 */
interface Tag {
  id: string;
  type: "vendor" | "item" | "department" | "memo" | "segment"; // 取引先、品目、部門、メモタグ、セグメント
  label: string;
  color: "red" | "green" | "orange" | "blue";
}

/**
 * 明細行のデータ型
 */
interface VoucherRow {
  id: string;
  date: string; // 日付
  settlement: string; // 決済
  debitAmount: number;
  debitAccount: string;
  debitSubAccount: string; // 借方補助科目
  debitTaxType: string;
  debitTags: Tag[];
  creditAmount: number;
  creditAccount: string;
  creditSubAccount: string; // 貸方補助科目
  creditTaxType: string;
  creditTags: Tag[];
  remarks: string; // 摘要（備考）
  eligibleInvoice: boolean; // 適格請求書等
  evidence: string; // 電子証憑ファイル名
}

/**
 * 伝票ヘッダーのデータ型
 */
interface VoucherHeader {
  date: string; // YYYY/MM/DD
  voucherNumber: string;
  isAdjustmentEntry: boolean;
}

/**
 * 振替伝票入力画面コンポーネント
 */
export const TransferVoucher = () => {
  // ヘッダー情報
  const [header, setHeader] = useState<VoucherHeader>({
    date: new Date().toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).replace(/\//g, "/"),
    voucherNumber: "",
    isAdjustmentEntry: false,
  });

  // 付箋機能：前回入力した日付を保持
  const [stickyDate, setStickyDate] = useState<string>(header.date);

  // 明細行
  const [rows, setRows] = useState<VoucherRow[]>([
    {
      id: "1",
      date: header.date,
      settlement: "",
      debitAmount: 0,
      debitAccount: "",
      debitSubAccount: "",
      debitTaxType: "none",
      debitTags: [],
      creditAmount: 0,
      creditAccount: "",
      creditSubAccount: "",
      creditTaxType: "none",
      creditTags: [],
      remarks: "",
      eligibleInvoice: false,
      evidence: "",
    },
  ]);

  // クリップボード（行コピー用）
  const [clipboard, setClipboard] = useState<VoucherRow | null>(null);

  // サジェスト機能の状態管理
  const [suggestions, setSuggestions] = useState<{
    type: "account" | "subAccount" | "department" | "description";
    field: string; // rowId-fieldName
    items: (AccountMaster | SubAccountMaster | DepartmentMaster | string)[];
    selectedIndex: number;
    position?: { top: number; left: number; width: number }; // ドロップダウンの位置
  } | null>(null);

  // タグ選択の状態管理
  const [tagSelector, setTagSelector] = useState<{
    rowId: string;
    field: "debitTags" | "creditTags";
    position?: { top: number; left: number; width: number }; // ドロップダウンの位置
  } | null>(null);

  // タグ選択の選択インデックス
  const [selectedTagIndex, setSelectedTagIndex] = useState<number>(0);

  // 入力フィールドの参照（FormNavigator用）
  const dateInputRef = useRef<HTMLInputElement>(null);
  const voucherNumberInputRef = useRef<HTMLInputElement>(null);
  
  // 各行の各フィールドのrefを管理するMap
  const rowInputRefsMap = useRef<Map<string, React.MutableRefObject<HTMLElement | null>[]>>(new Map());
  
  // 各行のファイル入力のrefを管理するMap
  const fileInputRefsMap = useRef<Map<string, React.RefObject<HTMLInputElement>>>(new Map());

  // 行のrefを取得または作成
  const getRowInputRefs = useCallback((rowId: string): React.MutableRefObject<HTMLElement | null>[] => {
    if (!rowInputRefsMap.current.has(rowId)) {
      rowInputRefsMap.current.set(rowId, [
        { current: null } as React.MutableRefObject<HTMLInputElement | null>, // date
        { current: null } as React.MutableRefObject<HTMLInputElement | null>, // settlement
        { current: null } as React.MutableRefObject<HTMLSelectElement | null>, // debitAccount (select)
        { current: null } as React.MutableRefObject<HTMLInputElement | null>, // debitSubAccount (補助科目)
        { current: null } as React.MutableRefObject<HTMLButtonElement | null>, // debitTagButton (タグボタン)
        { current: null } as React.MutableRefObject<HTMLInputElement | null>, // debitAmount
        { current: null } as React.MutableRefObject<HTMLSelectElement | null>, // debitTaxType (税率)
        { current: null } as React.MutableRefObject<HTMLSelectElement | null>, // creditAccount (select)
        { current: null } as React.MutableRefObject<HTMLInputElement | null>, // creditSubAccount (補助科目)
        { current: null } as React.MutableRefObject<HTMLButtonElement | null>, // creditTagButton (タグボタン)
        { current: null } as React.MutableRefObject<HTMLInputElement | null>, // creditAmount
        { current: null } as React.MutableRefObject<HTMLSelectElement | null>, // creditTaxType (税率)
        { current: null } as React.MutableRefObject<HTMLInputElement | null>, // remarks (摘要)
        { current: null } as React.MutableRefObject<HTMLInputElement | null>, // eligibleInvoice (適格請求書等)
        { current: null } as React.MutableRefObject<HTMLButtonElement | null>, // evidenceButton (証憑ボタン)
      ]);
    }
    return rowInputRefsMap.current.get(rowId)!;
  }, []);

  // ファイル入力のrefを取得または作成
  const getFileInputRef = useCallback((rowId: string): React.RefObject<HTMLInputElement> => {
    if (!fileInputRefsMap.current.has(rowId)) {
      fileInputRefsMap.current.set(rowId, React.createRef<HTMLInputElement>());
    }
    return fileInputRefsMap.current.get(rowId)!;
  }, []);

  // 不要なrefをクリーンアップ
  useEffect(() => {
    const currentRowIds = new Set(rows.map((r) => r.id));
    for (const [rowId] of rowInputRefsMap.current) {
      if (!currentRowIds.has(rowId)) {
        rowInputRefsMap.current.delete(rowId);
      }
    }
    for (const [rowId] of fileInputRefsMap.current) {
      if (!currentRowIds.has(rowId)) {
        fileInputRefsMap.current.delete(rowId);
      }
    }
  }, [rows]);

  // タグ選択ドロップダウンを外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tagSelector && !(e.target as Element).closest('.tag-selector-container')) {
        setTagSelector(null);
        setSelectedTagIndex(0);
      }
    };
    if (tagSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [tagSelector]);

  // タグ選択ドロップダウンが開いたときにフォーカスを設定
  useEffect(() => {
    if (tagSelector && tagSelector.position) {
      // ドロップダウンコンテナにフォーカスを設定
      setTimeout(() => {
        const dropdown = document.querySelector('[data-tag-dropdown]') as HTMLElement;
        if (dropdown) {
          dropdown.focus();
        }
      }, 10);
    } else {
      // タグ選択が閉じられたときにselectedTagIndexをリセット
      setSelectedTagIndex(0);
    }
  }, [tagSelector]);

  // スクロール時にサジェストとタグ選択の位置を再計算
  useEffect(() => {
    if (!suggestions && !tagSelector) return;

    const handleScroll = () => {
      // スクロール時に位置を再計算
      if (suggestions && suggestions.position) {
        const fieldParts = suggestions.field.split('-');
        const rowId = fieldParts[0];
        const row = rows.find((r) => r.id === rowId);
        if (row) {
          // 補助科目の入力フィールドを探す
          const allInputs = document.querySelectorAll('input[placeholder="補助科目"]');
          allInputs.forEach((input) => {
            const inputElement = input as HTMLInputElement;
            const parentRow = inputElement.closest('tr');
            if (parentRow && parentRow.getAttribute('data-row-id') === rowId) {
              const position = calculatePosition(inputElement);
              if (position) {
                setSuggestions((prev) => prev ? { ...prev, position } : null);
              }
            }
          });
        }
      }
      if (tagSelector && tagSelector.position) {
        // タグ選択ボタンを探す
        const buttons = document.querySelectorAll('button');
        buttons.forEach((button) => {
          if (button.textContent === 'タグ ▼') {
            const parentRow = button.closest('tr');
            if (parentRow && parentRow.getAttribute('data-row-id') === tagSelector.rowId) {
              const position = calculatePosition(button);
              if (position) {
                setTagSelector((prev) => prev ? { ...prev, position } : null);
              }
            }
          }
        });
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
  }, [suggestions, tagSelector, rows]);

  // すべての入力フィールドの参照を収集（FormNavigator用）
  const allInputRefs = React.useMemo(() => {
    const refs: React.RefObject<HTMLElement>[] = [
      dateInputRef as React.RefObject<HTMLElement>,
      voucherNumberInputRef as React.RefObject<HTMLElement>,
    ].map(ref => ref as React.RefObject<HTMLElement>);
    rows.forEach((row) => {
      const rowRefs = getRowInputRefs(row.id);
      // 順序: date, settlement, debitAccount, debitSubAccount(条件付き), debitTagButton, debitAmount, debitTaxType, creditAccount, creditSubAccount(条件付き), creditTagButton, creditAmount, creditTaxType, remarks
      refs.push(rowRefs[0]); // date
      refs.push(rowRefs[1]); // settlement
      refs.push(rowRefs[2]); // debitAccount
      // 補助科目のrefは常に追加（表示されていない場合はnullになるが、FormNavigatorがスキップする）
      // これにより、補助科目の有無に関わらず、タグボタンの次が借方金額になる
      refs.push(rowRefs[3]); // debitSubAccount (表示されていない場合はnull)
      // タグボタンは常に追加（補助科目の有無に関わらず、タグボタンの次が借方金額になるようにする）
      refs.push(rowRefs[4]); // debitTagButton
      refs.push(rowRefs[5]); // debitAmount
      refs.push(rowRefs[6]); // debitTaxType (税率)
      refs.push(rowRefs[7]); // creditAccount
      // 補助科目のrefは常に追加（表示されていない場合はnullになるが、FormNavigatorがスキップする）
      refs.push(rowRefs[8]); // creditSubAccount (表示されていない場合はnull)
      refs.push(rowRefs[9]); // creditTagButton
      refs.push(rowRefs[10]); // creditAmount
      refs.push(rowRefs[11]); // creditTaxType (税率)
      refs.push(rowRefs[12]); // remarks (摘要)
      refs.push(rowRefs[13]); // eligibleInvoice (適格請求書等)
      refs.push(rowRefs[14]); // evidenceButton (証憑ボタン)
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
  const totalDebit = rows.reduce((sum, row) => sum + row.debitAmount, 0);
  const totalCredit = rows.reduce((sum, row) => sum + row.creditAmount, 0);
  const balance = totalDebit - totalCredit;

  // 新規伝票
  const handleNew = useCallback(() => {
    const newDate = stickyDate || new Date().toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).replace(/\//g, "/");
    setHeader({
      date: newDate,
      voucherNumber: "",
      isAdjustmentEntry: false,
    });
    setRows([
      {
        id: "1",
        date: newDate,
        settlement: "",
        debitAmount: 0,
        debitAccount: "",
        debitSubAccount: "",
        debitTaxType: "none",
        debitTags: [],
        creditAmount: 0,
        creditAccount: "",
        creditSubAccount: "",
        creditTaxType: "none",
        creditTags: [],
        remarks: "",
        eligibleInvoice: false,
        evidence: "",
      },
    ]);
    dateInputRef.current?.focus();
  }, [stickyDate]);

  // 伝票登録
  const handleRegister = useCallback(() => {
    // バリデーション
    const hasInvalidRow = rows.some(
      (row) =>
        (row.debitAmount > 0 && !row.debitAccount) ||
        (row.creditAmount > 0 && !row.creditAccount)
    );

    if (hasInvalidRow) {
      alert("金額が入力されている行で、勘定科目が未入力です。");
      return;
    }

    if (balance !== 0) {
      alert(
        `貸借が一致しません。\n借方合計: ${formatAmount(totalDebit)}\n貸方合計: ${formatAmount(totalCredit)}\n差額: ${formatAmount(Math.abs(balance))}`
      );
      return;
    }

    // 日付を付箋に保存
    setStickyDate(header.date);

    alert(
      `伝票を登録しました。\n伝票番号: ${header.voucherNumber || "（自動採番）"}\n日付: ${header.date}\n借方合計: ${formatAmount(totalDebit)}\n貸方合計: ${formatAmount(totalCredit)}`
    );
  }, [rows, balance, totalDebit, totalCredit, header]);

  // 伝票削除
  const handleDelete = useCallback(() => {
    if (confirm("伝票を削除しますか？")) {
      handleNew();
    }
  }, [handleNew]);

  // 行挿入
  const handleInsertRow = useCallback(() => {
    const newRow: VoucherRow = {
      id: `row-${Date.now()}`,
      date: header.date,
      settlement: "",
      debitAmount: 0,
      debitAccount: "",
      debitSubAccount: "",
      debitTaxType: "none",
      debitTags: [],
      creditAmount: 0,
      creditAccount: "",
      creditSubAccount: "",
      creditTaxType: "none",
      creditTags: [],
      remarks: "",
      eligibleInvoice: false,
      evidence: "",
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
      const newRow: VoucherRow = {
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

  // 前行項目複写
  const handleCopyPrevRow = useCallback(
    (rowId: string) => {
      const index = rows.findIndex((r) => r.id === rowId);
      if (index > 0) {
        const prevRow = rows[index - 1];
        setRows((prev) =>
          prev.map((row) => (row.id === rowId ? { ...prevRow, id: rowId } : row))
        );
      }
    },
    [rows]
  );

  // 貸借バランス0の金額・相手金額を入力
  const handleBalanceAmount = useCallback(
    (rowId: string, isDebit: boolean) => {
      const row = rows.find((r) => r.id === rowId);
      if (!row) return;

      const otherAmount = isDebit ? row.creditAmount : row.debitAmount;
      if (otherAmount === 0) {
        alert("相手方の金額を先に入力してください。");
        return;
      }

      setRows((prev) =>
        prev.map((r) =>
          r.id === rowId
            ? {
                ...r,
                [isDebit ? "debitAmount" : "creditAmount"]: otherAmount,
              }
            : r
        )
      );
    },
    [rows]
  );

  // 摘要のコピー（F5キー用）- 前行の摘要をコピー
  const handleCopyDescription = useCallback(
    (rowId: string) => {
      const index = rows.findIndex((r) => r.id === rowId);
      if (index > 0) {
        const prevRemarks = rows[index - 1].remarks;
        setRows((prev) =>
          prev.map((row) =>
            row.id === rowId ? { ...row, remarks: prevRemarks } : row
          )
        );
      }
    },
    [rows]
  );

  // キーバインド登録
  usePresetKeybind("voucher-entry-new", handleNew);
  usePresetKeybind("voucher-entry-register", handleRegister);
  usePresetKeybind("voucher-entry-delete", handleDelete);
  usePresetKeybind("voucher-entry-row-insert", handleInsertRow);
  usePresetKeybind("voucher-entry-row-cut", () => {
    // 現在フォーカスされている行を特定する必要がある
    // 簡易実装として、最後の行を対象とする
    if (rows.length > 0) {
      handleCutRow(rows[rows.length - 1].id);
    }
  });
  usePresetKeybind("voucher-entry-row-copy", () => {
    if (rows.length > 0) {
      handleCopyRow(rows[rows.length - 1].id);
    }
  });
  usePresetKeybind("voucher-entry-row-paste", () => {
    if (rows.length > 0) {
      handlePasteRow(rows[rows.length - 1].id);
    }
  });
  usePresetKeybind("voucher-entry-row-delete", () => {
    if (rows.length > 0) {
      handleDeleteRow(rows[rows.length - 1].id);
    }
  });
  usePresetKeybind("voucher-entry-row-copy-prev", () => {
    if (rows.length > 0) {
      handleCopyPrevRow(rows[rows.length - 1].id);
    }
  });

  // Ctrl+S: 登録
  useKeybind("ctrl+s", handleRegister);

  // Alt+D: 日付へ移動
  usePresetKeybind("voucher-entry-date", () => {
    dateInputRef.current?.focus();
  });

  return (
    <div className="p-6 max-w-[1800px] mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">📋 振替伝票入力</h2>

      {/* ヘッダー部 */}
      <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            計上日（取引日）
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
                e.stopPropagation(); // FormNavigatorの処理を防ぐ
                // 既にYYYY/MM/DD形式の場合は変換せずに伝票番号へ移動
                if (/^\d{4}\/\d{2}\/\d{2}$/.test(header.date)) {
                  voucherNumberInputRef.current?.focus();
                } else {
                  // 変換が必要な場合のみ変換してから移動
                  const convertedDate = parseDateInput(header.date);
                  setHeader((prev) => ({ ...prev, date: convertedDate }));
                  setTimeout(() => {
                    voucherNumberInputRef.current?.focus();
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
            伝票番号
          </label>
          <input
            ref={voucherNumberInputRef}
            type="text"
            value={header.voucherNumber}
            onChange={(e) =>
              setHeader((prev) => ({ ...prev, voucherNumber: e.target.value }))
            }
            placeholder="自動採番または手入力"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={header.isAdjustmentEntry}
              onChange={(e) =>
                setHeader((prev) => ({
                  ...prev,
                  isAdjustmentEntry: e.target.checked,
                }))
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mr-2"
            />
            <span className="text-sm font-medium text-gray-700">決算整理仕訳</span>
          </label>
        </div>
      </div>

      {/* 明細グリッド部 - 1つのテーブルに統合 */}
      <div className="overflow-x-auto mb-4 shadow-sm rounded-lg border border-gray-200">
        <table className="w-full border-collapse bg-white">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="p-3 border-r border-gray-300 text-left text-sm font-semibold text-gray-700">日付 ↑</th>
              <th className="p-3 border-r border-gray-300 text-left text-sm font-semibold text-gray-700">決済</th>
              <th className="p-3 border-r border-gray-300 text-left text-sm font-semibold text-gray-700">借方科目</th>
              <th className="p-3 border-r border-gray-300 text-left text-sm font-semibold text-gray-700">借方金額</th>
              <th className="p-3 border-r border-gray-300 text-left text-sm font-semibold text-gray-700">貸方科目</th>
              <th className="p-3 border-r border-gray-300 text-left text-sm font-semibold text-gray-700">貸方金額</th>
              <th className="p-3 border-r border-gray-300 text-left text-sm font-semibold text-gray-700">摘要</th>
              <th className="p-3 border-r border-gray-300 text-left text-sm font-semibold text-gray-700">適格請求書等</th>
              <th className="p-3 text-left text-sm font-semibold text-gray-700">電子証憑</th>
            </tr>
          </thead>
          <tbody>
                {rows.map((row, rowIndex) => {
                  const rowRefs = getRowInputRefs(row.id);
                  return (
                    <tr key={row.id} data-row-id={row.id} className="hover:bg-gray-50 border-b border-gray-200 transition-colors">
                      {/* 日付 */}
                      <td className="p-2 border-r border-gray-300 overflow-hidden align-top">
                        <div className="flex flex-col gap-1">
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
                                e.stopPropagation(); // FormNavigatorの処理を防ぐ
                                // 既にYYYY/MM/DD形式の場合は変換せずに決済フィールドへ移動
                                if (/^\d{4}\/\d{2}\/\d{2}$/.test(row.date)) {
                                  rowRefs[1].current?.focus(); // settlement
                                } else {
                                  // 変換が必要な場合のみ変換してから決済フィールドへ移動
                                  const convertedDate = parseDateInput(row.date);
                                  setRows((prev) =>
                                    prev.map((r) =>
                                      r.id === row.id ? { ...r, date: convertedDate } : r
                                    )
                                  );
                                  setTimeout(() => {
                                    rowRefs[1].current?.focus(); // settlement
                                  }, 0);
                                }
                              }
                            }}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
                            placeholder="YYYY/MM/DD または 1, 20, 30 (今月のその日) または 0101 (1月1日)"
                          />
                          <div className="text-xs text-gray-500">取引</div>
                        </div>
                      </td>
                      {/* 決済 */}
                      <td className="p-2 border-r border-gray-300 overflow-hidden align-top">
                        <input
                          ref={rowRefs[1] as React.RefObject<HTMLInputElement>}
                          type="text"
                          value={row.settlement}
                          onChange={(e) =>
                            setRows((prev) =>
                              prev.map((r) =>
                                r.id === row.id ? { ...r, settlement: e.target.value } : r
                              )
                            )
                          }
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
                        />
                      </td>
                      {/* 借方科目 */}
                      <td className="p-2 border-r border-gray-300 relative overflow-visible align-top min-w-[200px]">
                        <div className="flex flex-col gap-1">
                          <div className="relative">
                            <select
                              ref={rowRefs[2] as React.RefObject<HTMLSelectElement>}
                              value={row.debitAccount}
                              onChange={(e) => {
                                const selectedAccount = ACCOUNT_MASTERS.find((a) => a.name === e.target.value);
                                setRows((prev) =>
                                  prev.map((r) =>
                                    r.id === row.id
                                      ? {
                                          ...r,
                                          debitAccount: e.target.value,
                                          debitTaxType: selectedAccount?.defaultTaxType || "none",
                                          debitSubAccount: "", // 科目変更時に補助科目をクリア
                                        }
                                      : r
                                  )
                                );
                              }}
                              onKeyDown={(e) => {
                                // Spaceキーでセレクトボックスを開閉（デフォルトの動作を許可）
                                if (e.key === " ") {
                                  // Spaceキーはデフォルトの動作（セレクトボックスを開く）を許可
                                  return;
                                }
                                // Enterキーで選択確定後に次のフィールドへ移動
                                if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                                  // 値が選択されている場合のみ次のフィールドへ移動
                                  if (row.debitAccount) {
                                    e.preventDefault();
                                    e.stopPropagation(); // FormNavigatorの処理を防ぐ
                                    // 補助科目がある場合は補助科目へ、なければ借方金額へ
                                    const selectedAccount = ACCOUNT_MASTERS.find((a) => a.name === row.debitAccount);
                                    setTimeout(() => {
                                      if (selectedAccount && selectedAccount.subAccounts && selectedAccount.subAccounts.length > 0) {
                                        // 補助科目の入力フィールドが存在するか確認
                                        const subAccountInput = rowRefs[3].current;
                                        if (subAccountInput) {
                                          subAccountInput.focus(); // 補助科目へ
                                        } else {
                                          // 補助科目がまだDOMに存在しない場合は金額へ
                                          rowRefs[4].current?.focus(); // 借方金額へ
                                        }
                                      } else {
                                        rowRefs[4].current?.focus(); // 借方金額へ
                                      }
                                    }, 10); // 少し長めのタイムアウトで確実にDOM更新を待つ
                                  }
                                  // 値が選択されていない場合はデフォルトの動作（セレクトボックスを開く）を許可
                                }
                              }}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow appearance-none pr-8"
                            >
                              <option value="">選択してください</option>
                              {ACCOUNT_MASTERS.map((account) => (
                                <option key={account.code} value={account.name}>
                                  {account.code} - {account.name}
                                </option>
                              ))}
                            </select>
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">▼</span>
                          </div>
                          {/* 補助科目入力 */}
                          {(() => {
                            const selectedAccount = ACCOUNT_MASTERS.find((a) => a.name === row.debitAccount);
                            if (selectedAccount && selectedAccount.subAccounts && selectedAccount.subAccounts.length > 0) {
                              return (
                                <div className="relative mt-1">
                                  <input
                                    ref={rowRefs[3] as React.RefObject<HTMLInputElement>}
                                    type="text"
                                    value={row.debitSubAccount}
                                    data-form-navigator-skip="true"
                                    onFocus={(e) => {
                                      // フォーカス時に位置を計算（サジェスト表示用）
                                      if (suggestions?.field === `${row.id}-debitSubAccount` && !suggestions.position) {
                                        const position = calculatePosition(e.target);
                                        if (position) {
                                          setSuggestions((prev) => prev ? { ...prev, position } : null);
                                        }
                                      }
                                    }}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setRows((prev) =>
                                        prev.map((r) =>
                                          r.id === row.id ? { ...r, debitSubAccount: value } : r
                                        )
                                      );
                                      if (value) {
                                        const subAccounts = searchSubAccount(selectedAccount.code, value);
                                        const inputElement = e.target as HTMLInputElement;
                                        const position = calculatePosition(inputElement);
                                        setSuggestions({
                                          type: "subAccount",
                                          field: `${row.id}-debitSubAccount`,
                                          items: subAccounts,
                                          selectedIndex: 0,
                                          position,
                                        });
                                      } else {
                                        setSuggestions(null);
                                      }
                                    }}
                                    onBlur={() => setTimeout(() => setSuggestions(null), 200)}
                                    onKeyDown={(e) => {
                                      if (suggestions && suggestions.field === `${row.id}-debitSubAccount`) {
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
                                          e.stopPropagation(); // FormNavigatorの処理を防ぐ
                                          const selected = suggestions.items[suggestions.selectedIndex] as SubAccountMaster;
                                          if (selected) {
                                            setRows((prev) =>
                                              prev.map((r) =>
                                                r.id === row.id
                                                  ? { ...r, debitSubAccount: selected.name }
                                                  : r
                                              )
                                            );
                                            setSuggestions(null);
                                            (rowRefs[4] as React.RefObject<HTMLButtonElement>).current?.focus(); // 借方タグボタンへ移動
                                          }
                                        }
                                      } else if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                                        // サジェストが表示されていない場合もEnterキーで次のフィールドへ移動
                                        e.preventDefault();
                                        e.stopPropagation(); // FormNavigatorの処理を防ぐ
                                        (rowRefs[4] as React.RefObject<HTMLButtonElement>).current?.focus(); // 借方タグボタンへ移動
                                      }
                                    }}
                                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
                                    placeholder="補助科目"
                                  />
                                  {suggestions &&
                                    suggestions.field === `${row.id}-debitSubAccount` &&
                                    suggestions.items.length > 0 &&
                                    suggestions.position && (
                                      <div 
                                        className="fixed bg-white border border-gray-300 rounded max-h-[150px] overflow-y-auto z-[1000] shadow-lg mt-1"
                                        style={{
                                          top: `${suggestions.position.top}px`,
                                          left: `${suggestions.position.left}px`,
                                          width: `${suggestions.position.width}px`,
                                        }}
                                      >
                                        {suggestions.items.map((item, index) => {
                                          const subAccount = item as SubAccountMaster;
                                          return (
                                            <div
                                              key={subAccount.code}
                                              onClick={() => {
                                                setRows((prev) =>
                                                  prev.map((r) =>
                                                    r.id === row.id
                                                      ? { ...r, debitSubAccount: subAccount.name }
                                                      : r
                                                  )
                                                );
                                                setSuggestions(null);
                                                rowRefs[4].current?.focus(); // 借方金額へ移動
                                              }}
                                              className={`p-2 cursor-pointer text-xs ${
                                                index === suggestions.selectedIndex
                                                  ? "bg-blue-50"
                                                  : "bg-white hover:bg-gray-50"
                                              }`}
                                            >
                                              {subAccount.code} - {subAccount.name}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                </div>
                              );
                            }
                            return null;
                          })()}
                          {/* タグ表示 */}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(row.debitTags || []).map((tag) => (
                              <span
                                key={tag.id}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                                  tag.color === "red"
                                    ? "bg-red-100 text-red-700"
                                    : tag.color === "green"
                                    ? "bg-green-100 text-green-700"
                                    : tag.color === "orange"
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {tag.type === "vendor" ? "取" : tag.type === "item" ? "品" : tag.type === "department" ? "部" : tag.type === "memo" ? "メモ" : "セグ"}:
                                {tag.label}
                                <button
                                  onClick={() => {
                                    setRows((prev) =>
                                      prev.map((r) =>
                                        r.id === row.id
                                          ? {
                                              ...r,
                                              debitTags: r.debitTags.filter((t) => t.id !== tag.id),
                                            }
                                          : r
                                      )
                                    );
                                  }}
                                  className="hover:font-bold hover:text-red-600 transition-colors focus:outline-none"
                                  title="タグを削除"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                            <div className="relative tag-selector-container">
                              <button
                                ref={(el) => {
                                  // FormNavigator用のrefを設定
                                  const tagButtonRef = rowRefs[4] as React.MutableRefObject<HTMLButtonElement | null>;
                                  if (tagButtonRef) {
                                    tagButtonRef.current = el;
                                  }
                                  // 位置計算用の処理
                                  if (el && tagSelector?.rowId === row.id && tagSelector?.field === "debitTags" && !tagSelector.position) {
                                    const position = calculatePosition(el);
                                    if (position) {
                                      setTagSelector((prev) => prev ? { ...prev, position } : null);
                                    }
                                  }
                                }}
                                className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                                data-form-navigator-skip="true"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const buttonElement = e.currentTarget;
                                  const position = calculatePosition(buttonElement);
                                  const isOpen = tagSelector?.rowId === row.id && tagSelector?.field === "debitTags";
                                  if (isOpen) {
                                    // タグ選択を閉じる
                                    setTagSelector(null);
                                    setSelectedTagIndex(0);
                                    // 次のフィールド（借方金額）にフォーカスを移動
                                    setTimeout(() => {
                                      rowRefs[5].current?.focus();
                                    }, 0);
                                  } else {
                                    // タグ選択を開く
                                    setSelectedTagIndex(0);
                                    setTagSelector({ rowId: row.id, field: "debitTags", position });
                                  }
                                }}
                                onKeyDown={(e) => {
                                  // EnterキーまたはSpaceキーでタグ選択を開閉
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    e.stopPropagation(); // FormNavigatorの処理を防ぐ
                                    const buttonElement = e.currentTarget;
                                    const position = calculatePosition(buttonElement);
                                    const isOpen = tagSelector?.rowId === row.id && tagSelector?.field === "debitTags";
                                    if (isOpen) {
                                      // タグ選択を閉じる
                                      setTagSelector(null);
                                      setSelectedTagIndex(0);
                                      // 次のフィールド（借方金額）にフォーカスを移動
                                      setTimeout(() => {
                                        rowRefs[5].current?.focus();
                                      }, 0);
                                    } else {
                                      // タグ選択を開く
                                      setSelectedTagIndex(0);
                                      setTagSelector({ rowId: row.id, field: "debitTags", position });
                                    }
                                  }
                                }}
                              >
                                タグ ▼
                              </button>
                              {tagSelector?.rowId === row.id && tagSelector?.field === "debitTags" && tagSelector.position && (() => {
                                const tagOptions = [
                                  { type: "vendor" as const, label: "取引先", color: "red" as const },
                                  { type: "item" as const, label: "品目", color: "green" as const },
                                  { type: "department" as const, label: "部門", color: "orange" as const },
                                  { type: "memo" as const, label: "メモタグ", color: "blue" as const },
                                  { type: "segment" as const, label: "セグメント", color: "blue" as const },
                                ];
                                
                                const handleTagSelect = (tagOption: typeof tagOptions[0]) => {
                                  if (!tagSelector) return;
                                  const currentRowId = tagSelector.rowId;
                                  // promptの前にタグボタンと借方金額の参照を保存
                                  const tagButtonRef = rowRefs[4].current;
                                  const debitAmountRef = rowRefs[5].current;
                                  // promptの前にタグ選択を閉じる
                                  setTagSelector(null);
                                  setSelectedTagIndex(0);
                                  
                                  const label = prompt(`${tagOption.label}の名前を入力してください:`, "");
                                  if (label && label.trim()) {
                                    const newTag: Tag = {
                                      id: `tag-${Date.now()}`,
                                      type: tagOption.type,
                                      label: label.trim(),
                                      color: tagOption.color,
                                    };
                                    setRows((prev) => {
                                      const updated = prev.map((r) =>
                                        r.id === currentRowId
                                          ? { ...r, debitTags: [...(r.debitTags || []), newTag] }
                                          : r
                                      );
                                      return updated;
                                    });
                                  }
                                  
                                  // promptが閉じられた後、タグボタンにフォーカスを戻す
                                  // その後、Tabキーで借方金額フィールドに移動できるようにする
                                  // ブラウザがpromptのフォーカスを処理するのを待つため、複数回試行
                                  requestAnimationFrame(() => {
                                    setTimeout(() => {
                                      if (tagButtonRef) {
                                        tagButtonRef.focus();
                                        // フォーカスが確実に設定されるように、もう一度試行
                                        requestAnimationFrame(() => {
                                          setTimeout(() => {
                                            if (tagButtonRef && document.activeElement !== tagButtonRef) {
                                              tagButtonRef.focus();
                                            }
                                            // タグボタンにフォーカスが設定された後、FormNavigatorが正しく動作することを確認
                                            // allInputRefsの順序により、タグボタン（rowRefs[4]）の次が借方金額（rowRefs[5]）になっている
                                            // 補助科目が表示されていない場合でも、タグボタンの次が借方金額になるように設定済み
                                            // ユーザーがTabキーを押すと、FormNavigatorが自動的に借方金額フィールドに移動する
                                          }, 50);
                                        });
                                      } else if (debitAmountRef) {
                                        // タグボタンが存在しない場合（削除された場合など）、直接借方金額にフォーカス
                                        debitAmountRef.focus();
                                      }
                                    }, 100);
                                  });
                                };

                                return (
                                  <div 
                                    data-tag-dropdown
                                    className="fixed bg-white border border-gray-300 rounded-md shadow-xl z-[9999] min-w-[200px] mt-1"
                                    style={{
                                      top: `${tagSelector.position.top}px`,
                                      left: `${tagSelector.position.left}px`,
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "ArrowDown") {
                                        e.preventDefault();
                                        setSelectedTagIndex((prev) => Math.min(prev + 1, tagOptions.length - 1));
                                      } else if (e.key === "ArrowUp") {
                                        e.preventDefault();
                                        setSelectedTagIndex((prev) => Math.max(prev - 1, 0));
                                      } else if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                                        e.preventDefault();
                                        const selectedTag = tagOptions[selectedTagIndex];
                                        if (selectedTag) {
                                          handleTagSelect(selectedTag);
                                        }
                                      } else if (e.key === "Escape") {
                                        e.preventDefault();
                                        setTagSelector(null);
                                        setSelectedTagIndex(0);
                                        // 次のフィールド（借方金額）にフォーカスを移動
                                        setTimeout(() => {
                                          rowRefs[5].current?.focus();
                                        }, 0);
                                      }
                                    }}
                                    tabIndex={-1}
                                  >
                                    <div className="p-2 border-b border-gray-200 text-xs font-semibold text-gray-700">
                                      タグを選択
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto">
                                      {tagOptions.map((tagOption, index) => (
                                        <button
                                          key={tagOption.type}
                                          className={`w-full px-3 py-2 text-left text-sm transition-colors border-b border-gray-100 last:border-b-0 ${
                                            index === selectedTagIndex
                                              ? "bg-blue-50 hover:bg-blue-100"
                                              : "hover:bg-gray-50"
                                          }`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleTagSelect(tagOption);
                                          }}
                                        >
                                          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                                            tagOption.color === "red" ? "bg-red-500" :
                                            tagOption.color === "green" ? "bg-green-500" :
                                            tagOption.color === "orange" ? "bg-orange-500" :
                                            "bg-blue-500"
                                          }`}></span>
                                          {tagOption.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* 借方金額 */}
                      <td className="p-2 border-r border-gray-300 overflow-hidden align-top">
                        <div className="flex flex-col gap-1">
                          <input
                            ref={rowRefs[5] as React.RefObject<HTMLInputElement>}
                            type="text"
                            value={
                              row.debitAmount > 0
                                ? formatAmount(row.debitAmount)
                                : ""
                            }
                            onChange={(e) => {
                              const amount = parseAmount(e.target.value);
                              setRows((prev) =>
                                prev.map((r) =>
                                  r.id === row.id ? { ...r, debitAmount: amount } : r
                                )
                              );
                            }}
                            className={`w-full px-2 py-1.5 border border-gray-300 rounded-md text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow ${
                              row.debitAmount < 0 ? "text-red-500" : ""
                            }`}
                          />
                          <select
                            ref={rowRefs[6] as React.RefObject<HTMLSelectElement>}
                            value={row.debitTaxType}
                            onChange={(e) =>
                              setRows((prev) =>
                                prev.map((r) =>
                                  r.id === row.id
                                    ? { ...r, debitTaxType: e.target.value }
                                    : r
                                )
                              )
                            }
                            className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
                          >
                            {TAX_TYPES.map((tax) => (
                              <option key={tax.value} value={tax.value}>
                                {tax.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      {/* 貸方科目 */}
                      <td className="p-2 border-r border-gray-300 relative overflow-visible align-top min-w-[200px]">
                        <div className="flex flex-col gap-1">
                          <div className="relative">
                            <select
                              ref={rowRefs[7] as React.RefObject<HTMLSelectElement>}
                              value={row.creditAccount}
                              onChange={(e) => {
                                const selectedAccount = ACCOUNT_MASTERS.find((a) => a.name === e.target.value);
                                setRows((prev) =>
                                  prev.map((r) =>
                                    r.id === row.id
                                      ? {
                                          ...r,
                                          creditAccount: e.target.value,
                                          creditTaxType: selectedAccount?.defaultTaxType || "none",
                                          creditSubAccount: "", // 科目変更時に補助科目をクリア
                                        }
                                      : r
                                  )
                                );
                              }}
                              onKeyDown={(e) => {
                                // Spaceキーでセレクトボックスを開閉（デフォルトの動作を許可）
                                if (e.key === " ") {
                                  // Spaceキーはデフォルトの動作（セレクトボックスを開く）を許可
                                  return;
                                }
                                // Enterキーで選択確定後に次のフィールドへ移動
                                if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                                  // 値が選択されている場合のみ次のフィールドへ移動
                                  if (row.creditAccount) {
                                    e.preventDefault();
                                    e.stopPropagation(); // FormNavigatorの処理を防ぐ
                                    // 補助科目がある場合は補助科目へ、なければタグボタンへ
                                    const selectedAccount = ACCOUNT_MASTERS.find((a) => a.name === row.creditAccount);
                                    setTimeout(() => {
                                      if (selectedAccount && selectedAccount.subAccounts && selectedAccount.subAccounts.length > 0) {
                                        // 補助科目の入力フィールドが存在するか確認
                                        const subAccountInput = rowRefs[8].current;
                                        if (subAccountInput) {
                                          subAccountInput.focus(); // 補助科目へ
                                        } else {
                                          // 補助科目がまだDOMに存在しない場合はタグボタンへ
                                          (rowRefs[9] as React.RefObject<HTMLButtonElement>).current?.focus(); // 貸方タグボタンへ
                                        }
                                      } else {
                                        (rowRefs[9] as React.RefObject<HTMLButtonElement>).current?.focus(); // 貸方タグボタンへ
                                      }
                                    }, 10); // 少し長めのタイムアウトで確実にDOM更新を待つ
                                  }
                                  // 値が選択されていない場合はデフォルトの動作（セレクトボックスを開く）を許可
                                }
                              }}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow appearance-none pr-8"
                            >
                              <option value="">選択してください</option>
                              {ACCOUNT_MASTERS.map((account) => (
                                <option key={account.code} value={account.name}>
                                  {account.code} - {account.name}
                                </option>
                              ))}
                            </select>
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">▼</span>
                          </div>
                          {/* 補助科目入力 */}
                          {(() => {
                            const selectedAccount = ACCOUNT_MASTERS.find((a) => a.name === row.creditAccount);
                            if (selectedAccount && selectedAccount.subAccounts && selectedAccount.subAccounts.length > 0) {
                              return (
                                <div className="relative mt-1">
                                  <input
                                    ref={rowRefs[8] as React.RefObject<HTMLInputElement>}
                                    type="text"
                                    value={row.creditSubAccount}
                                    data-form-navigator-skip="true"
                                    onFocus={(e) => {
                                      // フォーカス時に位置を計算（サジェスト表示用）
                                      if (suggestions?.field === `${row.id}-creditSubAccount` && !suggestions.position) {
                                        const position = calculatePosition(e.target);
                                        if (position) {
                                          setSuggestions((prev) => prev ? { ...prev, position } : null);
                                        }
                                      }
                                    }}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setRows((prev) =>
                                        prev.map((r) =>
                                          r.id === row.id ? { ...r, creditSubAccount: value } : r
                                        )
                                      );
                                      if (value) {
                                        const subAccounts = searchSubAccount(selectedAccount.code, value);
                                        const inputElement = e.target as HTMLInputElement;
                                        const position = calculatePosition(inputElement);
                                        setSuggestions({
                                          type: "subAccount",
                                          field: `${row.id}-creditSubAccount`,
                                          items: subAccounts,
                                          selectedIndex: 0,
                                          position,
                                        });
                                      } else {
                                        setSuggestions(null);
                                      }
                                    }}
                                    onBlur={() => setTimeout(() => setSuggestions(null), 200)}
                                    onKeyDown={(e) => {
                                      if (suggestions && suggestions.field === `${row.id}-creditSubAccount`) {
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
                                          e.stopPropagation(); // FormNavigatorの処理を防ぐ
                                          const selected = suggestions.items[suggestions.selectedIndex] as SubAccountMaster;
                                          if (selected) {
                                            setRows((prev) =>
                                              prev.map((r) =>
                                                r.id === row.id
                                                  ? { ...r, creditSubAccount: selected.name }
                                                  : r
                                              )
                                            );
                                            setSuggestions(null);
                                            (rowRefs[9] as React.RefObject<HTMLButtonElement>).current?.focus(); // 貸方タグボタンへ移動
                                          }
                                        }
                                      } else if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                                        // サジェストが表示されていない場合もEnterキーで次のフィールドへ移動
                                        e.preventDefault();
                                        e.stopPropagation(); // FormNavigatorの処理を防ぐ
                                        (rowRefs[9] as React.RefObject<HTMLButtonElement>).current?.focus(); // 貸方タグボタンへ移動
                                      }
                                    }}
                                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
                                    placeholder="補助科目"
                                  />
                                  {suggestions &&
                                    suggestions.field === `${row.id}-creditSubAccount` &&
                                    suggestions.items.length > 0 &&
                                    suggestions.position && (
                                      <div 
                                        className="fixed bg-white border border-gray-300 rounded max-h-[150px] overflow-y-auto z-[1000] shadow-lg mt-1"
                                        style={{
                                          top: `${suggestions.position.top}px`,
                                          left: `${suggestions.position.left}px`,
                                          width: `${suggestions.position.width}px`,
                                        }}
                                      >
                                        {suggestions.items.map((item, index) => {
                                          const subAccount = item as SubAccountMaster;
                                          return (
                                            <div
                                              key={subAccount.code}
                                              onClick={() => {
                                                setRows((prev) =>
                                                  prev.map((r) =>
                                                    r.id === row.id
                                                      ? { ...r, creditSubAccount: subAccount.name }
                                                      : r
                                                  )
                                                );
                                                setSuggestions(null);
                                                (rowRefs[9] as React.RefObject<HTMLButtonElement>).current?.focus(); // 貸方タグボタンへ移動
                                              }}
                                              className={`p-2 cursor-pointer text-xs ${
                                                index === suggestions.selectedIndex
                                                  ? "bg-blue-50"
                                                  : "bg-white hover:bg-gray-50"
                                              }`}
                                            >
                                              {subAccount.code} - {subAccount.name}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                </div>
                              );
                            }
                            return null;
                          })()}
                          {/* タグ表示 */}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(row.creditTags || []).map((tag) => (
                              <span
                                key={tag.id}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                                  tag.color === "red"
                                    ? "bg-red-100 text-red-700"
                                    : tag.color === "green"
                                    ? "bg-green-100 text-green-700"
                                    : tag.color === "orange"
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {tag.type === "vendor" ? "取" : tag.type === "item" ? "品" : tag.type === "department" ? "部" : tag.type === "memo" ? "メモ" : "セグ"}:
                                {tag.label}
                                <button
                                  onClick={() => {
                                    setRows((prev) =>
                                      prev.map((r) =>
                                        r.id === row.id
                                          ? {
                                              ...r,
                                              creditTags: r.creditTags.filter((t) => t.id !== tag.id),
                                            }
                                          : r
                                      )
                                    );
                                  }}
                                  className="hover:font-bold hover:text-red-600 transition-colors focus:outline-none"
                                  title="タグを削除"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                            <div className="relative tag-selector-container">
                              <button
                                ref={(el) => {
                                  // FormNavigator用のrefを設定
                                  const tagButtonRef = rowRefs[9] as React.MutableRefObject<HTMLButtonElement | null>;
                                  if (tagButtonRef) {
                                    tagButtonRef.current = el;
                                  }
                                  // 位置計算用の処理
                                  if (el && tagSelector?.rowId === row.id && tagSelector?.field === "creditTags" && !tagSelector.position) {
                                    const position = calculatePosition(el);
                                    if (position) {
                                      setTagSelector((prev) => prev ? { ...prev, position } : null);
                                    }
                                  }
                                }}
                                className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                                data-form-navigator-skip="true"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const buttonElement = e.currentTarget;
                                  const position = calculatePosition(buttonElement);
                                  const isOpen = tagSelector?.rowId === row.id && tagSelector?.field === "creditTags";
                                  if (isOpen) {
                                    // タグ選択を閉じる
                                    setTagSelector(null);
                                    setSelectedTagIndex(0);
                                    // 次のフィールド（貸方金額）にフォーカスを移動
                                    setTimeout(() => {
                                      rowRefs[10].current?.focus();
                                    }, 0);
                                  } else {
                                    // タグ選択を開く
                                    setSelectedTagIndex(0);
                                    setTagSelector({ rowId: row.id, field: "creditTags", position });
                                  }
                                }}
                                onKeyDown={(e) => {
                                  // EnterキーまたはSpaceキーでタグ選択を開閉
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    e.stopPropagation(); // FormNavigatorの処理を防ぐ
                                    const buttonElement = e.currentTarget;
                                    const position = calculatePosition(buttonElement);
                                    const isOpen = tagSelector?.rowId === row.id && tagSelector?.field === "creditTags";
                                    if (isOpen) {
                                      // タグ選択を閉じる
                                      setTagSelector(null);
                                      setSelectedTagIndex(0);
                                      // 次のフィールド（貸方金額）にフォーカスを移動
                                      setTimeout(() => {
                                        rowRefs[10].current?.focus();
                                      }, 0);
                                    } else {
                                      // タグ選択を開く
                                      setSelectedTagIndex(0);
                                      setTagSelector({ rowId: row.id, field: "creditTags", position });
                                    }
                                  }
                                }}
                              >
                                タグ ▼
                              </button>
                              {tagSelector?.rowId === row.id && tagSelector?.field === "creditTags" && tagSelector.position && (() => {
                                const tagOptions = [
                                  { type: "vendor" as const, label: "取引先", color: "red" as const },
                                  { type: "item" as const, label: "品目", color: "green" as const },
                                  { type: "department" as const, label: "部門", color: "orange" as const },
                                  { type: "memo" as const, label: "メモタグ", color: "blue" as const },
                                  { type: "segment" as const, label: "セグメント", color: "blue" as const },
                                ];
                                
                                const handleTagSelect = (tagOption: typeof tagOptions[0]) => {
                                  if (!tagSelector) return;
                                  const currentRowId = tagSelector.rowId;
                                  // promptの前にタグボタンと貸方金額の参照を保存
                                  const tagButtonRef = rowRefs[9].current;
                                  const creditAmountRef = rowRefs[10].current;
                                  // promptの前にタグ選択を閉じる
                                  setTagSelector(null);
                                  setSelectedTagIndex(0);
                                  
                                  const label = prompt(`${tagOption.label}の名前を入力してください:`, "");
                                  if (label && label.trim()) {
                                    const newTag: Tag = {
                                      id: `tag-${Date.now()}`,
                                      type: tagOption.type,
                                      label: label.trim(),
                                      color: tagOption.color,
                                    };
                                    setRows((prev) => {
                                      const updated = prev.map((r) =>
                                        r.id === currentRowId
                                          ? { ...r, creditTags: [...(r.creditTags || []), newTag] }
                                          : r
                                      );
                                      return updated;
                                    });
                                  }
                                  
                                  // promptが閉じられた後、タグボタンにフォーカスを戻す
                                  // その後、Tabキーで貸方金額フィールドに移動できるようにする
                                  // ブラウザがpromptのフォーカスを処理するのを待つため、複数回試行
                                  requestAnimationFrame(() => {
                                    setTimeout(() => {
                                      if (tagButtonRef) {
                                        tagButtonRef.focus();
                                        // フォーカスが確実に設定されるように、もう一度試行
                                        requestAnimationFrame(() => {
                                          setTimeout(() => {
                                            if (tagButtonRef && document.activeElement !== tagButtonRef) {
                                              tagButtonRef.focus();
                                            }
                                            // タグボタンにフォーカスが設定された後、FormNavigatorが正しく動作することを確認
                                            // allInputRefsの順序により、タグボタン（rowRefs[9]）の次が貸方金額（rowRefs[10]）になっている
                                            // 補助科目が表示されていない場合でも、タグボタンの次が貸方金額になるように設定済み
                                            // ユーザーがTabキーを押すと、FormNavigatorが自動的に貸方金額フィールドに移動する
                                          }, 50);
                                        });
                                      } else if (creditAmountRef) {
                                        // タグボタンが存在しない場合（削除された場合など）、直接貸方金額にフォーカス
                                        creditAmountRef.focus();
                                      }
                                    }, 100);
                                  });
                                };

                                return (
                                  <div 
                                    data-tag-dropdown
                                    className="fixed bg-white border border-gray-300 rounded-md shadow-xl z-[9999] min-w-[200px] mt-1"
                                    style={{
                                      top: `${tagSelector.position.top}px`,
                                      left: `${tagSelector.position.left}px`,
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "ArrowDown") {
                                        e.preventDefault();
                                        setSelectedTagIndex((prev) => Math.min(prev + 1, tagOptions.length - 1));
                                      } else if (e.key === "ArrowUp") {
                                        e.preventDefault();
                                        setSelectedTagIndex((prev) => Math.max(prev - 1, 0));
                                      } else if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                                        e.preventDefault();
                                        const selectedTag = tagOptions[selectedTagIndex];
                                        if (selectedTag) {
                                          handleTagSelect(selectedTag);
                                        }
                                      } else if (e.key === "Escape") {
                                        e.preventDefault();
                                        setTagSelector(null);
                                        setSelectedTagIndex(0);
                                        // 次のフィールド（貸方金額）にフォーカスを移動
                                        setTimeout(() => {
                                          rowRefs[10].current?.focus();
                                        }, 0);
                                      }
                                    }}
                                    tabIndex={-1}
                                  >
                                    <div className="p-2 border-b border-gray-200 text-xs font-semibold text-gray-700">
                                      タグを選択
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto">
                                      {tagOptions.map((tagOption, index) => (
                                        <button
                                          key={tagOption.type}
                                          className={`w-full px-3 py-2 text-left text-sm transition-colors border-b border-gray-100 last:border-b-0 ${
                                            index === selectedTagIndex
                                              ? "bg-blue-50 hover:bg-blue-100"
                                              : "hover:bg-gray-50"
                                          }`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleTagSelect(tagOption);
                                          }}
                                        >
                                          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                                            tagOption.color === "red" ? "bg-red-500" :
                                            tagOption.color === "green" ? "bg-green-500" :
                                            tagOption.color === "orange" ? "bg-orange-500" :
                                            "bg-blue-500"
                                          }`}></span>
                                          {tagOption.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* 貸方金額 */}
                      <td className="p-2 border-r border-gray-300 overflow-hidden align-top">
                        <div className="flex flex-col gap-1">
                          <input
                            ref={rowRefs[10] as React.RefObject<HTMLInputElement>}
                            type="text"
                            value={
                              row.creditAmount > 0
                                ? formatAmount(row.creditAmount)
                                : ""
                            }
                            onChange={(e) => {
                              const amount = parseAmount(e.target.value);
                              setRows((prev) =>
                                prev.map((r) =>
                                  r.id === row.id ? { ...r, creditAmount: amount } : r
                                )
                              );
                            }}
                            className={`w-full px-2 py-1.5 border border-gray-300 rounded-md text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow ${
                              row.creditAmount < 0 ? "text-red-500" : ""
                            }`}
                          />
                          <select
                            ref={rowRefs[11] as React.RefObject<HTMLSelectElement>}
                            value={row.creditTaxType}
                            onChange={(e) =>
                              setRows((prev) =>
                                prev.map((r) =>
                                  r.id === row.id
                                    ? { ...r, creditTaxType: e.target.value }
                                    : r
                                )
                              )
                            }
                            className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
                          >
                            {TAX_TYPES.map((tax) => (
                              <option key={tax.value} value={tax.value}>
                                {tax.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      {/* 摘要 */}
                      <td className="p-2 border-r border-gray-300 overflow-hidden align-top">
                        <input
                          ref={rowRefs[12] as React.RefObject<HTMLInputElement>}
                          type="text"
                          value={row.remarks}
                          onChange={(e) =>
                            setRows((prev) =>
                              prev.map((r) =>
                                r.id === row.id ? { ...r, remarks: e.target.value } : r
                              )
                            )
                          }
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow"
                          placeholder="摘要"
                        />
                      </td>
                      {/* 適格請求書等 */}
                      <td className="p-2 border-r border-gray-300 overflow-hidden align-top">
                        <label className="flex items-center cursor-pointer">
                          <input
                            ref={rowRefs[13] as React.RefObject<HTMLInputElement>}
                            type="checkbox"
                            checked={row.eligibleInvoice}
                            onChange={(e) =>
                              setRows((prev) =>
                                prev.map((r) =>
                                  r.id === row.id
                                    ? { ...r, eligibleInvoice: e.target.checked }
                                    : r
                                )
                              )
                            }
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          <span className="ml-2 text-sm text-gray-700">適格</span>
                        </label>
                      </td>
                      {/* 電子証憑 */}
                      <td className="p-2 overflow-hidden align-top">
                        {row.evidence ? (
                          <div className="text-sm text-blue-600 hover:underline cursor-pointer">
                            {row.evidence}
                          </div>
                        ) : (
                          <>
                            <input
                              ref={getFileInputRef(row.id)}
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setRows((prev) =>
                                    prev.map((r) =>
                                      r.id === row.id ? { ...r, evidence: file.name } : r
                                    )
                                  );
                                  // ファイル選択後、次の行に移動（または行追加）
                                  setTimeout(() => {
                                    const isLastRow = rowIndex === rows.length - 1;
                                    if (isLastRow) {
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
                                  }, 100);
                                }
                                // 同じファイルを再度選択できるようにリセット
                                e.target.value = "";
                              }}
                            />
                            <button
                              ref={rowRefs[14] as React.RefObject<HTMLButtonElement>}
                              onClick={() => {
                                // クリック時もファイル選択を開く
                                getFileInputRef(row.id).current?.click();
                              }}
                              onKeyDown={(e) => {
                                if (e.key === " " && !(e.nativeEvent as KeyboardEvent).isComposing) {
                                  // スペースキーでファイル選択を開く
                                  e.preventDefault();
                                  getFileInputRef(row.id).current?.click();
                                } else if (e.key === "Enter" && !(e.nativeEvent as KeyboardEvent).isComposing) {
                                  // ファイルが選択されている場合はEnterキーで次の行に移動（または行追加）
                                  if (row.evidence) {
                                    e.preventDefault();
                                    const isLastRow = rowIndex === rows.length - 1;
                                    if (isLastRow) {
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
                                }
                              }}
                              className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md border border-blue-200 hover:border-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              ファイルを添付
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* 合計行 */}
              <tfoot>
                <tr className="bg-gray-100 border-t-2 border-gray-400 font-semibold">
                  <td colSpan={3} className="p-3 border-r border-gray-300 text-right text-gray-700">
                    合計
                  </td>
                  <td className="p-3 border-r border-gray-300 text-right text-gray-800">
                    {formatAmount(totalDebit)}
                  </td>
                  <td className="p-3 border-r border-gray-300"></td>
                  <td className="p-3 border-r border-gray-300 text-right text-gray-800">
                    {formatAmount(totalCredit)}
                  </td>
                  <td colSpan={3} className="p-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>

      {/* フッター部 */}
      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg mb-4 border border-gray-200 shadow-sm">
        <div className="flex gap-8">
          <div className="font-semibold">
            借方合計: {formatAmount(totalDebit)}
          </div>
          <div className="font-semibold">
            貸方合計: {formatAmount(totalCredit)}
          </div>
          <div
            className={`font-bold ${
              balance !== 0 ? "text-red-500" : "text-green-500"
            }`}
          >
            貸借差額: {formatAmount(Math.abs(balance))}
            {balance !== 0 && " ⚠️"}
          </div>
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
    </div>
  );
};

