import { OrthographicCamera } from "@react-three/drei";
import { useThree } from "@react-three/fiber";

export const ThreeCamera = () => {
  const { size } = useThree();

  return (
    <OrthographicCamera
      makeDefault
      position={[0, 0, 1]}
      left={-size.width / 2}
      right={size.width / 2}
      top={size.height / 2}
      bottom={-size.height / 2}
    />
  );
};
