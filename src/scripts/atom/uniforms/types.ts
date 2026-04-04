import type {
  Color,
  Matrix2,
  Matrix3,
  Matrix4,
  UniformNode,
  Vector2,
  Vector3,
  Vector4,
} from "three/webgpu";

export type NodeTypeMap = {
  float: number;
  int: number;
  uint: number;
  bool: boolean;
  vec2: Vector2;
  vec3: Vector3;
  vec4: Vector4;
  color: Color;
  mat2: Matrix2;
  mat3: Matrix3;
  mat4: Matrix4;
};

export type NodeType = keyof NodeTypeMap;

export type AnyUniformNode = {
  [K in NodeType]: UniformNode<K, NodeTypeMap[K]>;
}[NodeType];

export type Prettify<T> = { [K in keyof T]: T[K] } & {};
