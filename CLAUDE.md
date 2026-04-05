# Project Overview

Three.js R3F + TSL デモプロジェクト。Astro + React + Three.js (R3F) で構成される。

## プロジェクト方針

- 技術や表現の深堀りが目的。技術的に実現可能かどうかの限界まで挑戦する
- 難易度や複雑さを理由に代替案へ誘導しない。一切の妥協は禁止
- 現状のコードだけを根拠にスケールダウンしない。今動けばいい実装ではなく、将来的に汎用的に使える設計にする
- ユーザーが納得するまで議論に付き合う。勝手に結論を出さない
- TSL / WebGPU は情報が少ない領域。APIについて憶測で回答せず、型定義やソースコードを確認する

## Tech Stack

- **Astro**: SSG フレームワーク (ページ生成・レイアウト)
- **React 19**: UI コンポーネント (`client:only="react"` でクライアントサイド実行)
- **Three.js 0.183**: WebGPU レンダラー + TSL (Three.js Shading Language)
- **@react-three/fiber**: React × Three.js 統合
- **Jotai**: 状態管理
- **Leva**: リアルタイムコントロール UI パネル
- **Tailwind CSS v4**: スタイリング

## Directory Structure

```
src/
├── pages/            # Astro ページ (SSG エントリーポイント)
├── layouts/          # HTML テンプレート (メタ・OGP・フォント)
├── components/
│   ├── common/       # 共有 UI (タイトル, GitHub バッジ, キーボード操作)
│   └── three/        # Three.js コンポーネント群
│       ├── Three.tsx         # Canvas + WebGPURenderer セットアップ
│       ├── ThreeProvider.tsx # React Context (atoms + uniforms 提供)
│       ├── ThreeSetup.tsx    # レンダラー初期設定
│       ├── ThreeCamera.tsx   # カメラ
│       ├── ThreeDemo.tsx     # デモシーン
│       └── hooks/
│           └── useDemoStates.ts  # 状態定義 (atoms + uniforms + controls)
├── scripts/          # ビジネスロジックを含まないユーティリティ
│   ├── atom/         # Jotai ベースのユーティリティ
│   │   ├── controls/     # Leva UI ↔ Jotai atom 双方向同期
│   │   ├── uniforms/     # Jotai atom → Three.js TSL uniform 変換
│   │   └── misc/         # その他
│   └── three/        # Three.js ユーティリティ
│       └── utils/    # 汎用ヘルパー関数
├── styles/           # Tailwind CSS
└── types/            # 型定義 (WebGPU JSX 拡張, Vite env)
```

## Architecture: Atom / Uniform / Leva 連携

このプロジェクトの中核は、Jotai atom・Three.js TSL uniform・Leva UI の3つを連携させる仕組み。

```
Leva UI パネル ←→ Jotai Atom (状態の大元) ←→ Three.js TSL UniformNode
                        ↑                              ↓
                  useAtomControls()              useAtomUniforms()
                  (双方向同期)                  (atom 変更 → uniform.value 自動反映)
```

### Jotai Atom

`useDemoStates.ts` で `atom()` により状態を定義。これが Leva と Uniform 双方の接続点になる。

### Uniform (`scripts/atom/uniforms/`)

- `dFloat()`, `dVec3()` 等で atom に Three.js 型情報 (`"float"`, `"vec3"` 等) を付与した DerivedAtom を作成
- `useAtomUniforms()` が DerivedAtom → TSL `uniform()` を生成し、`store.sub()` で atom 変更時に `uniform.value` を自動同期

### Leva (`scripts/atom/controls/`)

- `cNumber()`, `cString()`, `cOptions()`, `cAction()`, `cFolder()` 等のヘルパーで Leva スキーマを型安全に構築
- `useAtomControls()` が Leva パネル ↔ Jotai atom の双方向同期を実行

### Context 配信 (`ThreeProvider.tsx`)

`useDemoStates()` の返値 (atoms, uniforms) を React Context で子コンポーネントに提供。`useThreeContext()` でアクセス。

## R3F で WebGPU / TSL を使うためのセットアップ

R3F はデフォルトで WebGLRenderer を使うため、WebGPURenderer + TSL を使うには3箇所の対応が必要。

### 1. Canvas の `gl` prop で WebGPURenderer を生成 (`Three.tsx`)

```tsx
<Canvas
  gl={async (props) => {
    const renderer = new WebGPURenderer(props as WebGPURendererParameters);
    await renderer.init();
    return renderer;
  }}
  dpr={[1, 2]}
/>
```

### 2. `three/webgpu` のクラスを R3F に登録 (`ThreeSetup.tsx`)

R3F の JSX (`<mesh>`, `<meshBasicNodeMaterial>` 等) は `extend()` で登録されたクラスから生成される。WebGPU 版のクラスで上書きする必要がある。

```tsx
import * as THREE_WEBGPU from "three/webgpu";
extend(THREE_WEBGPU as any);
```

### 3. JSX 型定義の拡張 (`types/three-jsx.d.ts`)

上記 `extend()` だけでは TypeScript の型が認識されないため、型定義も拡張する。

```tsx
import type { ThreeToJSXElements } from "@react-three/fiber";
import type * as THREE_WEBGPU from "three/webgpu";

declare module "@react-three/fiber" {
  interface ThreeElements extends ThreeToJSXElements<typeof THREE_WEBGPU> {}
}
```

## Deploy

GitHub Actions → GitHub Pages (`deploy.yml`)

## Recording

`tools/record/` にブラウザキャプチャ用のツールがある（WSL + Windows 専用）。

- `npm run record` — Chrome のコンテンツ領域を ddagrab (DXGI) でキャプチャして `tools/record/recordings/` に保存。オプション：`--crop=T:R:B:L`、`--duration=秒`、`--bitrate=レート`、`--screenshot`
- `npm run concat` — `recordings/` 内の mp4 をタイムスタンプ順に結合して1本の mp4 を生成
