import type { ComputeNode } from "three/webgpu";
import { WebGPURenderer } from "three/webgpu";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * ComputeNode と関連する WebGL リソースを解放する。
 *
 * Three.js の WebGL フォールバックでは computeNode.dispose() だけでは
 * GL バッファ・transform feedback・VAO・シェーダープログラムが解放されない。
 * この関数はそれらを手動で解放するワークアラウンド。
 *
 * WebGPU モードでの動作は未検証だが、エラーは発生しない（Three.js v0.183 で確認）。
 */
export function disposeComputeNode(
  renderer: WebGPURenderer,
  computeNode: ComputeNode,
): void {
  const r = renderer as any;
  const backend = r.backend;
  const glCtx: WebGL2RenderingContext | null = backend?.gl ?? null;

  // dispose() 前に必要なデータを全て取得（dispose 後は消える）
  const pipelineData = r._pipelines?.get(computeNode);
  const pipeline = pipelineData?.pipeline;
  const glPipelineData = pipeline ? backend?.get(pipeline) : null;
  const programGPU: WebGLProgram | null = glPipelineData?.programGPU ?? null;
  const attachedShaders: WebGLShader[] =
    glCtx && programGPU ? (glCtx.getAttachedShaders(programGPU) ?? []) : [];

  // VAO キー用の baseId を収集
  const vaoBaseIds: string[] = (glPipelineData?.attributes ?? []).map(
    (attr: any) => {
      const d = backend?.get(attr);
      // DualAttributeData は baseId を持つ。通常の attributeData は id のみ
      return String(d?.baseId ?? d?.id ?? "");
    },
  );

  // transformBuffers: このコンピュートが使う全 DualAttributeData
  const transformBuffers: any[] = glPipelineData?.transformBuffers ?? [];

  computeNode.dispose();

  if (!glCtx) return;

  // GL program を削除（programGPU はパイプライン固有なので常に削除してよい）
  if (programGPU) glCtx.deleteProgram(programGPU);

  // シェーダーは stageCompute が共有されている場合があるため
  // dispose 後に usedTimes === 0 になった場合のみ削除する
  if (pipeline?.computeProgram?.usedTimes === 0) {
    for (const shader of attachedShaders) glCtx.deleteShader(shader);
  }

  // VAO を削除
  // DualAttributeData は |0 と |1 の両エントリを vaoCache に持つため baseId で両方を検索する
  // VAO キーは属性の id を連結した形（例: `:1|0:3|1`）なので includes で部分一致させる
  const vaoCache: Record<string, WebGLVertexArrayObject> = backend.vaoCache;
  const vaoKeysToDelete = new Set<string>();
  for (const baseId of vaoBaseIds) {
    for (const key of Object.keys(vaoCache)) {
      if (key.includes(`:${baseId}|0`) || key.includes(`:${baseId}|1`)) {
        vaoKeysToDelete.add(key);
      }
    }
  }
  for (const key of vaoKeysToDelete) {
    glCtx.deleteVertexArray(vaoCache[key]);
    delete vaoCache[key];
  }

  // transform feedback と GL バッファを削除
  const tfCache: Record<string, WebGLTransformFeedback> =
    backend?.transformFeedbackCache ?? {};
  for (const attributeData of transformBuffers) {
    // transform feedback キャッシュを削除（|0 と |1 の完全一致）
    if (attributeData?.baseId !== undefined) {
      const tfKey0 = `:${attributeData.baseId}|0`;
      const tfKey1 = `:${attributeData.baseId}|1`;
      for (const key of Object.keys(tfCache)) {
        if (key === tfKey0 || key === tfKey1) {
          glCtx.deleteTransformFeedback(tfCache[key]);
          delete tfCache[key];
        }
      }
    }

    // DualAttributeData: ping-pong の2つの GL バッファを両方削除
    if (attributeData?.buffers) {
      for (const glBuf of attributeData.buffers) {
        glCtx.deleteBuffer(glBuf);
      }
    }
  }
}
