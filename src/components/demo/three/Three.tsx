import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";
import { WebGPURenderer } from "three/webgpu";
import { TextOverlay } from "../dom/TextOverlay";
import { DemoProvider } from "../DemoProvider";
import { ThreeCamera } from "./ThreeCamera";
import { ThreeDemo } from "./ThreeDemo";
import { ThreeRows } from "./ThreeRows";
import { ThreeSetup } from "./ThreeSetup";

type WebGPURendererParameters = ConstructorParameters<typeof WebGPURenderer>[0];

export const Three = () => {
  return (
    <DemoProvider>
      <div className="h-dvh w-screen">
        <Canvas
          gl={async (props) => {
            const renderer = new WebGPURenderer(
              props as WebGPURendererParameters,
            );
            await renderer.init();
            return renderer;
          }}
          dpr={[1, 2]}
        >
          <ThreeSetup />
          <ThreeCamera />
          <ThreeDemo />
          <ThreeRows />
        </Canvas>
        <TextOverlay />
        <div className="in-[html.hide-controls]:hidden in-[html.hide-ui]:hidden">
          <Leva collapsed={false} />
        </div>
      </div>
    </DemoProvider>
  );
};
