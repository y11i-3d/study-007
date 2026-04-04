import { type WritableAtom } from "jotai";
import type { Store } from "jotai/vanilla/store";

export type AtomProxy<T> = {
  get value(): T;
  set value(v: T);
};

export function createAtomProxy<T>(
  store: Store,
  atom: WritableAtom<T, T[], void>,
): AtomProxy<T> {
  return {
    get value() {
      return store.get(atom);
    },
    set value(v: T) {
      store.set(atom, v);
    },
  };
}
