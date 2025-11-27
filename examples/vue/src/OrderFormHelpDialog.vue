<template>
  <div :style="overlayStyle" @click="onClose">
    <div :style="modalStyle" @click.stop tabindex="-1">
      <h3>❓ 受注伝票入力 - ヘルプ</h3>
      
      <div :style="{ textAlign: 'left', marginTop: '1rem' }">
        <!-- 移動の流れ -->
        <section :style="{ marginBottom: '1.5rem' }">
          <h4 :style="{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }">📋 入力の流れ</h4>
          <ol :style="{ paddingLeft: '1.5rem', lineHeight: '1.8' }">
            <li><strong>受注日</strong> → 日付を入力（例: "5" → 今月5日、 "1225" → 12月25日）</li>
            <li><strong>伝票番号</strong> → 自動採番または手入力</li>
            <li><strong>取引先コード</strong> → コードを入力するとサジェストが表示されます</li>
            <li><strong>商品コード</strong> → コードを入力するとサジェストが表示されます</li>
            <li><strong>数量</strong> → 数量を入力（自動的に金額が計算されます）</li>
            <li><strong>単価</strong> → 単価を入力（自動的に金額が計算されます）</li>
            <li><strong>備考</strong> → 備考を入力後、Enterキーで次の行へ</li>
          </ol>
        </section>

        <!-- キーボードショートカット -->
        <section :style="{ marginBottom: '1.5rem' }">
          <h4 :style="{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }">⌨️ キーボードショートカット</h4>
          <div :style="{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.9rem' }">
            <div>
              <div><strong>F1</strong>: ヘルプ表示</div>
              <div><strong>F2</strong> / <strong>Shift+F8</strong>: 新規作成</div>
              <div><strong>F8</strong>: 参照</div>
              <div><strong>F9</strong>: 伝票削除</div>
              <div><strong>F12</strong> / <strong>Ctrl+S</strong>: 登録</div>
              <div><strong>Alt+D</strong>: 日付へ移動</div>
            </div>
            <div>
              <div><strong>Ctrl+Insert</strong>: 行挿入</div>
              <div><strong>Ctrl+Delete</strong>: 現在の行を削除</div>
              <div><strong>Tab</strong> / <strong>Enter</strong>: 次のフィールドへ移動</div>
              <div><strong>Shift+Tab</strong>: 前のフィールドへ移動</div>
              <div><strong>↑↓</strong>: サジェスト内で移動</div>
              <div><strong>Esc</strong>: ダイアログを閉じる</div>
            </div>
          </div>
        </section>

        <!-- 便利な機能 -->
        <section :style="{ marginBottom: '1.5rem' }">
          <h4 :style="{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }">💡 便利な機能</h4>
          <ul :style="{ paddingLeft: '1.5rem', lineHeight: '1.8' }">
            <li><strong>サジェスト機能</strong>: 取引先コードや商品コードを入力すると、候補が表示されます</li>
            <li><strong>自動計算</strong>: 数量と単価を入力すると、自動的に金額が計算されます</li>
            <li><strong>日付の簡易入力</strong>: "5"（今月5日）、"1225"（12月25日）など、短い形式で入力できます</li>
            <li><strong>行の追加</strong>: 備考フィールドでEnterキーを押すと、自動的に次の行が追加されます</li>
            <li><strong>行の削除</strong>: 削除ボタンをクリックするか、Ctrl+Deleteキーで行を削除できます</li>
          </ul>
        </section>

        <!-- 注意事項 -->
        <section>
          <h4 :style="{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }">⚠️ 注意事項</h4>
          <ul :style="{ paddingLeft: '1.5rem', lineHeight: '1.8' }">
            <li>最低1行の明細が必要です</li>
            <li>登録時には取引先の選択が必須です</li>
            <li>金額が入力されている行では、商品の選択が必須です</li>
          </ul>
        </section>
      </div>

      <button 
        @click="onClose"
        :style="{
          padding: '0.5rem 1.5rem',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '1rem',
          fontWeight: 'bold',
          marginTop: '1rem',
        }"
      >
        閉じる
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDisableCustomKeybindsWhileMounted } from "@hyperbind-lib/vue";

interface Props {
  onClose: () => void;
}

defineProps<Props>();

useDisableCustomKeybindsWhileMounted();

const overlayStyle = {
  position: "fixed" as const,
  inset: 0,
  background: "rgba(0,0,0,0.3)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalStyle = {
  background: "#fff",
  padding: "2rem",
  borderRadius: "8px",
  minWidth: "400px",
  maxWidth: "800px",
  maxHeight: "90vh",
  overflowY: "auto" as const,
};
</script>

