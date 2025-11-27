<template>
  <div :style="{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }">
    <div :style="{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }">
      <RouterLink to="/" :style="{ color: '#2196F3', textDecoration: 'none' }">
        ← トップに戻る
      </RouterLink>
      <button @click="showCalendar = true">📅 カレンダー</button>
      <button @click="showHelp = true">❓ ヘルプ</button>
      <button 
        @click="toggle"
        :style="{
          backgroundColor: isEnabled ? '#4CAF50' : '#f44336',
          color: 'white',
          border: 'none',
          padding: '0.5rem 1rem',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold',
        }"
      >
        {{ isEnabled ? '✓ キーバインド: ON' : '✗ キーバインド: OFF' }}
      </button>
    </div>

    <h1 :style="{ marginTop: 0 }">💰 販売・営業支援ダッシュボード</h1>
    <p :style="{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }">
      すべてのキーバインドが登録されています。各キーを押すとalertで動作が確認できます。
    </p>

    <div :style="{ marginTop: '2rem' }">
      <div
        v-for="[subCategory, keybinds] in Object.entries(keybindsBySubCategory)"
        :key="subCategory"
        :style="{
          marginBottom: '2rem',
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '1.5rem',
          backgroundColor: '#f9f9f9',
        }"
      >
        <h3 :style="{ marginTop: 0, marginBottom: '1rem', color: '#333' }">
          {{ subCategory }}
        </h3>
        <div
          :style="{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '0.75rem',
          }"
        >
          <div
            v-for="kb in keybinds"
            :key="kb.id"
            :style="{
              padding: '0.75rem',
              backgroundColor: 'white',
              borderRadius: '4px',
              border: '1px solid #e0e0e0',
            }"
          >
            <div :style="{ fontWeight: 'bold', marginBottom: '0.25rem' }">
              {{ kb.label }}
            </div>
            <div :style="{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }">
              <code :style="{ backgroundColor: '#f5f5f5', padding: '0.2rem 0.4rem', borderRadius: '3px' }">
                {{ kb.keyCombo }}
              </code>
            </div>
            <div :style="{ fontSize: '0.8rem', color: '#888' }">
              {{ kb.description || '(説明なし)' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <CalendarModal v-if="showCalendar" @close="showCalendar = false" />
    <HelpDialog v-if="showHelp" @close="showHelp = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { RouterLink } from "vue-router";
import { binder } from "@hyperbind-lib/core";
import { useGlobalKeybindToggle } from "@hyperbind-lib/vue";
import CalendarModal from "../CalendarModal.vue";
import HelpDialog from "../HelpDialog.vue";

const { isEnabled, toggle } = useGlobalKeybindToggle();
const showCalendar = ref(false);
const showHelp = ref(false);

// ローカルキーバインドデータの型定義
interface SalesKeybind {
  id: string;
  keyCombo: string;
  label: string;
  category: string;
  subCategory?: string; // サブカテゴリ（全般、金額や数量の入力、日付の入力など）
  description: string;
  preventDefault: boolean;
}

// 販売ダッシュボード用キーバインドデータ
const SALES_KEYBINDS: SalesKeybind[] = [
  // 共通
  {
    id: 'sales-common-help',
    keyCombo: 'f1',
    label: 'ヘルプ',
    category: 'sales-dashboard',
    subCategory: '共通',
    description: '現在、表示している画面に関する製品サポートページが表示されます。',
    preventDefault: true,
  },
  {
    id: 'sales-common-f5',
    keyCombo: 'f5',
    label: 'F5',
    category: 'sales-dashboard',
    subCategory: '共通',
    description: '',
    preventDefault: true,
  },
  {
    id: 'sales-common-print',
    keyCombo: 'ctrl+p',
    label: '印刷',
    category: 'sales-dashboard',
    subCategory: '共通',
    description: '印刷画面が表示されます。印刷を実行することができます。',
    preventDefault: false,
  },
  {
    id: 'sales-common-navigate-back',
    keyCombo: 'alt+arrowleft',
    label: '画面の切り替え（戻る）',
    category: 'sales-dashboard',
    subCategory: '共通',
    description: '複数の画面を開いている場合に、作業する画面を切り替えます。',
    preventDefault: true,
  },
  {
    id: 'sales-common-navigate-forward',
    keyCombo: 'alt+arrowright',
    label: '画面の切り替え（進む）',
    category: 'sales-dashboard',
    subCategory: '共通',
    description: '複数の画面を開いている場合に、作業する画面を切り替えます。',
    preventDefault: true,
  },
  // 台帳
  {
    id: 'sales-ledger-new',
    keyCombo: 'f2',
    label: '新規作成',
    category: 'sales-dashboard',
    subCategory: '台帳',
    description: '台帳に表示されている内容をクリアし、新規に台帳を登録できるようにします。',
    preventDefault: true,
  },
  {
    id: 'sales-ledger-reference-f8',
    keyCombo: 'f8',
    label: '参照',
    category: 'sales-dashboard',
    subCategory: '台帳',
    description: '参照画面が表示されます。カーソルがある項目に応じて、他の台帳を参照して入力することができます。台帳の［コード］で参照すると、登録済みの台帳を呼び出して修正や削除を行うことができます。',
    preventDefault: true,
  },
  {
    id: 'sales-ledger-reference-space',
    keyCombo: 'space',
    label: '参照（スペース）',
    category: 'sales-dashboard',
    subCategory: '台帳',
    description: '参照画面が表示されます。カーソルがある項目に応じて、他の台帳を参照して入力することができます。台帳の［コード］で参照すると、登録済みの台帳を呼び出して修正や削除を行うことができます。',
    preventDefault: true,
  },
  {
    id: 'sales-ledger-delete',
    keyCombo: 'f9',
    label: '削除',
    category: 'sales-dashboard',
    subCategory: '台帳',
    description: '表示中の台帳を削除します。リストでは、選択中の台帳を削除します。',
    preventDefault: true,
  },
  {
    id: 'sales-ledger-register',
    keyCombo: 'f12',
    label: '登録',
    category: 'sales-dashboard',
    subCategory: '台帳',
    description: '新規作成/修正した台帳を登録します。',
    preventDefault: true,
  },
  // 伝票
  {
    id: 'sales-invoice-new',
    keyCombo: 'f2',
    label: '新規作成',
    category: 'sales-dashboard',
    subCategory: '伝票',
    description: '伝票に表示されている内容をクリアし、新規に伝票を登録できるようにします。',
    preventDefault: true,
  },
  {
    id: 'sales-invoice-pdf',
    keyCombo: 'f6',
    label: 'PDF送信',
    category: 'sales-dashboard',
    subCategory: '伝票',
    description: '得意先台帳（仕入先台帳）で設定した［出力方法］によって、帳票を取引先にPDF送信します。',
    preventDefault: true,
  },
  {
    id: 'sales-invoice-reference-f8',
    keyCombo: 'f8',
    label: '参照',
    category: 'sales-dashboard',
    subCategory: '伝票',
    description: '参照画面が表示されます。カーソルがある項目に応じて、台帳を参照して入力することができます。伝票の日付または伝票番号で参照すると、登録済みの伝票を呼び出して修正や削除を行うことができます。他の伝票を呼び出して内容を複写することもできます。',
    preventDefault: true,
  },
  {
    id: 'sales-invoice-reference-space',
    keyCombo: 'space',
    label: '参照（スペース）',
    category: 'sales-dashboard',
    subCategory: '伝票',
    description: '参照画面が表示されます。カーソルがある項目に応じて、台帳を参照して入力することができます。伝票の日付または伝票番号で参照すると、登録済みの伝票を呼び出して修正や削除を行うことができます。他の伝票を呼び出して内容を複写することもできます。',
    preventDefault: true,
  },
  {
    id: 'sales-invoice-delete',
    keyCombo: 'f9',
    label: '削除',
    category: 'sales-dashboard',
    subCategory: '伝票',
    description: '表示中の伝票を削除します。',
    preventDefault: true,
  },
  {
    id: 'sales-invoice-register',
    keyCombo: 'f12',
    label: '登録',
    category: 'sales-dashboard',
    subCategory: '伝票',
    description: '新規作成/修正した伝票を登録します。',
    preventDefault: true,
  },
  {
    id: 'sales-invoice-search',
    keyCombo: 'ctrl+f',
    label: '検索',
    category: 'sales-dashboard',
    subCategory: '伝票',
    description: '検索画面が表示されます。検索条件を指定して伝票を検索することができます。',
    preventDefault: true,
  },
  {
    id: 'sales-invoice-insert-row',
    keyCombo: 'ctrl+insert',
    label: '行挿入',
    category: 'sales-dashboard',
    subCategory: '伝票',
    description: '選択した行の前に新しい行が挿入されます。',
    preventDefault: true,
  },
  {
    id: 'sales-invoice-delete-row',
    keyCombo: 'ctrl+delete',
    label: '行削除',
    category: 'sales-dashboard',
    subCategory: '伝票',
    description: '選択した行を削除します。',
    preventDefault: true,
  },
  // 売上・仕入・在庫（伝票以外）
  {
    id: 'sales-business-new',
    keyCombo: 'f2',
    label: '新規入力',
    category: 'sales-dashboard',
    subCategory: '売上・仕入・在庫（伝票以外）',
    description: '明細部に表示されている内容をクリアし、他の条件で集計できるようにします。',
    preventDefault: true,
  },
  {
    id: 'sales-business-pdf',
    keyCombo: 'f6',
    label: 'PDF送信（送信）',
    category: 'sales-dashboard',
    subCategory: '売上・仕入・在庫（伝票以外）',
    description: '得意先台帳（仕入先台帳）で設定した［出力方法］によって、請求書や支払書を取引先にPDF送信、またはデジタルインボイス送信します。',
    preventDefault: true,
  },
  {
    id: 'sales-business-digital-invoice',
    keyCombo: 'f7',
    label: 'デジタルインボイス送信',
    category: 'sales-dashboard',
    subCategory: '売上・仕入・在庫（伝票以外）',
    description: 'デジタルインボイス送信を行います。',
    preventDefault: true,
  },
  {
    id: 'sales-business-reference-f8',
    keyCombo: 'f8',
    label: '参照',
    category: 'sales-dashboard',
    subCategory: '売上・仕入・在庫（伝票以外）',
    description: '参照画面が表示されます。カーソルがある項目に応じて、台帳を参照して入力することができます。',
    preventDefault: true,
  },
  {
    id: 'sales-business-reference-space',
    keyCombo: 'space',
    label: '参照（スペース）',
    category: 'sales-dashboard',
    subCategory: '売上・仕入・在庫（伝票以外）',
    description: '参照画面が表示されます。カーソルがある項目に応じて、台帳を参照して入力することができます。',
    preventDefault: true,
  },
  {
    id: 'sales-business-delete-row',
    keyCombo: 'ctrl+delete',
    label: '行削除',
    category: 'sales-dashboard',
    subCategory: '売上・仕入・在庫（伝票以外）',
    description: '選択した行を削除します。',
    preventDefault: true,
  },
  // レポート
  {
    id: 'sales-report-new',
    keyCombo: 'f2',
    label: '新規入力',
    category: 'sales-dashboard',
    subCategory: 'レポート',
    description: '明細部に表示されている内容をクリアし、他の条件で集計できるようにします。',
    preventDefault: true,
  },
  // その他のキーボード操作 - 全般
  {
    id: 'sales-other-navigation-next-tab',
    keyCombo: 'tab',
    label: 'カーソル移動（次へ）',
    category: 'sales-dashboard',
    subCategory: 'その他のキーボード操作 - 全般',
    description: 'カーソルを次の項目へ移動します。',
    preventDefault: false,
  },
  {
    id: 'sales-other-navigation-next-arrowdown',
    keyCombo: 'arrowdown',
    label: 'カーソル移動（次へ）',
    category: 'sales-dashboard',
    subCategory: 'その他のキーボード操作 - 全般',
    description: 'カーソルを次の項目へ移動します。',
    preventDefault: false,
  },
  {
    id: 'sales-other-navigation-next-arrowright',
    keyCombo: 'arrowright',
    label: 'カーソル移動（次へ）',
    category: 'sales-dashboard',
    subCategory: 'その他のキーボード操作 - 全般',
    description: 'カーソルを次の項目へ移動します。',
    preventDefault: false,
  },
  {
    id: 'sales-other-navigation-next-enter',
    keyCombo: 'enter',
    label: 'カーソル移動（次へ）',
    category: 'sales-dashboard',
    subCategory: 'その他のキーボード操作 - 全般',
    description: 'カーソルを次の項目へ移動します。',
    preventDefault: false,
  },
  {
    id: 'sales-other-navigation-prev-shifttab',
    keyCombo: 'shift+tab',
    label: 'カーソル移動（前へ）',
    category: 'sales-dashboard',
    subCategory: 'その他のキーボード操作 - 全般',
    description: 'カーソルを前の項目へ移動します。',
    preventDefault: false,
  },
  {
    id: 'sales-other-navigation-prev-arrowup',
    keyCombo: 'arrowup',
    label: 'カーソル移動（前へ）',
    category: 'sales-dashboard',
    subCategory: 'その他のキーボード操作 - 全般',
    description: 'カーソルを前の項目へ移動します。',
    preventDefault: false,
  },
  {
    id: 'sales-other-navigation-prev-arrowleft',
    keyCombo: 'arrowleft',
    label: 'カーソル移動（前へ）',
    category: 'sales-dashboard',
    subCategory: 'その他のキーボード操作 - 全般',
    description: 'カーソルを前の項目へ移動します。',
    preventDefault: false,
  },
  {
    id: 'sales-other-navigation-prev-shiftenter',
    keyCombo: 'shift+enter',
    label: 'カーソル移動（前へ）',
    category: 'sales-dashboard',
    subCategory: 'その他のキーボード操作 - 全般',
    description: 'カーソルを前の項目へ移動します。',
    preventDefault: false,
  },
  // その他のキーボード操作 - 金額や数量の入力
  {
    id: 'sales-other-amount-space',
    keyCombo: 'space',
    label: '選択項目表示、電卓、カレンダー',
    category: 'sales-dashboard',
    subCategory: 'その他のキーボード操作 - 金額や数量の入力',
    description: 'が表示される項目で、選択項目のリストを表示します。数値の計算ができる項目では電卓、日付を入力する項目ではカレンダーを表示します。',
    preventDefault: true,
  },
  {
    id: 'sales-other-amount-altdown',
    keyCombo: 'alt+arrowdown',
    label: '選択項目表示、電卓、カレンダー',
    category: 'sales-dashboard',
    subCategory: 'その他のキーボード操作 - 金額や数量の入力',
    description: 'が表示される項目で、選択項目のリストを表示します。数値の計算ができる項目では電卓、日付を入力する項目ではカレンダーを表示します。',
    preventDefault: true,
  },
  // その他のキーボード操作 - 日付の入力
  {
    id: 'sales-other-date-space',
    keyCombo: 'space',
    label: '選択項目表示、電卓、カレンダー',
    category: 'sales-dashboard',
    subCategory: 'その他のキーボード操作 - 日付の入力',
    description: 'が表示される項目で、選択項目のリストを表示します。数値の計算ができる項目では電卓、日付を入力する項目ではカレンダーを表示します。',
    preventDefault: true,
  },
  {
    id: 'sales-other-date-altdown',
    keyCombo: 'alt+arrowdown',
    label: '選択項目表示、電卓、カレンダー',
    category: 'sales-dashboard',
    subCategory: 'その他のキーボード操作 - 日付の入力',
    description: 'が表示される項目で、選択項目のリストを表示します。数値の計算ができる項目では電卓、日付を入力する項目ではカレンダーを表示します。',
    preventDefault: true,
  },
];

const keybindsBySubCategory = computed(() => {
  return SALES_KEYBINDS.reduce((acc, kb) => {
    const subCategory = kb.subCategory || 'その他';
    if (!acc[subCategory]) {
      acc[subCategory] = [];
    }
    acc[subCategory].push(kb);
    return acc;
  }, {} as Record<string, typeof SALES_KEYBINDS>);
});

let registeredIds: string[] = [];

onMounted(() => {
  // キーごとにキーバインドをグループ化
  const keybindsByKeyCombo = SALES_KEYBINDS.reduce((acc, preset) => {
    const keyCombo = preset.keyCombo.toLowerCase();
    if (!acc[keyCombo]) {
      acc[keyCombo] = [];
    }
    acc[keyCombo].push(preset);
    return acc;
  }, {} as Record<string, typeof SALES_KEYBINDS>);

  // すべてのキーバインドを登録
  Object.entries(keybindsByKeyCombo).forEach(([keyCombo, presets]) => {
    // 同じキーが複数登録されている場合、すべてを実行
    if (presets.length > 1) {
      const id = `sales-${keyCombo}-multiple`;
      registeredIds.push(id);
      
      // preventDefaultは、いずれかがtrueの場合はtrueにする
      const preventDefault = presets.some(p => p.preventDefault);
      
      binder.registerWithId(
        id,
        keyCombo,
        () => {
          // すべてのキーバインドの情報をalertで表示
          // サブカテゴリとラベルでソートして表示順を統一
          const sortedPresets = [...presets].sort((a, b) => {
            const subCategoryA = a.subCategory || '';
            const subCategoryB = b.subCategory || '';
            if (subCategoryA !== subCategoryB) {
              return subCategoryA.localeCompare(subCategoryB);
            }
            return a.label.localeCompare(b.label);
          });
          
          const messages = sortedPresets.map((preset) => {
            const subCategoryName = preset.subCategory || '';
            return `🎯 ${preset.label}\nカテゴリ: ${subCategoryName}\n説明: ${preset.description || '(説明なし)'}`;
          });
          alert(messages.join('\n\n---\n\n'));
        },
        { preventDefault }
      );
    } else {
      // 単一のキーバインドの場合
      const preset = presets[0];
      const id = `sales-${preset.id}`;
      registeredIds.push(id);
      
      const subCategoryName = preset.subCategory || '';
      
      binder.registerWithId(
        id,
        preset.keyCombo,
        () => {
          alert(`🎯 ${preset.label}\n\nカテゴリ: ${subCategoryName}\nキー: ${preset.keyCombo}\n説明: ${preset.description || '(説明なし)'}`);
        },
        { preventDefault: preset.preventDefault }
      );
    }
  });
});

onUnmounted(() => {
  registeredIds.forEach((id) => {
    binder.unregisterById(id);
  });
});
</script>

