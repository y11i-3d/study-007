import type { Atom, Getter } from "jotai";
import { atom } from "jotai";
import {
  Color,
  Matrix2,
  Matrix3,
  Matrix4,
  Vector2,
  Vector3,
  Vector4,
} from "three/webgpu";
import type { NodeType, NodeTypeMap } from "./types";

export type DerivedAtom<T extends NodeType> = {
  atom: Atom<NodeTypeMap[T]>;
  type: T;
};

function makeDerivedAtom<T extends NodeType>(
  type: T,
  read: (get: Getter) => NodeTypeMap[T],
): DerivedAtom<T> {
  return { atom: atom(read), type };
}

export const dFloat = (fn: (get: Getter) => number) =>
  makeDerivedAtom("float", fn);

export const dInt = (fn: (get: Getter) => number) => makeDerivedAtom("int", fn);

export const dUint = (fn: (get: Getter) => number) =>
  makeDerivedAtom("uint", fn);

export const dBool = (fn: (get: Getter) => boolean) =>
  makeDerivedAtom("bool", fn);

export const dVec2 = (fn: (get: Getter, vec2: Vector2) => void) => {
  const vec2 = new Vector2();
  return makeDerivedAtom("vec2", (get) => {
    fn(get, vec2);
    return vec2;
  });
};

export const dVec3 = (fn: (get: Getter, vec3: Vector3) => void) => {
  const vec3 = new Vector3();
  return makeDerivedAtom("vec3", (get) => {
    fn(get, vec3);
    return vec3;
  });
};

export const dVec4 = (fn: (get: Getter, vec4: Vector4) => void) => {
  const vec4 = new Vector4();
  return makeDerivedAtom("vec4", (get) => {
    fn(get, vec4);
    return vec4;
  });
};

export const dColor = (fn: (get: Getter, color: Color) => void) => {
  const color = new Color();
  return makeDerivedAtom("color", (get) => {
    fn(get, color);
    return color;
  });
};

export const dMat2 = (fn: (get: Getter, mat2: Matrix2) => void) => {
  const mat2 = new Matrix2();
  return makeDerivedAtom("mat2", (get) => {
    fn(get, mat2);
    return mat2;
  });
};

export const dMat3 = (fn: (get: Getter, mat3: Matrix3) => void) => {
  const mat3 = new Matrix3();
  return makeDerivedAtom("mat3", (get) => {
    fn(get, mat3);
    return mat3;
  });
};

export const dMat4 = (fn: (get: Getter, mat4: Matrix4) => void) => {
  const mat4 = new Matrix4();
  return makeDerivedAtom("mat4", (get) => {
    fn(get, mat4);
    return mat4;
  });
};
