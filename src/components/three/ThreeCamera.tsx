import {
  OrthographicCamera,
  type OrthographicCameraProps,
} from "@react-three/drei";

type ThreeCameraProps = Omit<
  OrthographicCameraProps,
  "position" | "makeDefault"
>;

export const ThreeCamera = ({ ...props }: ThreeCameraProps) => {
  return <OrthographicCamera makeDefault position={[0, 0, 1]} {...props} />;
};
