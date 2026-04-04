/* eslint-disable react-hooks/immutability */

import { useThree } from "@react-three/fiber";
import { psrdNoise3 } from "@y11i-3d/tsl-psrdnoise";
import { useEffect, useMemo } from "react";
import { Vector2, Vector3 } from "three";
import { positionLocal, pow, time, uniform, vec3, vec4 } from "three/tsl";

const ASPECT = 16 / 9;
const FILL = 0.75;

export const ThreeDemo = () => {
  const { viewport } = useThree();

  const { positionNode, colorNode, uniforms } = useMemo(() => {
    const uniforms = {
      size: uniform(new Vector3(0, 0, 0)),
      freq: uniform(new Vector2(0.5, 1)),
      speed: uniform(1),
      scale: uniform(0.5),
    };

    const colorNode = vec4(0, 0, 0, 1);

    const positionNode = (() => {
      const noise = psrdNoise3(
        vec3(positionLocal.x.mul(uniforms.size.z), positionLocal.y, time).mul(
          vec3(uniforms.freq, uniforms.speed),
        ),
      );
      const scale = pow(2, noise.mul(uniforms.scale));

      const position = vec3(
        positionLocal.x.mul(uniforms.size.x),
        positionLocal.y.mul(uniforms.size.y),
        positionLocal.z,
      );

      return position.mul(scale);
    })();

    return {
      positionNode,
      colorNode,
      uniforms,
    };
  }, []);

  useEffect(() => {
    const base = Math.min(viewport.width, viewport.height) * FILL;
    const isLandscape = viewport.width / viewport.height > ASPECT;
    uniforms.size.value.x = isLandscape ? base * ASPECT : base;
    uniforms.size.value.y = isLandscape ? base : base / ASPECT;
    uniforms.size.value.z = uniforms.size.value.x / uniforms.size.value.y;
  }, [uniforms, viewport.width, viewport.height]);

  return (
    <mesh>
      <circleGeometry args={[0.5, 512]} />
      <meshBasicNodeMaterial
        colorNode={colorNode}
        positionNode={positionNode}
        key={positionNode.uuid}
      />
    </mesh>
  );
};
