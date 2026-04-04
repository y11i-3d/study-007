import type { Atom, PrimitiveAtom, WritableAtom } from "jotai";
import type {
  FolderSettings,
  InputOptions,
  ButtonSettings as LevaButtonSettings,
  NumberSettings,
} from "leva/plugin";
import type { Vector2, Vector3, Vector4 } from "three";

export type ButtonSettings = LevaButtonSettings & { label?: string };

export type Convert<T = unknown, U = T> = (v: T) => U;

export type StringSettings = {
  editable?: boolean;
  rows?: boolean | number;
};

export type OptionsSettings<T> = {
  options: T[] | Record<string, T>;
};

export type NumberSchemeSettings = NumberSettings &
  Omit<InputOptions, "onChange" | "transient">;

export type BooleanSchemeSettings = Omit<
  InputOptions,
  "onChange" | "transient"
>;

export type StringSchemeSettings = StringSettings &
  Omit<InputOptions, "onChange" | "transient">;

export type OptionsSchemeSettings<T> = OptionsSettings<T> &
  Omit<InputOptions, "onChange" | "transient">;

export type ColorSchemeSettings = Omit<InputOptions, "onChange" | "transient">;

// --- Helper functions ---

export const cNumber = (
  atom: PrimitiveAtom<number>,
  settings?: NumberSchemeSettings,
  write?: Convert<number>,
  read?: Convert<number>,
) => ({
  type: "number" as const,
  subscribable: true as const,
  atom,
  settings,
  write,
  read,
});

export const cBoolean = (
  atom: PrimitiveAtom<boolean>,
  settings?: BooleanSchemeSettings,
  write?: Convert<boolean>,
  read?: Convert<boolean>,
) => ({
  type: "boolean" as const,
  subscribable: true as const,
  atom,
  settings,
  write,
  read,
});

export const cString = (
  atom: Atom<string>,
  settings?: StringSchemeSettings,
  write?: Convert<string>,
  read?: Convert<string>,
) => ({
  type: "string" as const,
  subscribable: true as const,
  atom,
  settings,
  write,
  read,
});

export const cOptions = <T>(
  atom: PrimitiveAtom<T>,
  settings?: OptionsSchemeSettings<T>,
  write?: Convert<T>,
  read?: Convert<T>,
) => ({
  type: "options" as const,
  subscribable: true as const,
  atom,
  settings,
  write,
  read,
});

export const cColor = (
  atom: PrimitiveAtom<string>,
  settings?: ColorSchemeSettings,
  write?: Convert<string>,
  read?: Convert<string>,
) => ({
  type: "color" as const,
  subscribable: true as const,
  atom,
  settings,
  write,
  read,
});

export const cVec2 = (
  atom: PrimitiveAtom<Vector2>,
  settings?: NumberSchemeSettings[],
  write?: Convert<Vector2>,
  read?: Convert<Vector2>,
) => ({
  type: "vec2" as const,
  subscribable: true as const,
  atom,
  settings,
  write,
  read,
});

export const cVec3 = (
  atom: PrimitiveAtom<Vector3>,
  settings?: NumberSchemeSettings[],
  write?: Convert<Vector3>,
  read?: Convert<Vector3>,
) => ({
  type: "vec3" as const,
  subscribable: true as const,
  atom,
  settings,
  write,
  read,
});

export const cVec4 = (
  atom: PrimitiveAtom<Vector4>,
  settings?: NumberSchemeSettings[],
  write?: Convert<Vector4>,
  read?: Convert<Vector4>,
) => ({
  type: "vec4" as const,
  subscribable: true as const,
  atom,
  settings,
  write,
  read,
});

export const cBoolNum = <T extends number, F extends number>(
  atom: PrimitiveAtom<number>,
  truthy: T,
  falsy: F,
  settings?: NumberSchemeSettings,
  write?: Convert<boolean, T | F>,
  read?: Convert<T | F, boolean>,
) => ({
  type: "boolNum" as const,
  subscribable: true as const,
  atom,
  truthy,
  falsy,
  settings,
  write,
  read,
});

export const cButton = (onClick: () => void, settings?: ButtonSettings) => ({
  type: "button" as const,
  subscribable: false as const,
  onClick,
  settings,
});

export const cAction = (
  atom: WritableAtom<unknown, [], void>,
  settings?: ButtonSettings,
) => ({
  type: "action" as const,
  subscribable: false as const,
  atom,
  settings,
});

export const cLink = (
  url: string,
  target?: string,
  settings?: ButtonSettings,
) => ({
  type: "link" as const,
  subscribable: false as const,
  url,
  target,
  settings,
});

// --- Derived types ---

export type ControllerParams =
  | ReturnType<typeof cNumber>
  | ReturnType<typeof cBoolean>
  | ReturnType<typeof cString>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | ReturnType<typeof cOptions<any>>
  | ReturnType<typeof cColor>
  | ReturnType<typeof cVec2>
  | ReturnType<typeof cVec3>
  | ReturnType<typeof cVec4>
  | ReturnType<typeof cBoolNum>
  | ReturnType<typeof cButton>
  | ReturnType<typeof cAction>
  | ReturnType<typeof cLink>;

export interface CFolder {
  children: AtomControlParams;
  folderSettings?: FolderSettings;
}

export type AtomControlParams = Record<string, ControllerParams | CFolder>;

export const cFolder = (
  children: AtomControlParams,
  folderSettings?: FolderSettings,
): CFolder => ({
  children,
  folderSettings,
});
