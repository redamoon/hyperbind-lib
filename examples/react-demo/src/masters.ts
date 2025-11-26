/**
 * 振替伝票入力画面用のマスタデータ
 */

/**
 * 勘定科目マスタ
 */
export interface AccountMaster {
  code: string; // 科目コード（数字）
  name: string; // 科目名称（漢字）
  kana: string; // 読み（カナ）
  defaultTaxType: string; // 標準税区分
  subAccounts?: SubAccountMaster[]; // 補助科目リスト
}

/**
 * 補助科目マスタ
 */
export interface SubAccountMaster {
  code: string;
  name: string;
  kana: string;
}

/**
 * 部門マスタ
 */
export interface DepartmentMaster {
  code: string;
  name: string;
  kana: string;
}

/**
 * 税区分
 */
export const TAX_TYPES = [
  { value: "none", label: "対象外" },
  { value: "taxable-10", label: "課税仕入10%" },
  { value: "taxable-8", label: "課税仕入8%" },
  { value: "taxable-reduced", label: "軽減税率" },
  { value: "exempt", label: "非課税" },
  { value: "export", label: "輸出免税" },
] as const;

/**
 * 勘定科目マスタデータ
 */
export const ACCOUNT_MASTERS: AccountMaster[] = [
  {
    code: "100",
    name: "現金",
    kana: "ゲンキン",
    defaultTaxType: "none",
    subAccounts: [
      { code: "001", name: "普通預金", kana: "フツウヨキン" },
      { code: "002", name: "当座預金", kana: "トウザヨキン" },
    ],
  },
  {
    code: "110",
    name: "普通預金",
    kana: "フツウヨキン",
    defaultTaxType: "none",
    subAccounts: [
      { code: "001", name: "三菱UFJ銀行", kana: "ミツビシUFJギンコウ" },
      { code: "002", name: "三井住友銀行", kana: "ミツイスミトモギンコウ" },
      { code: "003", name: "みずほ銀行", kana: "ミズホギンコウ" },
    ],
  },
  {
    code: "120",
    name: "売掛金",
    kana: "ウリカケキン",
    defaultTaxType: "none",
  },
  {
    code: "200",
    name: "買掛金",
    kana: "カイカケキン",
    defaultTaxType: "none",
  },
  {
    code: "300",
    name: "売上",
    kana: "ウリアゲ",
    defaultTaxType: "taxable-10",
  },
  {
    code: "400",
    name: "仕入",
    kana: "シイレ",
    defaultTaxType: "taxable-10",
  },
  {
    code: "500",
    name: "旅費交通費",
    kana: "リョヒコウツウヒ",
    defaultTaxType: "taxable-10",
  },
  {
    code: "510",
    name: "交際費",
    kana: "コウサイヒ",
    defaultTaxType: "taxable-10",
  },
  {
    code: "520",
    name: "給料手当",
    kana: "キュウリョウテアテ",
    defaultTaxType: "none",
  },
  {
    code: "530",
    name: "通信費",
    kana: "ツウシンヒ",
    defaultTaxType: "taxable-10",
  },
  {
    code: "600",
    name: "雑費",
    kana: "ザッピ",
    defaultTaxType: "taxable-10",
  },
];

/**
 * 部門マスタデータ
 */
export const DEPARTMENT_MASTERS: DepartmentMaster[] = [
  { code: "001", name: "本社", kana: "ホンシャ" },
  { code: "002", name: "営業部", kana: "エイギョウブ" },
  { code: "003", name: "経理部", kana: "ケイリブ" },
  { code: "004", name: "総務部", kana: "ソウムブ" },
  { code: "005", name: "開発部", kana: "カイハツブ" },
];

/**
 * 摘要履歴（過去に入力した摘要のサンプル）
 */
export const DESCRIPTION_HISTORY: string[] = [
  "商品売上（現金）",
  "商品売上（掛）",
  "商品仕入",
  "交通費（電車代）",
  "交通費（タクシー代）",
  "会議費",
  "接待費",
  "消耗品費",
  "通信費（電話代）",
  "通信費（インターネット）",
  "光熱費",
  "賃借料",
  "減価償却費",
  "給与",
  "賞与",
];

/**
 * 勘定科目を検索（コード・名称・読みで検索可能）
 */
export function searchAccount(query: string): AccountMaster[] {
  if (!query) return [];
  const lowerQuery = query.toLowerCase();
  return ACCOUNT_MASTERS.filter(
    (account) =>
      account.code.includes(query) ||
      account.name.includes(query) ||
      account.kana.toLowerCase().includes(lowerQuery)
  );
}

/**
 * 補助科目を検索（指定された勘定科目に紐づく補助のみ）
 */
export function searchSubAccount(
  accountCode: string,
  query: string
): SubAccountMaster[] {
  const account = ACCOUNT_MASTERS.find((a) => a.code === accountCode);
  if (!account || !account.subAccounts) return [];
  if (!query) return account.subAccounts;
  const lowerQuery = query.toLowerCase();
  return account.subAccounts.filter(
    (sub) =>
      sub.code.includes(query) ||
      sub.name.includes(query) ||
      sub.kana.toLowerCase().includes(lowerQuery)
  );
}

/**
 * 部門を検索
 */
export function searchDepartment(query: string): DepartmentMaster[] {
  if (!query) return DEPARTMENT_MASTERS;
  const lowerQuery = query.toLowerCase();
  return DEPARTMENT_MASTERS.filter(
    (dept) =>
      dept.code.includes(query) ||
      dept.name.includes(query) ||
      dept.kana.toLowerCase().includes(lowerQuery)
  );
}

/**
 * 摘要を検索（履歴から）
 */
export function searchDescription(query: string): string[] {
  if (!query) return DESCRIPTION_HISTORY.slice(0, 10); // 最大10件
  const lowerQuery = query.toLowerCase();
  return DESCRIPTION_HISTORY.filter((desc) =>
    desc.toLowerCase().includes(lowerQuery)
  ).slice(0, 10);
}

