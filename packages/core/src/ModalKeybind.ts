/**
 * モーダルキーバインドのオプション設定（フレームワーク非依存）
 *
 * React の `UseModalKeybindOptions` と Vue の `UseModalKeybindOptions` は
 * どちらもこの型のエイリアスです。
 */
export interface ModalKeybindOptions {
  /** キーの組み合わせ（例: "f5", "escape"） */
  keyCombo: string;
  /** モーダルを開くときに実行される関数 */
  onOpen: () => void;
  /** モーダルを閉じるときに実行される関数（省略可能） */
  onClose?: () => void;
  /** モーダルが現在開いているかどうか */
  isOpen?: boolean;
  /** デフォルトのブラウザ動作を防ぐか（デフォルト: true） */
  preventDefault?: boolean;
}
