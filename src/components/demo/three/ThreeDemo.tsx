import { useFrame } from "@react-three/fiber";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useMemo, useRef } from "react";
import type { FnNode } from "three/src/nodes/tsl/TSLCore.js";
import {
  cos,
  float,
  Fn,
  If,
  instancedArray,
  instanceIndex,
  Loop,
  max,
  min,
  positionLocal,
  select,
  sin,
  TWO_PI,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
import type { Node, StorageBufferNode } from "three/webgpu";
import { WebGPURenderer } from "three/webgpu";
import { useDemoContext } from "../hooks/useDemoContext";
import { CONSTS } from "../hooks/useDemoStates";
import { useDemoSize } from "./hooks/useDemoSize";
import { useTSLDistortion } from "./hooks/useTSLDistortion";

export const ThreeDemo = () => {
  const { atoms, uniforms } = useDemoContext();
  useDemoSize();

  const setTextWidths = useSetAtom(atoms.textWidths);
  const setLeftXs = useSetAtom(atoms.leftXs);

  const distortion = useTSLDistortion();

  // --- TSL ノード（安定。マウント時に一度だけ作成） ---
  const { positionNode, colorNode, samplePosition } = useMemo(() => {
    const colorNode = vec4(0, 0, 0, 1);

    const positionNode = Fn(() => {
      const scale = distortion(positionLocal.x, positionLocal.y);
      const position = vec3(
        positionLocal.x.mul(uniforms.blob.size.x),
        positionLocal.y.mul(uniforms.blob.size.y),
        positionLocal.z,
      );
      return position.mul(scale);
    })();

    const samplePosition = Fn(([theta]: [Node<"float">]) => {
      const posLocal = vec2(cos(theta).mul(0.5), sin(theta).mul(0.5));
      const scale = distortion(posLocal.x, posLocal.y);
      const position = vec2(
        posLocal.x.mul(uniforms.blob.size.x),
        posLocal.y.mul(uniforms.blob.size.y),
      );
      return position.mul(scale);
    }) as ((theta: Node<"float"> | number) => Node<"vec2">) &
      FnNode<unknown[], Node>;

    return {
      positionNode,
      colorNode,
      samplePosition,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- コンピュートシェーダー（numRows が変わったときだけ再生成） ---
  const numRows = useAtomValue(atoms.rows.num);

  const { buf, computeNode } = useMemo(() => {
    const buf = instancedArray(numRows, "vec2");

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const computeNode = Fn(() => {
      const rowIdx = instanceIndex;
      const yCenter = uniforms.rows.startY.sub(
        rowIdx.toFloat().mul(uniforms.rows.lineHeight),
      );

      const yHalf = uniforms.rows.lineHeight.mul(0.5);
      const yMin = yCenter.sub(yHalf);
      const yMax = yCenter.add(yHalf);
      const upperThreshold = yCenter.add(uniforms.rows.insetY);
      const lowerThreshold = yCenter.sub(uniforms.rows.insetY);

      // パス1: 絶対左右端 + insetY ゾーンチェック
      const leftX0 = float(1e9).toVar();
      const rightX0 = float(-1e9).toVar();
      const hasUpperF = float(0).toVar();
      const hasLowerF = float(0).toVar();

      Loop(CONSTS.segments, ({ i }) => {
        const theta = float(i).div(CONSTS.segments).mul(TWO_PI);
        const p = samplePosition(theta);
        const py = p.y;

        const inBand = (py.greaterThanEqual(yMin) as any).and(
          py.lessThan(yMax),
        ) as Node<"bool">;
        If(inBand, () => {
          leftX0.assign(min(leftX0, p.x));
          rightX0.assign(max(rightX0, p.x));
        });
        If(py.greaterThanEqual(upperThreshold) as any, () => {
          hasUpperF.assign(float(1));
        });
        If(py.lessThanEqual(lowerThreshold) as any, () => {
          hasLowerF.assign(float(1));
        });
      });

      // パス2: 中央基準で内側境界を取得
      const cx0 = rightX0.add(leftX0).mul(0.5);
      const leftX = float(-1e9).toVar();
      const rightX = float(1e9).toVar();

      Loop(CONSTS.segments, ({ i }) => {
        const theta = float(i).div(CONSTS.segments).mul(TWO_PI);
        const p = samplePosition(theta);
        const py = p.y;
        const px = p.x;

        const inBand = (py.greaterThanEqual(yMin) as any).and(
          py.lessThan(yMax),
        ) as Node<"bool">;
        If(inBand, () => {
          If(px.lessThanEqual(cx0) as any, () => {
            leftX.assign(max(leftX, px));
          });
          If(px.greaterThanEqual(cx0) as any, () => {
            rightX.assign(min(rightX, px));
          });
        });
      });

      const zoneOff = uniforms.rows.insetY.lessThanEqual(float(0)) as any;
      const hasUpper = zoneOff.or(
        hasUpperF.greaterThan(float(0)),
      ) as Node<"bool">;
      const hasLower = zoneOff.or(
        hasLowerF.greaterThan(float(0)),
      ) as Node<"bool">;

      const hasSpan = (rightX0.greaterThan(leftX0) as any)
        .and(rightX.greaterThan(leftX))
        .and(hasUpper)
        .and(hasLower) as Node<"bool">;
      const cx = rightX.add(leftX).mul(0.5);
      const rawW = rightX.sub(leftX).sub(uniforms.rows.insetX.mul(2));
      const wideEnough = rawW.greaterThanEqual(uniforms.rows.minWidth) as any;
      const w = select(
        (hasSpan as any).and(wideEnough),
        max(rawW, float(0)),
        float(0),
      );
      const domLeft = select(
        hasSpan,
        cx.sub(w.mul(0.5)).add(uniforms.viewportSize.x.mul(0.5)),
        float(0),
      );
      buf.element(rowIdx).assign(vec2(domLeft, w));
    })().compute(numRows);
    /* eslint-enable @typescript-eslint/no-explicit-any */

    return { buf, computeNode };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numRows]);

  // --- GPU ディスパッチ＆読み取り ---
  const isReadingRef = useRef(false);

  // レンダー中（useFrame より前）に更新されるので、.then() 内で numRows の変化を検知できる
  const numRowsRef = useRef(numRows);
  numRowsRef.current = numRows;

  useEffect(() => {
    setTextWidths(null);
    setLeftXs(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numRows]);

  useFrame(({ gl }) => {
    if (isReadingRef.current) return;

    const dispatchedNumRows = numRowsRef.current;
    (gl as unknown as WebGPURenderer).compute(computeNode);

    isReadingRef.current = true;
    (gl as unknown as WebGPURenderer)
      .getArrayBufferAsync((buf as StorageBufferNode<"vec2">).value)
      .then((ab: ArrayBuffer) => {
        if (numRowsRef.current !== dispatchedNumRows) return;
        const interleaved = new Float32Array(ab);
        const n = interleaved.length / 2;
        const lxs = new Float32Array(n);
        const widths = new Float32Array(n);
        for (let i = 0; i < n; i++) {
          lxs[i] = interleaved[i * 2];
          widths[i] = interleaved[i * 2 + 1];
        }
        setLeftXs(lxs);
        setTextWidths(widths);
      })
      .catch(() => {})
      .finally(() => {
        isReadingRef.current = false;
      });
  });

  return (
    <mesh>
      <circleGeometry args={[0.5, CONSTS.segments]} />
      <meshBasicNodeMaterial
        transparent={true}
        colorNode={colorNode}
        positionNode={positionNode}
        key={positionNode.uuid}
      />
    </mesh>
  );
};
