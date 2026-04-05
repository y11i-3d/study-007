import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { Fn, instancedArray, instanceIndex, vec2 } from "three/tsl";
import type { ComputeNode, StorageBufferNode } from "three/webgpu";
import { WebGPURenderer } from "three/webgpu";
import "webgl-memory";
import { disposeComputeNode } from "../../scripts/three/utils/disposeComputeNode";

type WebGPURendererParameters = ConstructorParameters<typeof WebGPURenderer>[0];

/* eslint-disable @typescript-eslint/no-explicit-any */
function getWebGLMemoryMiB(renderer: WebGPURenderer): string {
  const gl: WebGL2RenderingContext | null =
    (renderer as any)?.backend?.gl ?? null;
  if (!gl) return "(WebGL context not found)";
  const ext = gl.getExtension("GMAN_webgl_memory") as any;
  if (!ext) return "(GMAN_webgl_memory not available)";
  const info = ext.getMemoryInfo();
  const mb = (info.memory.buffer / 1024 / 1024).toFixed(1);
  const r = info.resources;
  return `${mb}MB buf=${r.buffer} tf=${r.transformFeedback} vao=${r.vertexArray} prog=${r.program} shader=${r.shader} tex=${r.texture} rb=${r.renderbuffer} query=${r.query} sampler=${r.sampler} sync=${r.sync}`;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// シンプルな compute: buf[i] = vec2(i, 0)
const ComputeTest = ({ count }: { count: number }) => {
  const renderer = useThree().gl as unknown as WebGPURenderer;
  const bufRef = useRef<StorageBufferNode<"vec2"> | null>(null);
  const computeNodeRef = useRef<ComputeNode | null>(null);

  useEffect(() => {
    const buf = instancedArray(count, "vec2") as StorageBufferNode<"vec2">;
    const computeNode = Fn(() => {
      buf.element(instanceIndex).assign(vec2(instanceIndex.toFloat(), 0));
    })().compute(count);

    bufRef.current = buf;
    computeNodeRef.current = computeNode;

    console.log(
      `[repro] count=${count} created | mem: ${getWebGLMemoryMiB(renderer)}`,
    );

    return () => {
      disposeComputeNode(renderer, computeNode);
      console.log(
        `[repro] count=${count} disposed | mem: ${getWebGLMemoryMiB(renderer)}`,
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  useFrame(() => {
    const computeNode = computeNodeRef.current;
    if (!computeNode) return;
    renderer.compute(computeNode);
  });

  return null;
};

const Scene = ({ count }: { count: number }) => {
  return (
    <Canvas
      gl={async (props) => {
        const renderer = new WebGPURenderer(props as WebGPURendererParameters);
        await renderer.init();
        return renderer;
      }}
    >
      <ComputeTest count={count} />
    </Canvas>
  );
};

const COUNT_A = 10_000_000; // vec2 × 10M = 80MB
const COUNT_B = 15_000_000; // vec2 × 15M = 120MB

export const Repro = () => {
  const [count, setCount] = useState(COUNT_A);

  return (
    <div style={{ padding: "1rem" }}>
      <h2>WebGL compute repro</h2>
      <p>
        count: {count.toLocaleString()} (
        {((count * 8) / 1024 / 1024).toFixed(0)} MB)
      </p>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <button
          onClick={() => setCount((c) => (c === COUNT_A ? COUNT_B : COUNT_A))}
        >
          toggle A/B
        </button>
        <button onClick={() => setCount(COUNT_A)}>reset</button>
      </div>
      <p style={{ color: "#aaa", fontSize: "0.85rem" }}>
        toggle を押して buf を再生成し、メモリ増加を確認
      </p>
      <div style={{ width: "1px", height: "1px", overflow: "hidden" }}>
        <Scene count={count} />
      </div>
    </div>
  );
};
