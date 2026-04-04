import { atom } from "jotai";
import type { PrimitiveAtom } from "jotai";

// ---- 型定義 ----

type HasMethods<T> = [
  {
    [K in keyof T]: T[K] extends (...args: unknown[]) => unknown ? true : never;
  }[keyof T],
] extends [never]
  ? false
  : true;

type IsPlainObject<T> =
  T extends Record<string, unknown>
    ? T extends ((...args: unknown[]) => unknown) | unknown[]
      ? false
      : HasMethods<T> extends true
        ? false
        : true
    : false;

export type AtomifyObj<T> = {
  [K in keyof T]: IsPlainObject<T[K]> extends true
    ? AtomifyObj<T[K]>
    : PrimitiveAtom<T[K]>;
};

export type FilterObj<T> = {
  [K in keyof T]?: IsPlainObject<T[K]> extends true
    ? FilterObj<T[K]> | boolean
    : boolean;
};

// ---- ランタイムユーティリティ ----

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

function hasTrue(filter: Record<string, unknown>): boolean {
  for (const val of Object.values(filter)) {
    if (val === true) return true;
    if (isPlainObject(val) && hasTrue(val)) return true;
  }
  return false;
}

// ---- 内部再帰関数 ----

function objToAtomInternal(
  obj: Record<string, unknown>,
  filter: Record<string, unknown> | undefined,
  mode: "include" | "exclude",
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    const filterVal = filter?.[key];

    if (mode === "exclude" && filterVal === false) continue;
    if (mode === "include" && (filterVal === undefined || filterVal === false))
      continue;

    if (isPlainObject(value)) {
      if (mode === "include" && filterVal === true) {
        // filterVal === true → サブツリー全体を含める（フィルタなし）
        result[key] = objToAtomInternal(value, undefined, "exclude");
      } else {
        const subFilter = isPlainObject(filterVal) ? filterVal : undefined;
        result[key] = objToAtomInternal(value, subFilter, mode);
      }
    } else {
      result[key] = atom(value);
    }
  }
  return result;
}

// ---- エクスポート ----

export function objToAtom<T extends Record<string, unknown>>(
  obj: T,
  filter?: FilterObj<T>,
): AtomifyObj<T> {
  const rawFilter = filter as Record<string, unknown> | undefined;
  const mode =
    rawFilter !== undefined && hasTrue(rawFilter) ? "include" : "exclude";
  return objToAtomInternal(obj, rawFilter, mode) as AtomifyObj<T>;
}
