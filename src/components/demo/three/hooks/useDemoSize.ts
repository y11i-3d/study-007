import { useThree } from "@react-three/fiber";
import { useStore } from "jotai";
import { Vector3 } from "three";
import { useDemoContext } from "../../hooks/useDemoContext";

const FILL = 0.667;

export const useDemoSize = () => {
  const store = useStore();

  const { size } = useThree();
  const { atoms, uniforms } = useDemoContext();

  uniforms.viewportSize.value.set(size.width, size.height);

  const x = size.width * FILL;
  const y = size.height * FILL;
  const z = x / y;

  store.set(atoms.blob.size, new Vector3(x, y, z));
  store.set(atoms.md, size.width < 768);
};
