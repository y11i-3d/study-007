import { useStore } from "jotai";
import { useEffect, useMemo } from "react";
import { uniform } from "three/tsl";
import type { UniformNode } from "three/webgpu";
import type { DerivedAtom } from "./derivedAtoms";
import type { AnyUniformNode, NodeType, NodeTypeMap, Prettify } from "./types";

type UniformMap<T extends Record<string, DerivedAtom<NodeType>>> = Prettify<{
  [K in keyof T]: T[K] extends DerivedAtom<infer N extends NodeType>
    ? UniformNode<N, NodeTypeMap[N]>
    : never;
}>;

export const useAtomUniforms = <
  T extends Record<string, DerivedAtom<NodeType>>,
>(
  derivedAtoms: T,
): UniformMap<T> => {
  const store = useStore();

  const { uniforms, entries } = useMemo(() => {
    const uniforms: Record<string, AnyUniformNode> = {};
    const entries: Array<{ key: string; derived: DerivedAtom<NodeType> }> = [];

    for (const key in derivedAtoms) {
      const derived = derivedAtoms[key];
      const initialValue = store.get(derived.atom);

      uniforms[key] = uniform(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initialValue as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        derived.type as any,
      ) as AnyUniformNode;

      entries.push({ key, derived });
    }

    return { uniforms: uniforms as UniformMap<T>, entries };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const unsubs = entries.map(({ key, derived }) => {
      uniforms[key].value = store.get(derived.atom);
      return store.sub(derived.atom, () => {
        uniforms[key].value = store.get(derived.atom);
      });
    });

    return () => unsubs.forEach((u) => u());
  }, [store, uniforms, entries]);

  return uniforms;
};
