import { extend, useThree } from "@react-three/fiber";
import { useSetAtom } from "jotai";
import { useEffect } from "react";
import type { WebGPURenderer } from "three/webgpu";
import * as THREE_WEBGPU from "three/webgpu";
import { useDemoContext } from "../hooks/useDemoContext";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
extend(THREE_WEBGPU as any);

type WebGPURendererWithBackend = WebGPURenderer & {
  backend: { isWebGPUBackend: boolean };
};

export const ThreeSetup = () => {
  const { atoms } = useDemoContext();
  const gl = useThree().gl as unknown as WebGPURendererWithBackend;
  const setRendererLabel = useSetAtom(atoms.rendererLabel);

  useEffect(() => {
    setRendererLabel(gl.backend.isWebGPUBackend === true ? "WebGPU" : "WebGL");
  }, [gl, setRendererLabel]);

  return null;
};
