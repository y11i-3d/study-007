import type { Atom } from "jotai";
import { useStore } from "jotai";
import type { Store } from "jotai/vanilla/store";
import { button, folder, levaStore, useControls } from "leva";
import type { Schema } from "leva/plugin";
import { useEffect } from "react";
import type { Vector2, Vector3, Vector4 } from "three";
import type {
  AtomControlParams,
  CFolder,
  ControllerParams,
  Convert,
} from "./params";

type SubscribableParams = Extract<ControllerParams, { subscribable: true }>;

type SchemaItemWithOptions = Schema[string];

const axes = ["x", "y", "z", "w"] as const;
type Axis = (typeof axes)[number];
type AnyVector = Record<Axis, number>;

const isCFolder = (v: ControllerParams | CFolder): v is CFolder =>
  "children" in v;

const getLevaValues = (
  key: string,
  p: ControllerParams,
  store: Store,
): Record<string, unknown> => {
  if (!p.subscribable) return {};

  const raw = store.get(p.atom);

  switch (p.type) {
    case "vec2":
    case "vec3":
    case "vec4": {
      const v = (
        p.read ? p.read(raw as Vector2 & Vector3 & Vector4) : raw
      ) as AnyVector;
      const result: Record<string, unknown> = {};
      axes.forEach((axis, i) => {
        if (!(axis in v)) return;
        const s = p.settings?.[Math.min(i, (p.settings?.length ?? 1) - 1)];
        if (s) result[`${key}_${axis}`] = v[axis];
      });
      return result;
    }
    case "boolNum": {
      return {
        [key]: p.read ? p.read(raw as number) : raw === p.truthy,
      };
    }
    default: {
      return { [key]: p.read ? (p.read as Convert)(raw) : raw };
    }
  }
};

const buildSchemaItems = (
  key: string,
  p: ControllerParams,
  store: Store,
): Record<string, SchemaItemWithOptions> => {
  const values = getLevaValues(key, p, store);

  const toButton = (
    onClick: () => void,
    settings?: import("./params").ButtonSettings,
  ) => {
    const { label, ...rest } = settings ?? {};
    const item = button(onClick, rest) as SchemaItemWithOptions;
    if (label) (item as Record<string, unknown>).label = label;
    return { [key]: item };
  };

  if (p.type === "button") return toButton(p.onClick, p.settings);
  if (p.type === "action") return toButton(() => store.set(p.atom), p.settings);
  if (p.type === "link")
    return toButton(() => window.open(p.url, p.target ?? "_blank"), p.settings);

  const result: Record<string, SchemaItemWithOptions> = {};
  for (const [vKey, vVal] of Object.entries(values)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const item: any =
      p.type === "string" ? { type: "STRING", value: vVal } : { value: vVal };

    if (p.type === "vec2" || p.type === "vec3" || p.type === "vec4") {
      const axis = vKey.split("_").pop() as Axis;
      const axisIndex = axes.indexOf(axis);
      const settings =
        p.settings?.[Math.min(axisIndex, (p.settings?.length ?? 1) - 1)];
      Object.assign(item, settings);
      item.onChange = (v: number, _path: string, ctx: { initial: boolean }) => {
        if (ctx.initial) return;
        const stored = store.get(p.atom as Atom<Vector2 | Vector3 | Vector4>);
        const display = (
          p.read
            ? p.read(stored as Vector2 & Vector3 & Vector4)
            : stored.clone()
        ) as AnyVector;
        display[axis] = v;
        store.set(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          p.atom as any,
          p.write ? p.write(display as Vector2 & Vector3 & Vector4) : display,
        );
      };
    } else {
      Object.assign(item, p.settings);
      const isReadOnly = !("write" in p.atom);
      if (!isReadOnly) {
        item.onChange = (
          v: unknown,
          _path: string,
          ctx: { initial: boolean },
        ) => {
          if (ctx.initial) return;
          if (p.type === "boolNum") {
            const bp = p as ReturnType<typeof import("./params").cBoolNum>;
            const next = bp.write
              ? bp.write(v as boolean)
              : v
                ? bp.truthy
                : bp.falsy;
            store.set(bp.atom, next);
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const next = p.write ? (p.write as any)(v) : v;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            store.set(p.atom as any, next);
          }
        };
      }
    }
    result[vKey] = item as SchemaItemWithOptions;
  }
  return result;
};

const buildSchema = (params: AtomControlParams, store: Store) => {
  const schema: Record<string, SchemaItemWithOptions> = {};
  for (const [key, value] of Object.entries(params)) {
    if (isCFolder(value)) {
      schema[key] = folder(
        buildSchema(value.children, store),
        value.folderSettings ?? {},
      );
    } else {
      Object.assign(schema, buildSchemaItems(key, value, store));
    }
  }
  return schema;
};

const collectAtoms = (
  params: AtomControlParams,
): [string, SubscribableParams][] => {
  const result: [string, SubscribableParams][] = [];
  for (const [key, value] of Object.entries(params)) {
    if (isCFolder(value)) result.push(...collectAtoms(value.children));
    else if (value.subscribable) {
      result.push([key, value]);
    }
  }
  return result;
};

type TransformEntry =
  | { path: string; atom: Atom<number>; axis: undefined }
  | { path: string; atom: Atom<AnyVector>; axis: Axis };

const collectTransformEntries = (
  params: AtomControlParams,
  prefix = "",
): TransformEntry[] => {
  const result: TransformEntry[] = [];
  for (const [key, value] of Object.entries(params)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (isCFolder(value)) {
      result.push(...collectTransformEntries(value.children, path));
    } else if (value.type === "number" && (value.write || value.read)) {
      result.push({ path, atom: value.atom as Atom<number>, axis: undefined });
    } else if (
      (value.type === "vec2" ||
        value.type === "vec3" ||
        value.type === "vec4") &&
      (value.write || value.read)
    ) {
      const axisCount =
        value.type === "vec2" ? 2 : value.type === "vec3" ? 3 : 4;
      axes.slice(0, axisCount).forEach((axis) => {
        result.push({
          path: `${path}_${axis}`,
          atom: value.atom as Atom<AnyVector>,
          axis,
        });
      });
    }
  }
  return result;
};

export const useAtomControls = (params: AtomControlParams) => {
  const store = useStore();
  const [, set] = useControls(() => buildSchema(params, store));

  useEffect(() => {
    const unsubs = collectAtoms(params).map(([key, controller]) => {
      const atom = controller.atom;
      const sync = () =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        set(getLevaValues(key, controller, store) as Record<string, any>);
      const unsub = store.sub(atom, sync);
      sync();
      return unsub;
    });
    return () => unsubs.forEach((unsub) => unsub());
  }, [params, store, set]);

  useEffect(() => {
    const entries = collectTransformEntries(params);
    const overlays = new Map<string, HTMLInputElement>();
    const cleanups: (() => void)[] = [];

    const applyAll = () => {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          // CSS変数注入
          for (const { path } of entries) {
            const input = document.getElementById(path);
            const rangeGrid = input?.parentElement?.parentElement;
            if (rangeGrid) {
              rangeGrid.style.setProperty("--leva-colors-accent1", "#be185d"); // pink-700
              rangeGrid.style.setProperty("--leva-colors-accent2", "#db2777"); // pink-600
              rangeGrid.style.setProperty("--leva-colors-accent3", "#ec4899"); // pink-500
            }
          }

          // overlay
          for (const { path, atom, axis } of entries) {
            const input = document.getElementById(path);
            const rangeGrid = input?.parentElement?.parentElement;
            const inputContainer = input?.parentElement;

            if (!rangeGrid || !inputContainer) continue;

            // 初回のみ作成
            if (!overlays.has(path)) {
              const overlay = document.createElement("input");
              overlay.type = "text";
              overlay.readOnly = true;
              overlay.style.position = "absolute";
              overlay.style.inset = "0";
              overlay.style.display = "block";
              overlay.style.width = `${input.offsetWidth}px`;
              overlay.style.textAlign = "right";
              overlay.style.background = "var(--leva-colors-elevation3)";
              overlay.style.color = "var(--leva-colors-highlight3)";
              overlay.style.border = "none";
              overlay.style.outline = "none";
              overlay.style.font = "inherit";
              overlay.style.fontSize = "inherit";
              overlay.style.padding = "0 var(--leva-space-sm)";
              inputContainer.style.position = "relative";
              inputContainer.appendChild(overlay);
              overlays.set(path, overlay);
              cleanups.push(() => overlay.remove());

              // ラベルクリックでトグル
              const label = document.querySelector(`label[for="${path}"]`);
              if (label) {
                const handler = () => {
                  const ov = overlays.get(path);
                  if (ov)
                    ov.style.display =
                      ov.style.display === "none" ? "block" : "none";
                };
                label.addEventListener("click", handler);
                cleanups.push(() =>
                  label.removeEventListener("click", handler),
                );
              }
            }

            // 値を更新
            const overlay = overlays.get(path);
            if (overlay) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const raw = store.get(atom as Atom<any>);
              overlay.value = String(
                axis !== undefined ? (raw as AnyVector)[axis] : raw,
              );
            }
          }
        }),
      );
    };

    applyAll();
    const unsub = levaStore.useStore.subscribe(applyAll);

    return () => {
      unsub();
      cleanups.forEach((f) => f());
    };
  }, [params, store]);
};
