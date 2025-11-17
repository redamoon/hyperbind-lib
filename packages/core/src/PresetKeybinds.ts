/**
 * プリセットキーバインド定義
 * React以外の環境でも利用可能な静的データ構造
 */

export interface PresetKeybind {
  id: string;
  keyCombo: string;
  label: string;
  category: 'ledger' | 'invoice' | 'report' | 'general' | 'common' | 'print-export' | 'search' | 'account-department' | 'journal-entry' | 'journal-ledger' | 'voucher-entry' | 'summary-table' | 'financial-statement' | 'account-breakdown' | 'consumption-tax' | 'transaction-schedule' | 'other';
  description: string;
  preventDefault: boolean;
}

/**
 * 台帳（Ledger）用のキーバインド
 */
export const LEDGER_KEYBINDS: PresetKeybind[] = [
  {
    id: 'ledger-new',
    keyCombo: 'f2',
    label: '新規作成',
    category: 'ledger',
    description: '台帳に表示されている内容をクリアし、新規に台帳を登録できるようにします。',
    preventDefault: true,
  },
  {
    id: 'ledger-reference',
    keyCombo: 'f8',
    label: '参照',
    category: 'ledger',
    description: '参照画面が表示されます。カーソルがある項目に応じて、他の台帳を参照して入力することができます。',
    preventDefault: true,
  },
  {
    id: 'ledger-reference-space',
    keyCombo: 'space',
    label: '参照（スペース）',
    category: 'ledger',
    description: '参照画面が表示されます（F8と同じ機能）。',
    preventDefault: true,
  },
  {
    id: 'ledger-delete',
    keyCombo: 'f9',
    label: '削除',
    category: 'ledger',
    description: '表示中の台帳を削除します。リストでは、選択中の台帳を削除します。',
    preventDefault: true,
  },
  {
    id: 'ledger-register',
    keyCombo: 'f12',
    label: '登録',
    category: 'ledger',
    description: '新規作成/修正した台帳を登録します。',
    preventDefault: true,
  },
];

/**
 * 伝票（Invoice）用のキーバインド
 */
export const INVOICE_KEYBINDS: PresetKeybind[] = [
  {
    id: 'invoice-new',
    keyCombo: 'f2',
    label: '新規作成',
    category: 'invoice',
    description: '伝票に表示されている内容をクリアし、新規に伝票を登録できるようにします。',
    preventDefault: true,
  },
  {
    id: 'invoice-pdf',
    keyCombo: 'f6',
    label: 'PDF送信',
    category: 'invoice',
    description: '得意先台帳（仕入先台帳）で設定した［出力方法］によって、帳票を取引先にPDF送信します。',
    preventDefault: true,
  },
  {
    id: 'invoice-reference',
    keyCombo: 'f8',
    label: '参照',
    category: 'invoice',
    description: '参照画面が表示されます。伝票の日付または伝票番号で参照すると、登録済みの伝票を呼び出して修正や削除を行うことができます。',
    preventDefault: true,
  },
  {
    id: 'invoice-reference-space',
    keyCombo: 'space',
    label: '参照（スペース）',
    category: 'invoice',
    description: '参照画面が表示されます（F8と同じ機能）。',
    preventDefault: true,
  },
  {
    id: 'invoice-delete',
    keyCombo: 'f9',
    label: '削除',
    category: 'invoice',
    description: '表示中の伝票を削除します。',
    preventDefault: true,
  },
  {
    id: 'invoice-register',
    keyCombo: 'f12',
    label: '登録',
    category: 'invoice',
    description: '新規作成/修正した伝票を登録します。',
    preventDefault: true,
  },
  {
    id: 'invoice-search',
    keyCombo: 'ctrl+f',
    label: '検索',
    category: 'invoice',
    description: '検索画面が表示されます。検索条件を指定して伝票を検索することができます。',
    preventDefault: true,
  },
  {
    id: 'invoice-insert-row',
    keyCombo: 'ctrl+insert',
    label: '行挿入',
    category: 'invoice',
    description: '選択した行の前に新しい行が挿入されます。',
    preventDefault: true,
  },
  {
    id: 'invoice-delete-row',
    keyCombo: 'ctrl+delete',
    label: '行削除',
    category: 'invoice',
    description: '選択した行を削除します。',
    preventDefault: true,
  },
];

/**
 * 売上・仕入・在庫（伝票以外）用のキーバインド
 */
export const BUSINESS_KEYBINDS: PresetKeybind[] = [
  {
    id: 'business-new',
    keyCombo: 'f2',
    label: '新規入力',
    category: 'report',
    description: '明細部に表示されている内容をクリアし、他の条件で集計できるようにします。',
    preventDefault: true,
  },
  {
    id: 'business-pdf',
    keyCombo: 'f6',
    label: 'PDF送信（送信）',
    category: 'report',
    description: '得意先台帳（仕入先台帳）で設定した［出力方法］によって、請求書や支払書を取引先にPDF送信します。',
    preventDefault: true,
  },
  {
    id: 'business-digital-invoice',
    keyCombo: 'f7',
    label: 'デジタルインボイス送信',
    category: 'report',
    description: 'デジタルインボイス送信を行います。',
    preventDefault: true,
  },
  {
    id: 'business-reference',
    keyCombo: 'f8',
    label: '参照',
    category: 'report',
    description: '参照画面が表示されます。カーソルがある項目に応じて、台帳を参照して入力することができます。',
    preventDefault: true,
  },
  {
    id: 'business-delete-row',
    keyCombo: 'ctrl+delete',
    label: '行削除',
    category: 'report',
    description: '選択した行を削除します。',
    preventDefault: true,
  },
];

/**
 * レポート用のキーバインド
 */
export const REPORT_KEYBINDS: PresetKeybind[] = [
  {
    id: 'report-new',
    keyCombo: 'f2',
    label: '新規入力',
    category: 'report',
    description: '明細部に表示されている内容をクリアし、他の条件で集計できるようにします。',
    preventDefault: true,
  },
];

/**
 * 全般用のキーバインド
 */
export const GENERAL_KEYBINDS: PresetKeybind[] = [
  {
    id: 'general-help',
    keyCombo: 'f1',
    label: 'ヘルプ',
    category: 'general',
    description: '現在、表示している画面に関する製品サポートページが表示されます。',
    preventDefault: true,
  },
  {
    id: 'general-print',
    keyCombo: 'ctrl+p',
    label: '印刷',
    category: 'general',
    description: '印刷画面が表示されます。印刷を実行することができます。',
    preventDefault: false,
  },
  {
    id: 'general-navigate-back',
    keyCombo: 'alt+arrowleft',
    label: '画面の切り替え（戻る）',
    category: 'general',
    description: '複数の画面を開いている場合に、作業する画面を切り替えます。',
    preventDefault: true,
  },
  {
    id: 'general-navigate-forward',
    keyCombo: 'alt+arrowright',
    label: '画面の切り替え（進む）',
    category: 'general',
    description: '複数の画面を開いている場合に、作業する画面を切り替えます。',
    preventDefault: true,
  },
];

/**
 * 共通操作用のキーバインド
 */
export const COMMON_KEYBINDS: PresetKeybind[] = [
  {
    id: 'common-help',
    keyCombo: 'f1',
    label: 'ヘルプ',
    category: 'common',
    description: '現在のウィンドウのサポートページを表示',
    preventDefault: true,
  },
  {
    id: 'common-palette',
    keyCombo: 'f2',
    label: 'パレットを表示',
    category: 'common',
    description: 'パレットを表示',
    preventDefault: true,
  },
  {
    id: 'common-reference',
    keyCombo: 'f4',
    label: '項目の参照',
    category: 'common',
    description: 'ドロップダウン・カレンダー・電卓の表示',
    preventDefault: true,
  },
  {
    id: 'common-account-navigation',
    keyCombo: 'f6',
    label: '勘定科目欄と補助科目欄のカーソル移動',
    category: 'common',
    description: '勘定科目欄と補助科目欄のカーソル移動',
    preventDefault: true,
  },
  {
    id: 'common-print-f11',
    keyCombo: 'f11',
    label: '印刷',
    category: 'common',
    description: '印刷',
    preventDefault: true,
  },
  {
    id: 'common-print-ctrlp',
    keyCombo: 'ctrl+p',
    label: '印刷',
    category: 'common',
    description: '印刷',
    preventDefault: false,
  },
  {
    id: 'common-window-back',
    keyCombo: 'alt+arrowleft',
    label: '開いているウィンドウを切り替え（戻る）',
    category: 'common',
    description: '開いているウィンドウを切り替え',
    preventDefault: true,
  },
  {
    id: 'common-window-forward',
    keyCombo: 'alt+arrowright',
    label: '開いているウィンドウを切り替え（進む）',
    category: 'common',
    description: '開いているウィンドウを切り替え',
    preventDefault: true,
  },
  {
    id: 'common-navigation-bar',
    keyCombo: 'alt+f1',
    label: 'ナビゲーションバーの表示',
    category: 'common',
    description: 'ナビゲーションバーの表示',
    preventDefault: true,
  },
];

/**
 * 印刷・エクスポート関連のキーバインド
 */
export const PRINT_EXPORT_KEYBINDS: PresetKeybind[] = [
  {
    id: 'print-export-select-all',
    keyCombo: 'ctrl+a',
    label: 'すべて選択',
    category: 'print-export',
    description: 'すべて選択（科目や部門のドロップダウン選択時）',
    preventDefault: true,
  },
  {
    id: 'print-export-invert-selection',
    keyCombo: 'ctrl+r',
    label: '選択状態の反転',
    category: 'print-export',
    description: '選択状態の反転（科目や部門のドロップダウン選択時）',
    preventDefault: true,
  },
  {
    id: 'print-export-deselect-all',
    keyCombo: 'ctrl+d',
    label: 'すべて解除',
    category: 'print-export',
    description: 'すべて解除（科目や部門のドロップダウン選択時）',
    preventDefault: true,
  },
];

/**
 * 検索用のキーバインド
 */
export const SEARCH_KEYBINDS: PresetKeybind[] = [
  {
    id: 'search-show',
    keyCombo: 'f3',
    label: '検索画面を表示',
    category: 'search',
    description: '検索画面を表示',
    preventDefault: true,
  },
  {
    id: 'search-clear',
    keyCombo: 'shift+f3',
    label: '検索解除',
    category: 'search',
    description: '検索解除',
    preventDefault: true,
  },
];

/**
 * （科目・部門）作成／編集／削除用のキーバインド
 */
export const ACCOUNT_DEPARTMENT_KEYBINDS: PresetKeybind[] = [
  {
    id: 'account-department-edit',
    keyCombo: 'f7',
    label: '編集',
    category: 'account-department',
    description: '編集（勘定科目・部門項目）',
    preventDefault: true,
  },
  {
    id: 'account-department-new',
    keyCombo: 'f8',
    label: '新規作成',
    category: 'account-department',
    description: '新規作成（勘定科目・部門項目）',
    preventDefault: true,
  },
  {
    id: 'account-department-delete',
    keyCombo: 'f9',
    label: '削除',
    category: 'account-department',
    description: '削除（勘定科目・部門項目）',
    preventDefault: true,
  },
  {
    id: 'account-department-sub-new',
    keyCombo: 'shift+f8',
    label: '補助科目新規作成',
    category: 'account-department',
    description: '補助科目新規作成',
    preventDefault: true,
  },
  {
    id: 'account-department-sub-copy',
    keyCombo: 'ctrl+h',
    label: '補助科目コピー',
    category: 'account-department',
    description: '補助科目コピー',
    preventDefault: true,
  },
  {
    id: 'account-department-sub-paste',
    keyCombo: 'ctrl+y',
    label: '補助科目貼り付け',
    category: 'account-department',
    description: '補助科目貼り付け',
    preventDefault: true,
  },
  {
    id: 'account-department-duplicate',
    keyCombo: 'shift+f12',
    label: '複写',
    category: 'account-department',
    description: '複写（固定資産一覧・不動産所得収入の内訳のみ）',
    preventDefault: true,
  },
];

/**
 * 仕訳入力用のキーバインド
 */
export const JOURNAL_ENTRY_KEYBINDS: PresetKeybind[] = [
  {
    id: 'journal-entry-delete-f9',
    keyCombo: 'f9',
    label: '仕訳削除',
    category: 'journal-entry',
    description: '仕訳削除',
    preventDefault: true,
  },
  {
    id: 'journal-entry-delete-ctrldel',
    keyCombo: 'ctrl+delete',
    label: '仕訳削除',
    category: 'journal-entry',
    description: '仕訳削除',
    preventDefault: true,
  },
  {
    id: 'journal-entry-register',
    keyCombo: 'f12',
    label: '仕訳登録',
    category: 'journal-entry',
    description: '仕訳登録',
    preventDefault: true,
  },
  {
    id: 'journal-entry-debit-fix',
    keyCombo: 'shift+f11',
    label: '借方項目の固定/解除',
    category: 'journal-entry',
    description: '借方項目の固定/解除',
    preventDefault: true,
  },
  {
    id: 'journal-entry-credit-fix',
    keyCombo: 'shift+f12',
    label: '貸方項目の固定/解除',
    category: 'journal-entry',
    description: '貸方項目の固定/解除',
    preventDefault: true,
  },
  {
    id: 'journal-entry-row-cut',
    keyCombo: 'ctrl+k',
    label: '行切り取り',
    category: 'journal-entry',
    description: '行切り取り',
    preventDefault: true,
  },
  {
    id: 'journal-entry-row-copy',
    keyCombo: 'ctrl+l',
    label: '行コピー',
    category: 'journal-entry',
    description: '行コピー',
    preventDefault: true,
  },
  {
    id: 'journal-entry-row-paste',
    keyCombo: 'ctrl+y',
    label: '行貼り付け',
    category: 'journal-entry',
    description: '行貼り付け',
    preventDefault: true,
  },
  {
    id: 'journal-entry-row-insert',
    keyCombo: 'ctrl+insert',
    label: '新規行挿入',
    category: 'journal-entry',
    description: '新規行挿入',
    preventDefault: true,
  },
];

/**
 * 仕訳日記帳・帳簿用のキーバインド
 */
export const JOURNAL_LEDGER_KEYBINDS: PresetKeybind[] = [
  {
    id: 'journal-ledger-filter-toggle',
    keyCombo: 'alt+1',
    label: '絞り込み ON/OFF',
    category: 'journal-ledger',
    description: '絞り込み ON/OFF',
    preventDefault: true,
  },
  {
    id: 'journal-ledger-filter-navigation',
    keyCombo: 'f6',
    label: '絞り込み行と編集行の移動',
    category: 'journal-ledger',
    description: '絞り込み行と編集行の移動',
    preventDefault: true,
  },
  {
    id: 'journal-ledger-zoom',
    keyCombo: 'f8',
    label: 'ズーム（伝票表示）',
    category: 'journal-ledger',
    description: 'ズーム（伝票表示）',
    preventDefault: true,
  },
  {
    id: 'journal-ledger-delete-f9',
    keyCombo: 'f9',
    label: '仕訳削除',
    category: 'journal-ledger',
    description: '仕訳削除',
    preventDefault: true,
  },
  {
    id: 'journal-ledger-delete-ctrldel',
    keyCombo: 'ctrl+delete',
    label: '仕訳削除',
    category: 'journal-ledger',
    description: '仕訳削除',
    preventDefault: true,
  },
  {
    id: 'journal-ledger-voucher-viewer',
    keyCombo: 'shift+f5',
    label: '証憑ビューアー',
    category: 'journal-ledger',
    description: '証憑ビューアー',
    preventDefault: true,
  },
  {
    id: 'journal-ledger-tag1-remove',
    keyCombo: 'shift+f7',
    label: '付箋1を外す',
    category: 'journal-ledger',
    description: '付箋1を外す',
    preventDefault: true,
  },
  {
    id: 'journal-ledger-tag2-remove',
    keyCombo: 'shift+f8',
    label: '付箋2を外す',
    category: 'journal-ledger',
    description: '付箋2を外す',
    preventDefault: true,
  },
  {
    id: 'journal-ledger-debit-fix',
    keyCombo: 'shift+f11',
    label: '借方項目固定/解除',
    category: 'journal-ledger',
    description: '借方項目固定/解除',
    preventDefault: true,
  },
  {
    id: 'journal-ledger-credit-fix',
    keyCombo: 'shift+f12',
    label: '貸方項目固定/解除',
    category: 'journal-ledger',
    description: '貸方項目固定/解除',
    preventDefault: true,
  },
  {
    id: 'journal-ledger-row-copy-prev',
    keyCombo: 'ctrl+f',
    label: '前行項目複写',
    category: 'journal-ledger',
    description: '前行項目複写',
    preventDefault: true,
  },
  {
    id: 'journal-ledger-row-cut',
    keyCombo: 'ctrl+k',
    label: '行切り取り',
    category: 'journal-ledger',
    description: '行切り取り',
    preventDefault: true,
  },
  {
    id: 'journal-ledger-row-copy',
    keyCombo: 'ctrl+l',
    label: '行コピー',
    category: 'journal-ledger',
    description: '行コピー',
    preventDefault: true,
  },
  {
    id: 'journal-ledger-row-paste',
    keyCombo: 'ctrl+y',
    label: '行貼り付け',
    category: 'journal-ledger',
    description: '行貼り付け',
    preventDefault: true,
  },
  {
    id: 'journal-ledger-tax-debit',
    keyCombo: 'ctrl+q',
    label: '借方税区分へ移動',
    category: 'journal-ledger',
    description: '借方税区分へ移動',
    preventDefault: true,
  },
  {
    id: 'journal-ledger-tax-credit',
    keyCombo: 'ctrl+w',
    label: '貸方税区分へ移動',
    category: 'journal-ledger',
    description: '貸方税区分へ移動',
    preventDefault: true,
  },
  {
    id: 'journal-ledger-invoice-type',
    keyCombo: 'ctrl+i',
    label: '請求書区分へ移動',
    category: 'journal-ledger',
    description: '請求書区分へ移動',
    preventDefault: true,
  },
  {
    id: 'journal-ledger-tax-deduction',
    keyCombo: 'ctrl+j',
    label: '仕入税額控除項目へ',
    category: 'journal-ledger',
    description: '仕入税額控除項目へ',
    preventDefault: true,
  },
  {
    id: 'journal-ledger-row-insert',
    keyCombo: 'ctrl+insert',
    label: '行挿入',
    category: 'journal-ledger',
    description: '行挿入',
    preventDefault: true,
  },
];

/**
 * 伝票入力用のキーバインド
 */
export const VOUCHER_ENTRY_KEYBINDS: PresetKeybind[] = [
  {
    id: 'voucher-entry-date',
    keyCombo: 'alt+d',
    label: '日付へ移動',
    category: 'voucher-entry',
    description: '日付へ移動',
    preventDefault: true,
  },
  {
    id: 'voucher-entry-prev',
    keyCombo: 'f6',
    label: '前の伝票へ',
    category: 'voucher-entry',
    description: '前の伝票へ',
    preventDefault: true,
  },
  {
    id: 'voucher-entry-next',
    keyCombo: 'f7',
    label: '次の伝票へ',
    category: 'voucher-entry',
    description: '次の伝票へ',
    preventDefault: true,
  },
  {
    id: 'voucher-entry-reference',
    keyCombo: 'f8',
    label: '伝票辞書の参照',
    category: 'voucher-entry',
    description: '伝票辞書の参照',
    preventDefault: true,
  },
  {
    id: 'voucher-entry-delete',
    keyCombo: 'f9',
    label: '伝票削除',
    category: 'voucher-entry',
    description: '伝票削除',
    preventDefault: true,
  },
  {
    id: 'voucher-entry-register',
    keyCombo: 'f12',
    label: '伝票登録',
    category: 'voucher-entry',
    description: '伝票登録',
    preventDefault: true,
  },
  {
    id: 'voucher-entry-transfer',
    keyCombo: 'shift+f5',
    label: '振替伝票',
    category: 'voucher-entry',
    description: '振替伝票',
    preventDefault: true,
  },
  {
    id: 'voucher-entry-receipt',
    keyCombo: 'shift+f6',
    label: '入金伝票',
    category: 'voucher-entry',
    description: '入金伝票',
    preventDefault: true,
  },
  {
    id: 'voucher-entry-payment',
    keyCombo: 'shift+f7',
    label: '出金伝票',
    category: 'voucher-entry',
    description: '出金伝票',
    preventDefault: true,
  },
  {
    id: 'voucher-entry-new',
    keyCombo: 'shift+f8',
    label: '新規伝票',
    category: 'voucher-entry',
    description: '新規伝票',
    preventDefault: true,
  },
  {
    id: 'voucher-entry-duplicate-shiftf12',
    keyCombo: 'shift+f12',
    label: '伝票複製',
    category: 'voucher-entry',
    description: '伝票複製',
    preventDefault: true,
  },
  {
    id: 'voucher-entry-duplicate-ctrlr',
    keyCombo: 'ctrl+r',
    label: '伝票複製',
    category: 'voucher-entry',
    description: '伝票複製',
    preventDefault: true,
  },
  {
    id: 'voucher-entry-balance',
    keyCombo: 'shift+=',
    label: '貸借バランス0の金額・相手金額を入力',
    category: 'voucher-entry',
    description: '貸借バランス0の金額・相手金額を入力',
    preventDefault: true,
  },
  {
    id: 'voucher-entry-row-copy-prev',
    keyCombo: 'ctrl+f',
    label: '前行項目複写',
    category: 'voucher-entry',
    description: '前行項目複写',
    preventDefault: true,
  },
  {
    id: 'voucher-entry-row-cut',
    keyCombo: 'ctrl+k',
    label: '行切り取り',
    category: 'voucher-entry',
    description: '行切り取り',
    preventDefault: true,
  },
  {
    id: 'voucher-entry-row-copy',
    keyCombo: 'ctrl+l',
    label: '行コピー',
    category: 'voucher-entry',
    description: '行コピー',
    preventDefault: true,
  },
  {
    id: 'voucher-entry-row-paste',
    keyCombo: 'ctrl+y',
    label: '行貼り付け',
    category: 'voucher-entry',
    description: '行貼り付け',
    preventDefault: true,
  },
  {
    id: 'voucher-entry-tax-debit',
    keyCombo: 'ctrl+q',
    label: '借方税区分へ',
    category: 'voucher-entry',
    description: '借方税区分へ',
    preventDefault: true,
  },
  {
    id: 'voucher-entry-tax-credit',
    keyCombo: 'ctrl+w',
    label: '貸方税区分へ',
    category: 'voucher-entry',
    description: '貸方税区分へ',
    preventDefault: true,
  },
  {
    id: 'voucher-entry-invoice-type',
    keyCombo: 'ctrl+i',
    label: '請求書区分へ',
    category: 'voucher-entry',
    description: '請求書区分へ',
    preventDefault: true,
  },
  {
    id: 'voucher-entry-tax-deduction',
    keyCombo: 'ctrl+j',
    label: '仕入税額控除へ',
    category: 'voucher-entry',
    description: '仕入税額控除へ',
    preventDefault: true,
  },
  {
    id: 'voucher-entry-row-delete',
    keyCombo: 'ctrl+delete',
    label: '行削除',
    category: 'voucher-entry',
    description: '行削除',
    preventDefault: true,
  },
  {
    id: 'voucher-entry-row-insert',
    keyCombo: 'ctrl+insert',
    label: '行挿入',
    category: 'voucher-entry',
    description: '行挿入',
    preventDefault: true,
  },
];

/**
 * 集計表用のキーバインド
 */
export const SUMMARY_TABLE_KEYBINDS: PresetKeybind[] = [
  {
    id: 'summary-table-department-select',
    keyCombo: 'f4',
    label: '部門の選択',
    category: 'summary-table',
    description: '部門の選択（残高試算表など）',
    preventDefault: true,
  },
  {
    id: 'summary-table-aggregate',
    keyCombo: 'f5',
    label: '集計',
    category: 'summary-table',
    description: '集計',
    preventDefault: true,
  },
  {
    id: 'summary-table-jump-zoom',
    keyCombo: 'f8',
    label: 'ジャンプ / ズーム',
    category: 'summary-table',
    description: 'ジャンプ / ズーム',
    preventDefault: true,
  },
];

/**
 * 決算書設定（法人）用のキーバインド
 */
export const FINANCIAL_STATEMENT_KEYBINDS: PresetKeybind[] = [
  {
    id: 'financial-statement-office-info',
    keyCombo: 'f5',
    label: '事業所情報の取り込み',
    category: 'financial-statement',
    description: '事業所情報の取り込み',
    preventDefault: true,
  },
  {
    id: 'financial-statement-template-insert',
    keyCombo: 'shift+f2',
    label: 'ひな形挿入',
    category: 'financial-statement',
    description: 'ひな形挿入',
    preventDefault: true,
  },
  {
    id: 'financial-statement-statement-of-changes',
    keyCombo: 'f8',
    label: '株主資本等変動計算書を表示',
    category: 'financial-statement',
    description: '株主資本等変動計算書を表示',
    preventDefault: true,
  },
  {
    id: 'financial-statement-create',
    keyCombo: 'f12',
    label: '決算書の作成',
    category: 'financial-statement',
    description: '決算書の作成（印刷/エクスポート）',
    preventDefault: true,
  },
];

/**
 * 勘定科目内訳書用のキーバインド
 */
export const ACCOUNT_BREAKDOWN_KEYBINDS: PresetKeybind[] = [
  {
    id: 'account-breakdown-settings',
    keyCombo: 'f8',
    label: '内訳書科目設定',
    category: 'account-breakdown',
    description: '内訳書科目設定',
    preventDefault: true,
  },
  {
    id: 'account-breakdown-data-settings',
    keyCombo: 'f12',
    label: 'データ設定',
    category: 'account-breakdown',
    description: 'データ設定',
    preventDefault: true,
  },
  {
    id: 'account-breakdown-data-import',
    keyCombo: 'f5',
    label: 'データ取り込み',
    category: 'account-breakdown',
    description: 'データ取り込み',
    preventDefault: true,
  },
  {
    id: 'account-breakdown-detail-insert',
    keyCombo: 'shift+f2',
    label: '明細行挿入',
    category: 'account-breakdown',
    description: '明細行挿入',
    preventDefault: true,
  },
  {
    id: 'account-breakdown-memo-insert',
    keyCombo: 'shift+f3',
    label: 'メモ行挿入',
    category: 'account-breakdown',
    description: 'メモ行挿入',
    preventDefault: true,
  },
  {
    id: 'account-breakdown-subtotal-insert',
    keyCombo: 'shift+f4',
    label: '小計行挿入',
    category: 'account-breakdown',
    description: '小計行挿入',
    preventDefault: true,
  },
  {
    id: 'account-breakdown-row-cut',
    keyCombo: 'shift+f5',
    label: '行切り取り',
    category: 'account-breakdown',
    description: '行切り取り',
    preventDefault: true,
  },
  {
    id: 'account-breakdown-row-copy',
    keyCombo: 'shift+f6',
    label: '行コピー',
    category: 'account-breakdown',
    description: '行コピー',
    preventDefault: true,
  },
  {
    id: 'account-breakdown-row-paste',
    keyCombo: 'shift+f7',
    label: '行貼り付け',
    category: 'account-breakdown',
    description: '行貼り付け',
    preventDefault: true,
  },
  {
    id: 'account-breakdown-row-up',
    keyCombo: 'shift+f11',
    label: '行を上へ',
    category: 'account-breakdown',
    description: '行を上へ',
    preventDefault: true,
  },
  {
    id: 'account-breakdown-row-down',
    keyCombo: 'shift+f12',
    label: '行を下へ',
    category: 'account-breakdown',
    description: '行を下へ',
    preventDefault: true,
  },
];

/**
 * 消費税申告書用のキーバインド
 */
export const CONSUMPTION_TAX_KEYBINDS: PresetKeybind[] = [
  {
    id: 'consumption-tax-overwrite-toggle',
    keyCombo: 'f8',
    label: '上書きON/OFF',
    category: 'consumption-tax',
    description: '上書きON/OFF',
    preventDefault: true,
  },
  {
    id: 'consumption-tax-preview',
    keyCombo: 'f12',
    label: 'プレビュー',
    category: 'consumption-tax',
    description: 'プレビュー',
    preventDefault: true,
  },
];

/**
 * 取引予定表用のキーバインド
 */
export const TRANSACTION_SCHEDULE_KEYBINDS: PresetKeybind[] = [
  {
    id: 'transaction-schedule-edit',
    keyCombo: 'f7',
    label: '編集',
    category: 'transaction-schedule',
    description: '編集',
    preventDefault: true,
  },
  {
    id: 'transaction-schedule-new',
    keyCombo: 'f8',
    label: '新規作成',
    category: 'transaction-schedule',
    description: '新規作成',
    preventDefault: true,
  },
  {
    id: 'transaction-schedule-delete',
    keyCombo: 'f9',
    label: '削除',
    category: 'transaction-schedule',
    description: '削除',
    preventDefault: true,
  },
  {
    id: 'transaction-schedule-execute',
    keyCombo: 'f12',
    label: '実行',
    category: 'transaction-schedule',
    description: '実行',
    preventDefault: true,
  },
];

/**
 * その他用のキーバインド
 */
export const OTHER_KEYBINDS: PresetKeybind[] = [
  {
    id: 'other-journal-export',
    keyCombo: 'f12',
    label: '仕訳書き出し',
    category: 'other',
    description: '仕訳書き出し',
    preventDefault: true,
  },
];

/**
 * 全てのプリセットキーバインド
 */
export const ALL_PRESET_KEYBINDS: PresetKeybind[] = [
  ...LEDGER_KEYBINDS,
  ...INVOICE_KEYBINDS,
  ...BUSINESS_KEYBINDS,
  ...REPORT_KEYBINDS,
  ...GENERAL_KEYBINDS,
  ...COMMON_KEYBINDS,
  ...PRINT_EXPORT_KEYBINDS,
  ...SEARCH_KEYBINDS,
  ...ACCOUNT_DEPARTMENT_KEYBINDS,
  ...JOURNAL_ENTRY_KEYBINDS,
  ...JOURNAL_LEDGER_KEYBINDS,
  ...VOUCHER_ENTRY_KEYBINDS,
  ...SUMMARY_TABLE_KEYBINDS,
  ...FINANCIAL_STATEMENT_KEYBINDS,
  ...ACCOUNT_BREAKDOWN_KEYBINDS,
  ...CONSUMPTION_TAX_KEYBINDS,
  ...TRANSACTION_SCHEDULE_KEYBINDS,
  ...OTHER_KEYBINDS,
];

/**
 * カテゴリ別にキーバインドを取得
 */
export function getKeybindsByCategory(category: PresetKeybind['category']): PresetKeybind[] {
  return ALL_PRESET_KEYBINDS.filter(kb => kb.category === category);
}

/**
 * IDでキーバインドを取得
 */
export function getKeybindById(id: string): PresetKeybind | undefined {
  return ALL_PRESET_KEYBINDS.find(kb => kb.id === id);
}
