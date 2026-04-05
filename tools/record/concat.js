import { execSync } from "child_process";
import { readdirSync, writeFileSync, unlinkSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { tmpdir } from "os";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const RECORDINGS = resolve(scriptDir, "recordings");

const files = readdirSync(RECORDINGS)
  .filter((f) => f.endsWith(".mp4") && !f.startsWith("concat_"))
  .sort()
  .map((f) => resolve(RECORDINGS, f));

if (files.length === 0) throw new Error("結合するmp4ファイルがありません");

const output = resolve(RECORDINGS, `concat_${Date.now()}.mp4`);
const concatList = resolve(tmpdir(), `concat_list_${Date.now()}.txt`);

writeFileSync(concatList, files.map((f) => `file '${f}'`).join("\n"));

try {
  execSync(`ffmpeg -f concat -safe 0 -i "${concatList}" -c copy "${output}"`, {
    stdio: "inherit",
  });
} finally {
  unlinkSync(concatList);
}

console.log(`完了: ${output}`);
