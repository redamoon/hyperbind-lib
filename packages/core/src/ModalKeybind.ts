/**
 * モーダルキーバインドのオプション設定（フレームワーク非依存な共通部分）
 *
 * `isOpen` はフレームワークによって受け取れる型が異なるため含みません。
 * React では `boolean`、Vue では `MaybeRefOrGetter<boolean>` を
 * それぞれの `UseModalKeybindOptions` で追加します。
 */
export interface ModalKeybindOptionsBase {
  /** キーの組み合わせ（例: "f5", "escape"） */
  keyCombo: string;
  /** モーダルを開くときに実行される関数 */
  onOpen: () => void;
  /** モーダルを閉じるときに実行される関数（省略可能） */
  onClose?: () => void;
  /** デフォルトのブラウザ動作を防ぐか（デフォルト: true） */
  preventDefault?: boolean;
}
