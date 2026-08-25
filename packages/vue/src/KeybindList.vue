<script setup lang="ts">
import { ref } from "vue";
import { CustomKeybind } from "./useCustomKeybinds";
import KeyRecorder from "./KeyRecorder.vue";
import { isReservedKey } from "./reservedKeys";

/**
 * KeybindListコンポーネントのプロパティ
 */
interface KeybindListProps {
  /** 表示するキーバインドの配列 */
  keybinds: CustomKeybind[];
  /** キーバインドの有効/無効を切り替えるときに呼ばれる関数 */
  onToggle: (id: string) => void;
  /** preventDefaultの有効/無効を切り替えるときに呼ばれる関数 */
  onTogglePreventDefault: (id: string) => void;
  /** キーバインドを削除するときに呼ばれる関数 */
  onRemove: (id: string) => void;
  /** キーバインドを更新するときに呼ばれる関数 */
  onUpdate: (id: string, updates: Partial<CustomKeybind>) => void;
}

/**
 * カスタムキーバインドの一覧を表示・編集するコンポーネント
 *
 * class / style はルート要素に適用されます（Vueの属性フォールスルー）。
 * 以下のCSS変数でもテーマを変更できます。
 * `--hyperbind-list-gap` / `--hyperbind-item-bg` / `--hyperbind-item-bg-disabled` /
 * `--hyperbind-item-border` / `--hyperbind-item-border-warning` / `--hyperbind-item-radius` /
 * `--hyperbind-item-padding` / `--hyperbind-empty-color` / `--hyperbind-warning-bg` /
 * `--hyperbind-warning-border` / `--hyperbind-warning-color` /
 * `--hyperbind-remove-bg` / `--hyperbind-remove-color`
 */

const props = defineProps<KeybindListProps>();

const warningMap = ref<Record<string, string | null>>({});

const handleWarning = (id: string, warning: string | null) => {
  warningMap.value = { ...warningMap.value, [id]: warning };
};
</script>

<template>
  <div class="hyperbind-keybind-list" style="margin-top: 1rem;">
    <p
      v-if="keybinds.length === 0"
      style="color: var(--hyperbind-empty-color, #999); font-size: 0.9rem;"
    >
      キーバインドが登録されていません
    </p>
    <div
      v-else
      style="display: flex; flex-direction: column; gap: var(--hyperbind-list-gap, 0.5rem);"
    >
      <div
        v-for="kb in keybinds"
        :key="kb.id"
        class="hyperbind-keybind-list__item"
        :style="{
          padding: 'var(--hyperbind-item-padding, 0.75rem)',
          border: isReservedKey(kb.keyCombo)
            ? 'var(--hyperbind-item-border-warning, 2px solid #ff9800)'
            : 'var(--hyperbind-item-border, 1px solid #ddd)',
          borderRadius: 'var(--hyperbind-item-radius, 4px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          backgroundColor: kb.enabled
            ? 'var(--hyperbind-item-bg, #fff)'
            : 'var(--hyperbind-item-bg-disabled, #f5f5f5)',
        }"
      >
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <input
            type="checkbox"
            :checked="kb.enabled"
            @change="onToggle(kb.id)"
            title="有効/無効"
          />
          <input
            type="text"
            :value="kb.label"
            @input="(e) => onUpdate(kb.id, { label: (e.target as HTMLInputElement).value })"
            style="flex: 1; padding: 0.25rem 0.5rem; border: 1px solid #ccc; border-radius: 3px;"
            placeholder="ラベル"
          />
          <KeyRecorder
            :model-value="kb.keyCombo"
            @update:model-value="(newKey) => onUpdate(kb.id, { keyCombo: newKey })"
            :show-warning="true"
            @warning="(warning) => handleWarning(kb.id, warning)"
          />
          <label style="font-size: 0.85rem; display: flex; align-items: center; gap: 0.25rem;">
            <input
              type="checkbox"
              :checked="kb.preventDefault"
              @change="onTogglePreventDefault(kb.id)"
              title="ブラウザのデフォルト動作を防止"
            />
            preventDefault
          </label>
          <button
            @click="onRemove(kb.id)"
            style="padding: 0.25rem 0.5rem; background-color: var(--hyperbind-remove-bg, #f44336); color: var(--hyperbind-remove-color, #fff); border: none; border-radius: 3px; cursor: pointer;"
          >
            削除
          </button>
        </div>
        <div
          v-if="warningMap[kb.id]"
          role="alert"
          style="padding: 0.5rem; background-color: var(--hyperbind-warning-bg, #fff3cd); border: var(--hyperbind-warning-border, 1px solid #ff9800); border-radius: 3px; font-size: 0.85rem; color: var(--hyperbind-warning-color, #856404);"
        >
          ⚠️ {{ warningMap[kb.id] }}
        </div>
      </div>
    </div>
  </div>
</template>

