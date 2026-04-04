import type { ThreeToJSXElements } from "@react-three/fiber";
import type * as THREE_WEBGPU from "three/webgpu";

declare module "@react-three/fiber" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface ThreeElements extends ThreeToJSXElements<typeof THREE_WEBGPU> {}
}
