/**
 * テスト用のキーボードイベント生成ヘルパー
 */
export interface KeyEventOptions {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  isComposing?: boolean;
}

/**
 * `cancelable: true` の keydown イベントを生成する。
 *
 * `isComposing` は環境によっては KeyboardEventInit 経由で反映されないため、
 * 生成後に値を検証し、必要なら defineProperty で強制的に上書きする。
 */
export function createKeyEvent(options: KeyEventOptions): KeyboardEvent {
  const {
    key,
    ctrlKey = false,
    metaKey = false,
    shiftKey = false,
    altKey = false,
    isComposing = false,
  } = options;

  const event = new KeyboardEvent("keydown", {
    key,
    ctrlKey,
    metaKey,
    shiftKey,
    altKey,
    isComposing,
    bubbles: true,
    cancelable: true,
  });

  if (event.isComposing !== isComposing) {
    Object.defineProperty(event, "isComposing", {
      value: isComposing,
      configurable: true,
    });
  }

  return event;
}
