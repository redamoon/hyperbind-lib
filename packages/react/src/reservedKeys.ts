/**
 * 予約キーの定義は `@hyperbind-lib/core` に集約されています。
 * React / Vue で挙動が食い違わないよう、ここでは re-export のみを行います。
 *
 * @see packages/core/src/reservedKeys.ts
 */
export { RESERVED_KEYS, isReservedKey, getReservedKeyWarning } from "@hyperbind-lib/core";
