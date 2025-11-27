/**
 * 振替伝票入力画面用のマスタデータ
 */

/**
 * 取引先マスタ
 */
export interface CustomerMaster {
  code: string; // 取引先コード
  name: string; // 取引先名
  postalCode?: string; // 郵便番号
  prefecture?: string; // 都道府県
  city?: string; // 市区町村
  addressLine?: string; // 番地・建物名
  phone?: string; // 電話番号
  fax?: string; // FAX番号
  email?: string; // メールアドレス
  representative?: string; // 代表者名
  contactPerson?: string; // 担当者名
  startDate?: string; // 取引開始日 (YYYY/MM/DD)
  remarks?: string; // 備考
}

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

/**
 * 取引先マスタデータ
 */
export const CUSTOMER_MASTERS: CustomerMaster[] = [
  {
    code: "C001",
    name: "株式会社ABC",
    postalCode: "100-0001",
    prefecture: "東京都",
    city: "千代田区",
    addressLine: "千代田1-1-1",
    phone: "03-1234-5678",
    fax: "03-1234-5679",
    email: "info@abc.co.jp",
    representative: "山田太郎",
    contactPerson: "佐藤花子",
    startDate: "2020/01/01",
    remarks: "主要取引先",
  },
  {
    code: "C002",
    name: "株式会社XYZ",
    postalCode: "530-0001",
    prefecture: "大阪府",
    city: "大阪市",
    addressLine: "北区梅田2-2-2",
    phone: "06-2345-6789",
    fax: "06-2345-6790",
    email: "info@xyz.co.jp",
    representative: "鈴木一郎",
    contactPerson: "田中次郎",
    startDate: "2019/04/01",
    remarks: "",
  },
  {
    code: "C003",
    name: "株式会社DEF",
    postalCode: "810-0001",
    prefecture: "福岡県",
    city: "福岡市",
    addressLine: "中央区天神3-3-3",
    phone: "092-3456-7890",
    fax: "092-3456-7891",
    email: "info@def.co.jp",
    representative: "高橋三郎",
    contactPerson: "伊藤四郎",
    startDate: "2021/07/01",
    remarks: "新規取引先",
  },
];

/**
 * 取引先を検索（コード・名称で検索可能）
 */
export function searchCustomer(query: string): CustomerMaster[] {
  if (!query) return CUSTOMER_MASTERS;
  const lowerQuery = query.toLowerCase();
  return CUSTOMER_MASTERS.filter(
    (customer) =>
      customer.code.toLowerCase().includes(lowerQuery) ||
      customer.name.toLowerCase().includes(lowerQuery)
  );
}

/**
 * 商品マスタ
 */
export interface ProductMaster {
  code: string; // 商品コード
  name: string; // 商品名
  unit?: string; // 単位（個、箱、kgなど）
  category?: string; // カテゴリ
  purchasePrice?: number; // 仕入単価
  sellingPrice: number; // 販売単価
  stock?: number; // 在庫数
  startDate?: string; // 登録日 (YYYY/MM/DD)
  remarks?: string; // 備考
}

/**
 * 商品マスタデータ
 */
export const PRODUCT_MASTERS: ProductMaster[] = [
  {
    code: "P001",
    name: "ノートPC",
    unit: "台",
    category: "PC",
    purchasePrice: 80000,
    sellingPrice: 98000,
    stock: 10,
    startDate: "2020/01/01",
    remarks: "高性能ノートPC",
  },
  {
    code: "P002",
    name: "マウス",
    unit: "個",
    category: "周辺機器",
    purchasePrice: 2000,
    sellingPrice: 2500,
    stock: 50,
    startDate: "2020/01/01",
    remarks: "ワイヤレスマウス",
  },
  {
    code: "P003",
    name: "キーボード",
    unit: "個",
    category: "周辺機器",
    purchasePrice: 4500,
    sellingPrice: 5800,
    stock: 30,
    startDate: "2020/01/01",
    remarks: "メカニカルキーボード",
  },
  {
    code: "P004",
    name: "モニター",
    unit: "台",
    category: "ディスプレイ",
    purchasePrice: 22000,
    sellingPrice: 28000,
    stock: 20,
    startDate: "2020/01/01",
    remarks: "27インチ4Kモニター",
  },
];

/**
 * 商品を検索（コード・名称で検索可能）
 */
export function searchProduct(query: string): ProductMaster[] {
  if (!query) return PRODUCT_MASTERS;
  const lowerQuery = query.toLowerCase();
  return PRODUCT_MASTERS.filter(
    (product) =>
      product.code.toLowerCase().includes(lowerQuery) ||
      product.name.toLowerCase().includes(lowerQuery)
  );
}

/**
 * 物件マスタ
 */
export interface PropertyMaster {
  code: string; // 物件コード
  name: string; // 物件名
  postalCode?: string; // 郵便番号
  prefecture?: string; // 都道府県
  city?: string; // 市区町村
  addressLine?: string; // 番地・建物名
  rent?: number; // 家賃
  managementFee?: number; // 管理費
  deposit?: number; // 敷金
  keyMoney?: number; // 礼金
  age?: number; // 築年数
  layout?: string; // 間取り
  registrationDate?: string; // 登録日 (YYYY/MM/DD)
  remarks?: string; // 備考
}

/**
 * 物件マスタデータ
 */
export const PROPERTY_MASTERS: PropertyMaster[] = [
  {
    code: "P001",
    name: "サンライズマンション101",
    postalCode: "100-0001",
    prefecture: "東京都",
    city: "千代田区",
    addressLine: "千代田1-1-1",
    rent: 80000,
    managementFee: 5000,
    deposit: 160000,
    keyMoney: 80000,
    age: 5,
    layout: "1LDK",
    registrationDate: "2020/01/01",
    remarks: "駅徒歩5分",
  },
  {
    code: "P002",
    name: "パークハイツ202",
    postalCode: "150-0001",
    prefecture: "東京都",
    city: "渋谷区",
    addressLine: "渋谷2-2-2",
    rent: 120000,
    managementFee: 8000,
    deposit: 240000,
    keyMoney: 120000,
    age: 3,
    layout: "2LDK",
    registrationDate: "2021/04/01",
    remarks: "南向き、角部屋",
  },
  {
    code: "P003",
    name: "グリーンコート303",
    postalCode: "530-0001",
    prefecture: "大阪府",
    city: "大阪市",
    addressLine: "北区梅田3-3-3",
    rent: 95000,
    managementFee: 6000,
    deposit: 190000,
    keyMoney: 95000,
    age: 8,
    layout: "1LDK",
    registrationDate: "2019/07/01",
    remarks: "リフォーム済み",
  },
];

/**
 * 物件を検索（コード・名称で検索可能）
 */
export function searchProperty(query: string): PropertyMaster[] {
  if (!query) return PROPERTY_MASTERS;
  const lowerQuery = query.toLowerCase();
  return PROPERTY_MASTERS.filter(
    (property) =>
      property.code.toLowerCase().includes(lowerQuery) ||
      property.name.toLowerCase().includes(lowerQuery)
  );
}

/**
 * 契約マスタ
 */
export interface ContractMaster {
  contractNumber: string; // 契約番号
  propertyCode: string; // 物件コード
  tenantName: string; // 入居者名
  startDate: string; // 契約開始日 (YYYY/MM/DD)
  endDate?: string; // 契約終了日 (YYYY/MM/DD)
  rent?: number; // 家賃
  managementFee?: number; // 管理費
  deposit?: number; // 敷金
  keyMoney?: number; // 礼金
  renewalDate?: string; // 更新日 (YYYY/MM/DD)
  remarks?: string; // 備考
}

/**
 * 契約マスタデータ
 */
export const CONTRACT_MASTERS: ContractMaster[] = [
  {
    contractNumber: "C001",
    propertyCode: "P001",
    tenantName: "山田太郎",
    startDate: "2023/01/01",
    endDate: "2025/12/31",
    rent: 80000,
    managementFee: 5000,
    deposit: 160000,
    keyMoney: 80000,
    renewalDate: "2024/12/31",
    remarks: "2年契約",
  },
  {
    contractNumber: "C002",
    propertyCode: "P002",
    tenantName: "佐藤花子",
    startDate: "2023/04/01",
    endDate: "2026/03/31",
    rent: 120000,
    managementFee: 8000,
    deposit: 240000,
    keyMoney: 120000,
    renewalDate: "2025/03/31",
    remarks: "会社員、保証人あり",
  },
  {
    contractNumber: "C003",
    propertyCode: "P003",
    tenantName: "鈴木一郎",
    startDate: "2022/10/01",
    endDate: "2024/09/30",
    rent: 95000,
    managementFee: 6000,
    deposit: 190000,
    keyMoney: 95000,
    renewalDate: "2023/09/30",
    remarks: "更新予定",
  },
];

/**
 * 契約を検索（契約番号・入居者名で検索可能）
 */
export function searchContract(query: string): ContractMaster[] {
  if (!query) return CONTRACT_MASTERS;
  const lowerQuery = query.toLowerCase();
  return CONTRACT_MASTERS.filter(
    (contract) =>
      contract.contractNumber.toLowerCase().includes(lowerQuery) ||
      contract.tenantName.toLowerCase().includes(lowerQuery) ||
      contract.propertyCode.toLowerCase().includes(lowerQuery)
  );
}

/**
 * 営業日報明細行のデータ型
 */
export interface DailyReportRow {
  id: string; // 行ID
  customerCode: string; // 訪問先（顧客コード）
  customer: CustomerMaster | null; // 訪問先（顧客情報）
  interviewer: string; // 面談者
  discussionContent: string; // 商談内容
  nextAction: string; // 次回アクション
  remarks: string; // 所感・上司への報告
}

/**
 * 営業日報マスタ
 */
export interface DailyReportMaster {
  id: string; // 日報ID
  date: string; // 日付 (YYYY/MM/DD)
  visitCount: number; // 訪問件数（自動集計）
  rows: DailyReportRow[]; // 明細行
}

/**
 * 営業日報マスタデータ（サンプル）
 */
export const DAILY_REPORT_MASTERS: DailyReportMaster[] = [
  {
    id: "DR001",
    date: "2024/01/15",
    visitCount: 2,
    rows: [
      {
        id: "1",
        customerCode: "C001",
        customer: CUSTOMER_MASTERS[0],
        interviewer: "山田太郎",
        discussionContent: "新商品の提案を行った。興味を示してくれた。",
        nextAction: "見積書を送付する",
        remarks: "来週再度訪問予定",
      },
      {
        id: "2",
        customerCode: "C002",
        customer: CUSTOMER_MASTERS[1],
        interviewer: "佐藤花子",
        discussionContent: "既存契約の更新について相談。",
        nextAction: "契約条件を確認して回答する",
        remarks: "条件交渉が必要",
      },
    ],
  },
];

/**
 * 営業日報を検索（日付で検索可能）
 */
export function searchDailyReport(query: string): DailyReportMaster[] {
  if (!query) return DAILY_REPORT_MASTERS;
  const lowerQuery = query.toLowerCase();
  return DAILY_REPORT_MASTERS.filter(
    (report) =>
      report.date.includes(query) ||
      report.id.toLowerCase().includes(lowerQuery)
  );
}

/**
 * 経費種別マスタ
 */
export interface ExpenseTypeMaster {
  code: string; // 経費種別コード
  name: string; // 経費種別名
  kana?: string; // 読み（カナ）
}

/**
 * 経費種別マスタデータ
 */
export const EXPENSE_TYPE_MASTERS: ExpenseTypeMaster[] = [
  { code: "E001", name: "交通費", kana: "コウツウヒ" },
  { code: "E002", name: "接待費", kana: "セッタイヒ" },
  { code: "E003", name: "会議費", kana: "カイギヒ" },
  { code: "E004", name: "通信費", kana: "ツウシンヒ" },
  { code: "E005", name: "消耗品費", kana: "ショウモウヒンヒ" },
  { code: "E006", name: "出張費", kana: "シュッチョウヒ" },
  { code: "E007", name: "研修費", kana: "ケンシュウヒ" },
  { code: "E008", name: "広告宣伝費", kana: "コウコクセンデンヒ" },
  { code: "E009", name: "その他", kana: "ソノタ" },
];

/**
 * 経費種別を検索（コード・名称・読みで検索可能）
 */
export function searchExpenseType(query: string): ExpenseTypeMaster[] {
  if (!query) return EXPENSE_TYPE_MASTERS;
  const lowerQuery = query.toLowerCase();
  return EXPENSE_TYPE_MASTERS.filter(
    (type) =>
      type.code.toLowerCase().includes(lowerQuery) ||
      type.name.includes(query) ||
      (type.kana && type.kana.toLowerCase().includes(lowerQuery))
  );
}

/**
 * 支払方法マスタ
 */
export interface PaymentMethodMaster {
  code: string; // 支払方法コード
  name: string; // 支払方法名
  kana?: string; // 読み（カナ）
}

/**
 * 支払方法マスタデータ
 */
export const PAYMENT_METHOD_MASTERS: PaymentMethodMaster[] = [
  { code: "P001", name: "現金", kana: "ゲンキン" },
  { code: "P002", name: "クレジットカード", kana: "クレジットカード" },
  { code: "P003", name: "銀行振込", kana: "ギンコウフリコミ" },
  { code: "P004", name: "電子マネー", kana: "デンシマネー" },
  { code: "P005", name: "その他", kana: "ソノタ" },
];

/**
 * 支払方法を検索（コード・名称・読みで検索可能）
 */
export function searchPaymentMethod(query: string): PaymentMethodMaster[] {
  if (!query) return PAYMENT_METHOD_MASTERS;
  const lowerQuery = query.toLowerCase();
  return PAYMENT_METHOD_MASTERS.filter(
    (method) =>
      method.code.toLowerCase().includes(lowerQuery) ||
      method.name.includes(query) ||
      (method.kana && method.kana.toLowerCase().includes(lowerQuery))
  );
}

