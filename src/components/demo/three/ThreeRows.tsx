import { useAtomValue } from "jotai";
import { vec4 } from "three/tsl";
import { useDemoContext } from "../hooks/useDemoContext";
import { CONSTS } from "../hooks/useDemoStates";

const COLOR = vec4(1, 1, 1, 0.2);

export const ThreeRows = () => {
  const { atoms } = useDemoContext();
  const visible = useAtomValue(atoms.rows.visible);
  const widths = useAtomValue(atoms.textWidths);
  const leftXs = useAtomValue(atoms.leftXs);
  const numRows = useAtomValue(atoms.rows.num);
  const startY = useAtomValue(atoms.rows.startY);
  const fontSize = useAtomValue(atoms.fontSize);

  if (!visible || !widths || numRows === 0) return null;

  return (
    <>
      {Array.from({ length: numRows }, (_, i) => {
        const w = widths[i];
        if (w <= 0) return null;
        const lineHeight = fontSize * CONSTS.lineHeightRatio;
        const y = startY - i * lineHeight;
        const lx = leftXs?.[i] ?? 0;
        const cx = lx - window.innerWidth / 2 + w / 2;
        return (
          <mesh key={i} position={[cx, y, 0.001]}>
            <planeGeometry args={[w, lineHeight]} />
            <meshBasicNodeMaterial
              colorNode={COLOR}
              transparent
              depthTest={false}
            />
          </mesh>
        );
      })}
    </>
  );
};
