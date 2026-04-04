import { psrdNoise3 } from "@y11i-3d/tsl-psrdnoise";
import { useMemo } from "react";
import type { FnNode } from "three/src/nodes/tsl/TSLCore.js";
import { float, Fn, pow, time, vec3 } from "three/tsl";
import type { Node } from "three/webgpu";
import { useDemoContext } from "../../hooks/useDemoContext";

export const useTSLDistortion = () => {
  const { uniforms } = useDemoContext();

  return useMemo(() => {
    return Fn(([x, y]: [Node<"float">, Node<"float">]) => {
      const noisePos = vec3(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        x.mul(uniforms.blob.size.z as any),
        y,
        time.mul(uniforms.blob.speed).add(uniforms.random),
      ).mul(vec3(uniforms.blob.freq, float(1)));
      return pow(2, psrdNoise3(noisePos).mul(uniforms.blob.scaleExp));
    }) as ((
      x: Node<"float"> | number,
      y: Node<"float"> | number,
    ) => Node<"float">) &
      FnNode<unknown[], Node>;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
