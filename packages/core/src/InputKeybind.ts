import { binder } from "./KeybindManager";

/**
 * 入力フィールド専用キーバインドの、フレームワーク非依存なオプション
 *
 * React / Vue の `UseInputKeybindOptions` は、この型に
 * 各フレームワーク固有の `elementRef` を追加したものです。
 */
export interface InputKeybindOptionsBase {
  /** キーの組み合わせ（デフォルト: "Enter"） */
  keyCombo?: string;
  /** キー押下時に実行される関数 */
  onTrigger: () => void;
  /** キーバインドを有効にするか（デフォルト: true） */
  enabled?: boolean;
  /** デフォルトのブラウザ動作を防ぐか（デフォルト: true） */
  preventDefault?: boolean;
}

/**
 * {@link createFocusGuardedKeyHandler} のオプション設定
 */
export interface FocusGuardedKeyHandlerOptions {
  /**
   * 対象要素を解決する関数
   *
   * - 要素を返す場合: その要素にフォーカスがあるときのみ実行します
   * - `null` を返す場合: 対象要素が未マウントとみなし、何も実行しません
   * - `undefined` を返す場合: 対象要素の指定なしとみなし、フォーカス判定せず常に実行します
   */
  resolveElement: () => Element | null | undefined;
  /** デフォルトのブラウザ動作を防ぐかどうかを返す関数 */
  shouldPreventDefault: () => boolean;
  /** 実行するコールバックを返す関数（常に最新のコールバックを返すこと） */
  resolveCallback: () => () => void;
}

/**
 * フォーカス判定付きのキーイベントハンドラーを生成します
 *
 * 対象要素にフォーカスがある場合のみ`preventDefault`とコールバックを実行するため、
 * 同じキーバインドを複数の入力要素で共有できます。
 * フォーカスが一致しない場合は何もせず、FormNavigatorなどの他の処理に委ねます。
 *
 * @param options - ハンドラーの生成オプション
 * @returns KeybindManagerに登録できるキーイベントハンドラー
 *
 * @example
 * ```typescript
 * const handleKey = createFocusGuardedKeyHandler({
 *   resolveElement: () => inputRef.current,
 *   shouldPreventDefault: () => true,
 *   resolveCallback: () => onTrigger,
 * });
 * ```
 */
export function createFocusGuardedKeyHandler({
  resolveElement,
  shouldPreventDefault,
  resolveCallback,
}: FocusGuardedKeyHandlerOptions): (event: KeyboardEvent) => void {
  return (event: KeyboardEvent) => {
    const element = resolveElement();

    // 対象要素が指定されている場合は、フォーカスが一致したときのみ実行する
    if (element !== undefined) {
      if (element === null || element !== document.activeElement) {
        return;
      }
    }

    if (shouldPreventDefault()) {
      event.preventDefault();
    }
    resolveCallback()();
  };
}

/**
 * フォーカス判定付きのキーバインドをKeybindManagerに登録します
 *
 * `preventDefault: false`で登録し、フォーカスが一致したときだけ
 * ハンドラー内で`preventDefault`を実行します。
 *
 * @param id - キーバインドのID（解除時に使用します）
 * @param keyCombo - キーの組み合わせ
 * @param options - フォーカス判定ハンドラーの生成オプション
 *
 * @example
 * ```typescript
 * const id = createKeybindId("input-keybind");
 * registerFocusGuardedKeybind(id, "Enter", {
 *   resolveElement: () => inputRef.current,
 *   shouldPreventDefault: () => true,
 *   resolveCallback: () => onTrigger,
 * });
 * ```
 */
export function registerFocusGuardedKeybind(
  id: string,
  keyCombo: string,
  options: FocusGuardedKeyHandlerOptions
): void {
  binder.registerWithId(id, keyCombo, createFocusGuardedKeyHandler(options), {
    preventDefault: false,
  });
}
