import type { WritableAtom } from "jotai";
import { atom } from "jotai";

export function createSignalAtom(): WritableAtom<number, [], void> {
  const countAtom = atom(0);
  return atom(
    (get) => get(countAtom),
    (_get, set) => {
      set(countAtom, (c) => c + 1);
    },
  );
}
