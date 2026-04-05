import { execSync, spawn } from "child_process";
import { mkdirSync } from "fs";
import { dirname, resolve } from "path";
import { createInterface } from "readline";
import { fileURLToPath } from "url";

// --- 設定 ---
const FPS = 30;
// -----------

const missing = ["powershell.exe", "ffmpeg.exe", "wslpath"].filter((cmd) => {
  try {
    execSync(`which ${cmd}`, { stdio: "ignore" });
    return false;
  } catch {
    return true;
  }
});
if (missing.length > 0) {
  throw new Error(
    `以下のコマンドが見つかりません: ${missing.join(", ")}\nWSL + Windows環境が必要です。`,
  );
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(scriptDir, "recordings");
mkdirSync(OUTPUT_DIR, { recursive: true });

// get_chrome_info.ps1 でコンテンツ領域・モニター情報を取得
const ps1Dir = scriptDir;
const ps1Linux = resolve(ps1Dir, "get_chrome_info.ps1");
execSync(`cp "${ps1Linux}" /mnt/c/Windows/Temp/get_chrome_info.ps1`);

const info = execSync(
  `powershell.exe -ExecutionPolicy Bypass -File "C:\\Windows\\Temp\\get_chrome_info.ps1"`,
)
  .toString()
  .trim()
  .split("\n")
  .map((l) => l.trim().replace(/\r/, ""));

const [contentX, contentY, contentW, contentH] = info
  .find((l) => l.startsWith("content"))
  .split(/\s+/)
  .slice(1)
  .map(Number);

const monitors = info
  .filter((l) => l.startsWith("monitor"))
  .map((l) => {
    const [, idx, left, top, right, bottom] = l.split(/\s+/).map(Number);
    return { idx, left, top, right, bottom };
  });

const monitor = monitors.find(
  (m) =>
    contentX >= m.left &&
    contentX < m.right &&
    contentY >= m.top &&
    contentY < m.bottom,
);

if (!monitor) throw new Error("Chromeのコンテンツ領域が見つかりませんでした");

const offsetX = contentX - monitor.left;
const offsetY = contentY - monitor.top;

console.log(
  `キャプチャ: ${monitor.idx + 1}枚目のモニター / 位置 (${offsetX}, ${offsetY}) / サイズ ${contentW}x${contentH}`,
);

const rl = createInterface({ input: process.stdin, output: process.stdout });
const waitEnter = (msg) =>
  new Promise((resolve) => {
    process.stdout.write(msg);
    rl.once("line", resolve);
  });

// --crop=top:right:bottom:left (CSS順)
const cropArg = process.argv.find((a) => a.startsWith("--crop="));
const [cropT, cropR, cropB, cropL] = cropArg
  ? cropArg.slice(7).split(":").map(Number)
  : [0, 0, 0, 0];

const cropW = `floor((iw-${cropL + cropR})/2)*2`;
const cropH = `floor((ih-${cropT + cropB})/2)*2`;
const cropFilter = `crop=${cropW}:${cropH}:${cropL}:${cropT}`;

const screenshot = process.argv.includes("--screenshot");
const durationArg = process.argv.find((a) => a.startsWith("--duration="));
const duration = durationArg ? Number(durationArg.slice(11)) : null;
const bitrateArg = process.argv.find((a) => a.startsWith("--bitrate="));
const bitrate = bitrateArg ? bitrateArg.slice(10) : "4000k";

const outputLinux = resolve(
  OUTPUT_DIR,
  `${Date.now()}.${screenshot ? "png" : "mp4"}`,
);
const outputWin = execSync(`wslpath -w "${outputLinux}"`).toString().trim();

await waitEnter(`Enterで${screenshot ? "撮影" : "録画開始"}...`);

const ddagrab = [
  `ddagrab=output_idx=${monitor.idx}`,
  `offset_x=${offsetX}`,
  `offset_y=${offsetY}`,
  `video_size=${contentW}x${contentH}`,
  `framerate=${FPS}`,
].join(":");

const ffmpegArgs = screenshot
  ? [
      "-filter_complex",
      `${ddagrab},hwdownload,format=bgra,${cropFilter}`,
      "-frames:v",
      "1",
      "-y",
      outputWin,
    ]
  : [
      "-filter_complex",
      `${ddagrab},hwdownload,format=bgra,${cropFilter}`,
      ...(duration ? ["-t", String(duration)] : []),
      "-c:v",
      "libx264",
      "-b:v",
      bitrate,
      "-y",
      outputWin,
    ];

const ffmpeg = spawn("ffmpeg.exe", ffmpegArgs, {
  stdio: ["pipe", "inherit", "inherit"],
});

ffmpeg.on("close", () => {
  console.log(`\n完了: ${outputLinux}`);
});

if (screenshot || duration) {
  rl.close();
} else {
  await waitEnter("Enterで録画終了...");
  rl.close();
  ffmpeg.stdin.end("q");
}
