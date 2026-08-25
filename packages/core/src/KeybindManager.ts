import { getModifierParts, isModifierKey, resolveEventKey } from "./keyCombo";
import { keyFromCode, normalizeKeyCombo, normalizeKeyName, swapCmdCtrl } from "./normalizeKeyCombo";

/**
 * コールバック関数の型定義（引数なし）
 */
export type Callback = () => void;

/**
 * イベントを受け取るコールバック関数の型定義
 *
 * コールバックには常に `KeyboardEvent` が渡されます。
 * 引数を宣言しないコールバック（`() => void`）もそのまま登録できます。
 */
export type CallbackWithEvent = (event: KeyboardEvent) => void;

/**
 * キーバインドの設定情報
 */
export interface KeybindConfig {
  /** キーバインドの一意識別子 */
  id: string;
  /** キーの組み合わせ（正規化済み。例: "ctrl+s", "cmd+k"） */
  keyCombo: string;
  /** キー押下時に実行されるコールバック関数 */
  callback: CallbackWithEvent;
  /** キーバインドの有効/無効状態 */
  enabled: boolean;
  /** デフォルトのブラウザ動作を防ぐかどうか */
  preventDefault: boolean;
}

declare const process: { env?: Record<string, string | undefined> } | undefined;

/**
 * 開発モードかどうかを判定します
 *
 * バンドラーによって`process`が定義されない環境でも安全に動作します。
 * @internal
 */
const isDevMode = (): boolean => {
  try {
    return typeof process === "undefined" || process?.env?.NODE_ENV !== "production";
  } catch {
    return true;
  }
};

/**
 * KeybindManagerのコンストラクタ・動作オプション
 */
export interface KeybindManagerOptions {
  /**
   * インスタンス生成時に自動でkeydownリスナーを登録するか（デフォルト: false）
   *
   * falseの場合は、明示的に`start()`を呼ぶまでキーイベントを受け取りません。
   */
  autoStart?: boolean;
  /** リスナーの登録先（デフォルト: グローバルの`window`） */
  target?: EventTarget | null;
  /**
   * 修飾キーなしの単独キー（`"a"` や `"1"` など）のキーバインドを許可するか
   *
   * デフォルトは `false` です。`false` の場合、修飾キーを伴わない
   * 1文字キーの入力は無視されます（通常のテキスト入力を妨げないため）。
   * Enter / Escape / Tab / 矢印キーなどの特殊キーはこの制限を受けません。
   */
  allowSingleKeyBindings?: boolean;
}

/**
 * 旧 API（`register`）で登録されたキーバインドの内部表現
 */
interface LegacyBinding {
  callback: CallbackWithEvent;
  preventDefault: boolean;
}

/**
 * 修飾キーなしでも処理される特殊キー（正規化済みの名前）
 */
const SPECIAL_KEYS = [
  "enter",
  "escape",
  "tab",
  "backspace",
  "delete",
  "arrowup",
  "arrowdown",
  "arrowleft",
  "arrowright",
  "home",
  "end",
  "pageup",
  "pagedown",
  "f1",
  "f2",
  "f3",
  "f4",
  "f5",
  "f6",
  "f7",
  "f8",
  "f9",
  "f10",
  "f11",
  "f12",
  "space",
];

/**
 * キーバインドを管理するクラス
 *
 * グローバルなキーボードショートカットの登録、解除、実行を管理します。
 * Mac（Command）とWindows/Linux（Ctrl）のクロスプラットフォーム対応を提供します。
 *
 * キーの組み合わせは登録時・照合時の双方で正規化されるため、
 * `"alt+shift+n"` と `"shift+alt+n"`、`"cmd+option+i"` と `"cmd+alt+i"` は
 * 同じキーバインドとして扱われます。
 *
 * @example
 * ```typescript
 * import { binder } from '@hyperbind/core';
 *
 * // シンプルな登録
 * binder.register('ctrl+s', () => console.log('保存'));
 *
 * // ID付き登録（有効/無効の切り替えが可能）
 * binder.registerWithId('save', 'ctrl+s', () => console.log('保存'), { preventDefault: true });
 * ```
 */
export class KeybindManager {
  private bindings: Map<string, LegacyBinding> = new Map();
  private bindingsById: Map<string, KeybindConfig> = new Map();
  /** 明示的なマスタースイッチ（enable() / disable() で操作） */
  private enabled = true;
  private allowSingleKeyBindings: boolean;
  /** 一時無効化の参照カウント（suspend() で操作） */
  private suspendCount = 0;
  /**
   * 参照カウントの世代番号
   *
   * destroy()でカウントをリセットした際にインクリメントし、
   * リセット前に配られた解除関数を無効化します。
   */
  private suspendGeneration = 0;
  private listening = false;
  private target: EventTarget | null = null;
  private readonly keydownListener = (event: Event) => {
    this.handleKey(event as KeyboardEvent);
  };

  /**
   * @param options - コンストラクタ・動作オプション
   *
   * @example
   * ```typescript
   * // 手動でライフサイクルを制御する
   * const manager = new KeybindManager();
   * manager.start();
   * // ...
   * manager.stop();
   *
   * // 生成と同時にリスナーを登録する
   * const auto = new KeybindManager({ autoStart: true });
   *
   * // 修飾キーなしの単独キー（'a' など）のバインドを許可する
   * const single = new KeybindManager({ allowSingleKeyBindings: true });
   * ```
   */
  constructor(options: KeybindManagerOptions = {}) {
    this.allowSingleKeyBindings = options.allowSingleKeyBindings === true;

    if (options.autoStart) {
      this.start(options.target);
    }
  }

  /**
   * 動作オプションを更新します
   *
   * @param options - 更新するオプション（指定されたものだけが反映されます）
   *
   * @example
   * ```typescript
   * // 修飾キーなしの単独キー（'a' など）のバインドを許可する
   * binder.setOptions({ allowSingleKeyBindings: true });
   * ```
   */
  setOptions(options: KeybindManagerOptions) {
    if (options.allowSingleKeyBindings !== undefined) {
      this.allowSingleKeyBindings = options.allowSingleKeyBindings === true;
    }
  }

  /**
   * 修飾キーなしの単独キーのキーバインドが許可されているかを返します
   *
   * @returns 許可されている場合はtrue
   */
  isSingleKeyBindingAllowed(): boolean {
    return this.allowSingleKeyBindings;
  }

  /**
   * デフォルトのリスナー登録先を返します
   *
   * SSRなど`window`が存在しない環境ではnullを返します。
   */
  private getDefaultTarget(): EventTarget | null {
    return typeof window !== "undefined" ? window : null;
  }

  /**
   * keydownリスナーを登録し、キーバインドの受付を開始します
   *
   * 多重呼び出しは安全です（同じtargetに対しては再登録されません）。
   * 別のtargetを指定して呼んだ場合は、既存のリスナーを解除してから登録し直します。
   *
   * @param target - リスナーの登録先（デフォルト: グローバルの`window`）
   * @returns リスナーを登録できた場合はtrue（`window`が無い環境ではfalse）
   *
   * @example
   * ```typescript
   * binder.start();
   * ```
   */
  start(target?: EventTarget | null): boolean {
    const nextTarget = target ?? this.getDefaultTarget();
    if (!nextTarget) return false;

    if (this.listening) {
      if (this.target === nextTarget) return true;
      this.stop();
    }

    nextTarget.addEventListener("keydown", this.keydownListener);
    this.target = nextTarget;
    this.listening = true;
    return true;
  }

  /**
   * keydownリスナーを解除し、キーバインドの受付を停止します
   *
   * 登録済みのキーバインド自体は保持されるため、`start()`で再開できます。
   * HMRやテストのクリーンアップで呼び出してください。
   *
   * @example
   * ```typescript
   * binder.stop();
   * ```
   */
  stop() {
    if (!this.listening || !this.target) return;

    this.target.removeEventListener("keydown", this.keydownListener);
    this.target = null;
    this.listening = false;
  }

  /**
   * keydownリスナーが登録されているかを返します
   *
   * @returns リスナー登録中の場合はtrue
   */
  isListening(): boolean {
    return this.listening;
  }

  /**
   * リスナーを解除し、登録済みのキーバインドをすべて破棄します
   *
   * テストのteardownなど、インスタンスを完全に初期化したい場合に使用します。
   *
   * @example
   * ```typescript
   * afterEach(() => binder.destroy());
   * ```
   */
  destroy() {
    this.stop();
    this.bindings.clear();
    this.bindingsById.clear();
    this.enabled = true;
    this.suspendCount = 0;
    // リセット前に配られた解除関数を無効化する
    this.suspendGeneration++;
  }

  /**
   * キーバインドを登録します（シンプルな登録方法）
   *
   * @param keyCombo - キーの組み合わせ（例: "ctrl+s", "cmd+k"）
   * @param callback - キー押下時に実行される関数（`KeyboardEvent` が渡されます）
   * @param options - オプション設定
   * @param options.preventDefault - デフォルトのブラウザ動作を防ぐか（デフォルト: true）
   *
   * @example
   * ```typescript
   * binder.register('ctrl+s', () => {
   *   console.log('保存処理');
   * });
   *
   * // デフォルト動作を維持したまま登録
   * binder.register('enter', (event) => console.log(event), { preventDefault: false });
   * ```
   */
  register(
    keyCombo: string,
    callback: Callback | CallbackWithEvent,
    options: { preventDefault?: boolean } = {}
  ) {
    const normalized = normalizeKeyCombo(keyCombo);
    const binding: LegacyBinding = {
      callback: callback as CallbackWithEvent,
      preventDefault: options.preventDefault !== false,
    };
    this.bindings.set(normalized, binding);

    // クロスプラットフォーム対応: cmdとctrlを相互登録
    const swapped = swapCmdCtrl(normalized);
    if (swapped) {
      this.bindings.set(swapped, binding);
    }
  }

  /**
   * キーバインドの登録を解除します
   *
   * @param keyCombo - 解除するキーの組み合わせ
   *
   * @example
   * ```typescript
   * binder.unregister('ctrl+s');
   * ```
   */
  unregister(keyCombo: string) {
    const normalized = normalizeKeyCombo(keyCombo);
    this.bindings.delete(normalized);

    // クロスプラットフォーム対応: cmdとctrlを両方削除
    const swapped = swapCmdCtrl(normalized);
    if (swapped) {
      this.bindings.delete(swapped);
    }
  }

  /**
   * キーボードイベントから照合対象となるキーの組み合わせの候補を生成します
   *
   * `event.key` に加えて `event.code` や Shift+数字の記号（`"!"` → `"1"`）も
   * 候補に含めることで、キーボードレイアウトの差異を吸収します。
   *
   * @param event - キーボードイベント
   * @returns 正規化されたキーの組み合わせの候補
   */
  private buildComboCandidates(event: KeyboardEvent): Set<string> {
    const candidates = new Set<string>();

    // 修飾キー自体の押下（Shift単体など）は組み合わせとして扱わない
    if (isModifierKey(event.key)) return candidates;

    const modifiers = getModifierParts(event);

    const keyCandidates: string[] = [];
    const addKey = (key: string | null | undefined) => {
      if (!key) return;
      const normalized = normalizeKeyName(key);
      if (normalized && !keyCandidates.includes(normalized)) {
        keyCandidates.push(normalized);
      }
    };

    // Shift + 数字の読み替えなど、キー記録UIと同じ解決を第一候補にする
    addKey(resolveEventKey(event));
    addKey(event.key);
    // レイアウト非依存のフォールバック（"Digit1" → "1", "KeyA" → "a"）
    addKey(keyFromCode(event.code));

    for (const key of keyCandidates) {
      const combo = normalizeKeyCombo([...modifiers, key].join("+"));
      candidates.add(combo);

      // クロスプラットフォーム対応（Mac の Cmd ↔ Windows/Linux の Ctrl）
      const swapped = swapCmdCtrl(combo);
      if (swapped) {
        candidates.add(swapped);
      }
    }

    return candidates;
  }

  /**
   * キーボードイベントを処理し、登録されたキーバインドを実行します
   *
   * このメソッドは通常、内部で自動的に呼ばれます（window.addEventListener）。
   * 手動で呼び出す必要はありません。
   *
   * @param event - キーボードイベント
   * @internal
   */
  handleKey(event: KeyboardEvent) {
    // マスタースイッチと suspend() による一時無効化の両方を考慮する
    if (!this.isActive()) return;

    // IME（日本語入力など）変換中のキーは無視する
    // 変換確定の Enter がキーバインドとして発火するのを防ぐ
    if (event.isComposing || event.keyCode === 229) return;

    // Shift も修飾キーとして扱う（"shift+1" のようなキーバインドを成立させるため）
    const isModifierPressed = event.metaKey || event.ctrlKey || event.altKey || event.shiftKey;
    const normalizedKey = normalizeKeyName(event.key);
    const isSpecialKey = SPECIAL_KEYS.includes(normalizedKey);

    // 通常の入力キー（1文字のキー）で修飾キーがない場合は、
    // allowSingleKeyBindings が有効でない限り無視する（テキスト入力を妨げないため）
    if (
      !isModifierPressed &&
      !isSpecialKey &&
      !this.allowSingleKeyBindings &&
      event.key.length === 1
    ) {
      return;
    }

    // 修飾キーの順序・キー名の正規化はキー記録UIと共通の関数に集約している。
    // 照合時はさらに event.code へのフォールバックと cmd/ctrl の相互変換も候補に含める
    const candidates = this.buildComboCandidates(event);
    if (candidates.size === 0) return;

    // ID付きバインディングを優先的にチェック
    let handled = false;
    for (const config of this.bindingsById.values()) {
      if (!config.enabled) continue;
      if (!candidates.has(config.keyCombo)) continue;

      if (config.preventDefault) {
        event.preventDefault();
      }
      config.callback(event);
      handled = true;
      // preventDefault: true の場合のみreturn（他のハンドラーをブロック）
      if (config.preventDefault) {
        return;
      }
      // preventDefault: false の場合は続行（他のハンドラーも実行可能）
    }

    // いずれかのハンドラーが実行された場合、従来のバインディングはスキップ
    if (handled) {
      return;
    }

    // 従来のバインディングもチェック（後方互換性）
    for (const candidate of candidates) {
      const binding = this.bindings.get(candidate);
      if (!binding) continue;

      if (binding.preventDefault) {
        event.preventDefault();
      }
      binding.callback(event);
      return;
    }
  }

  /**
   * すべてのキーバインドを有効化します（マスタースイッチ）
   *
   * suspend() による一時無効化とは独立しています。
   * suspend() 中に enable() を呼んでもキーバインドは復活しません。
   *
   * @example
   * ```typescript
   * binder.enable();
   * ```
   */
  enable() {
    this.enabled = true;
  }

  /**
   * すべてのキーバインドを無効化します（マスタースイッチ）
   *
   * アプリ全体のON/OFF切り替えのような、明示的な無効化に使用します。
   * モーダル表示中などの入れ子になりうる一時的な無効化には
   * suspend() を使用してください。
   *
   * @example
   * ```typescript
   * binder.disable();
   * ```
   */
  disable() {
    this.enabled = false;
  }

  /**
   * マスタースイッチが有効かどうかを返します
   *
   * suspend() による一時無効化は考慮しません。
   * キーバインドが実際に発火する状態かどうかは isActive() を使用してください。
   *
   * @returns マスタースイッチが有効な場合はtrue
   *
   * @example
   * ```typescript
   * if (binder.isEnabled()) {
   *   console.log('キーバインドは有効です');
   * }
   * ```
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * キーバインドを一時的に無効化し、解除用の関数を返します
   *
   * 参照カウント方式のため、複数の呼び出し元が同時に一時無効化できます。
   * すべての解除関数が呼ばれるまでキーバインドは復活しません。
   * モーダルやキー記録UIなど、入れ子になりうる一時無効化に使用します。
   *
   * 返される解除関数は複数回呼んでも安全です（2回目以降は何もしません）。
   *
   * @returns 一時無効化を解除する関数
   *
   * @example
   * ```typescript
   * const release = binder.suspend();
   * // ... キーバインドを無効にしておきたい処理
   * release();
   * ```
   */
  suspend(): () => void {
    const generation = this.suspendGeneration;
    this.suspendCount++;
    let released = false;
    return () => {
      // 解除済み、またはdestroy()でカウントがリセット済みの場合は何もしない
      // （カウントが負に落ち込み、二度と有効化されなくなるのを防ぐ）
      if (released || generation !== this.suspendGeneration) return;
      released = true;
      this.suspendCount--;
    };
  }

  /**
   * suspend() による一時無効化が有効かどうかを返します
   *
   * @returns 未解除の suspend() が1つ以上ある場合はtrue
   *
   * @example
   * ```typescript
   * if (binder.isSuspended()) {
   *   console.log('キーバインドは一時的に無効です');
   * }
   * ```
   */
  isSuspended() {
    return this.suspendCount > 0;
  }

  /**
   * キーバインドが実際に発火する状態かどうかを返します
   *
   * マスタースイッチが有効で、かつ一時無効化されていない場合にtrueです。
   *
   * @returns キーバインドが発火する場合はtrue
   *
   * @example
   * ```typescript
   * if (binder.isActive()) {
   *   console.log('キーバインドは発火します');
   * }
   * ```
   */
  isActive() {
    return this.enabled && !this.isSuspended();
  }

  /**
   * ID付きでキーバインドを登録します（高度な登録方法）
   *
   * ID付き登録により、後から有効/無効の切り替えや、
   * preventDefault設定の変更が可能になります。
   *
   * @param id - キーバインドの一意識別子
   * @param keyCombo - キーの組み合わせ（例: "ctrl+s", "cmd+k"）
   * @param callback - キー押下時に実行される関数（`KeyboardEvent` が渡されます）
   * @param options - オプション設定
   * @param options.preventDefault - デフォルトのブラウザ動作を防ぐか（デフォルト: true）
   * @param options.allowOverwrite - 同じIDの既存バインドを意図的に上書きするか（デフォルト: false）
   *   falseのまま既存IDを上書きすると、開発モードでは警告が出力されます。
   * @returns 登録されたキーバインドのID
   *
   * @example
   * ```typescript
   * binder.registerWithId(
   *   'save-action',
   *   'ctrl+s',
   *   () => console.log('保存'),
   *   { preventDefault: true }
   * );
   *
   * // 後から無効化
   * binder.disableById('save-action');
   * ```
   */
  registerWithId(
    id: string,
    keyCombo: string,
    callback: Callback | CallbackWithEvent,
    options: { preventDefault?: boolean; allowOverwrite?: boolean } = {}
  ): string {
    if (!options.allowOverwrite && this.bindingsById.has(id) && isDevMode()) {
      const existing = this.bindingsById.get(id)!;
      console.warn(
        `[hyperbind] キーバインドID "${id}" は既に登録されています（"${existing.keyCombo}" → "${normalizeKeyCombo(keyCombo)}"）。` +
          "既存の登録は上書きされ、どちらか一方をunregisterById()するともう一方も失われます。" +
          "React では useId()、Vue では getCurrentInstance().uid を使うなどして、" +
          "コンポーネントインスタンスごとに一意なIDを渡してください。" +
          "意図的な上書きの場合は options.allowOverwrite に true を指定すると、この警告を抑制できます。"
      );
    }

    const config: KeybindConfig = {
      id,
      keyCombo: normalizeKeyCombo(keyCombo),
      callback: callback as CallbackWithEvent,
      enabled: true,
      preventDefault: options.preventDefault !== false,
    };

    this.bindingsById.set(id, config);
    return id;
  }

  /**
   * IDを指定してキーバインドの登録を解除します
   *
   * @param id - 解除するキーバインドのID
   *
   * @example
   * ```typescript
   * binder.unregisterById('save-action');
   * ```
   */
  unregisterById(id: string) {
    this.bindingsById.delete(id);
  }

  /**
   * IDを指定してキーバインドを有効化します
   *
   * @param id - 有効化するキーバインドのID
   *
   * @example
   * ```typescript
   * binder.enableById('save-action');
   * ```
   */
  enableById(id: string) {
    const config = this.bindingsById.get(id);
    if (config) {
      config.enabled = true;
    }
  }

  /**
   * IDを指定してキーバインドを無効化します
   *
   * @param id - 無効化するキーバインドのID
   *
   * @example
   * ```typescript
   * binder.disableById('save-action');
   * ```
   */
  disableById(id: string) {
    const config = this.bindingsById.get(id);
    if (config) {
      config.enabled = false;
    }
  }

  /**
   * IDを指定してpreventDefault設定を変更します
   *
   * @param id - 設定を変更するキーバインドのID
   * @param prevent - デフォルト動作を防ぐか
   *
   * @example
   * ```typescript
   * binder.setPreventDefault('save-action', false);
   * ```
   */
  setPreventDefault(id: string, prevent: boolean) {
    const config = this.bindingsById.get(id);
    if (config) {
      config.preventDefault = prevent;
    }
  }

  /**
   * IDを指定してキーバインド設定を取得します
   *
   * @param id - 取得するキーバインドのID
   * @returns キーバインド設定、見つからない場合はundefined
   *
   * @example
   * ```typescript
   * const config = binder.getBinding('save-action');
   * if (config) {
   *   console.log(`Key: ${config.keyCombo}, Enabled: ${config.enabled}`);
   * }
   * ```
   */
  getBinding(id: string): KeybindConfig | undefined {
    return this.bindingsById.get(id);
  }

  /**
   * 登録されているすべてのキーバインド設定を取得します
   *
   * @returns すべてのキーバインド設定の配列
   *
   * @example
   * ```typescript
   * const allBindings = binder.getAllBindings();
   * allBindings.forEach(config => {
   *   console.log(`${config.id}: ${config.keyCombo}`);
   * });
   * ```
   */
  getAllBindings(): KeybindConfig[] {
    return Array.from(this.bindingsById.values());
  }
}

/**
 * グローバルシングルトンをキャッシュするためのキー
 *
 * `Symbol.for`によるグローバルシンボルレジストリを使うことで、
 * React版とVue版がcoreを別バンドルとして二重に取り込んだ場合でも、
 * 同一のKeybindManagerインスタンスを共有します。
 */
const BINDER_KEY: unique symbol = Symbol.for("@hyperbind-lib/core#binder");

/**
 * 自動start()を無効化するためのグローバルフラグ名
 *
 * coreのimportより前に設定しておくと、`binder`はリスナーを登録しません。
 */
const AUTO_START_FLAG = "__HYPERBIND_DISABLE_AUTO_START__";

type HyperbindGlobalScope = typeof globalThis & {
  [BINDER_KEY]?: KeybindManager;
  [AUTO_START_FLAG]?: boolean;
};

const globalScope = globalThis as HyperbindGlobalScope;

/**
 * グローバルなKeybindManagerインスタンスを取得します
 *
 * 既にグローバルへ登録済みのインスタンスがあればそれを返し、
 * 無ければ生成してキャッシュします。
 *
 * @returns アプリケーション全体で共有されるKeybindManager
 *
 * @example
 * ```typescript
 * import { getGlobalBinder } from '@hyperbind-lib/core';
 *
 * const binder = getGlobalBinder();
 * ```
 */
export const getGlobalBinder = (): KeybindManager => {
  const cached = globalScope[BINDER_KEY];
  if (cached) return cached;

  const created = new KeybindManager({
    autoStart: globalScope[AUTO_START_FLAG] !== true,
  });
  globalScope[BINDER_KEY] = created;
  return created;
};

/**
 * グローバルなKeybindManagerインスタンス
 *
 * アプリケーション全体で共有されるキーバインドマネージャーです。
 * ブラウザ環境では自動的にkeydownイベントをリスンします。
 *
 * リスナーの着脱は`binder.start()` / `binder.stop()`で制御できます。
 * HMRやテストのクリーンアップでは`binder.stop()`（または`binder.destroy()`）を呼んでください。
 *
 * 自動リスン自体をオプトアウトしたい場合は、coreをimportする前に
 * `globalThis.__HYPERBIND_DISABLE_AUTO_START__ = true` を設定します。
 *
 * @example
 * ```typescript
 * import { binder } from '@hyperbind/core';
 *
 * binder.register('ctrl+s', () => {
 *   console.log('保存処理');
 * });
 *
 * // リスナーを解除する
 * binder.stop();
 * ```
 */
export const binder = getGlobalBinder();
