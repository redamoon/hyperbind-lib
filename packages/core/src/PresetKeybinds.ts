/**
 * プリセットキーバインド定義
 * React以外の環境でも利用可能な静的データ構造
 */

export interface PresetKeybind {
  id: string;
  keyCombo: string;
  label: string;
  category: 'ledger' | 'invoice' | 'report' | 'general';
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
 * 全てのプリセットキーバインド
 */
export const ALL_PRESET_KEYBINDS: PresetKeybind[] = [
  ...LEDGER_KEYBINDS,
  ...INVOICE_KEYBINDS,
  ...BUSINESS_KEYBINDS,
  ...REPORT_KEYBINDS,
  ...GENERAL_KEYBINDS,
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
