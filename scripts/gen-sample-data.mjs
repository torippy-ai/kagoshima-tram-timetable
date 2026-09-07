// 開発用のサンプル時刻表データを生成するスクリプト。
// 本番のデータ取得（scripts/scrape.mjs）とは無関係で、実サイトへは一切アクセスしない。
// ローカル開発やビルド確認のために、それらしい時刻表データを機械的に作るだけのもの。
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "src", "data", "timetable");
mkdirSync(OUT_DIR, { recursive: true });

const ROSEN_1 = "1820,1821";

function pad(n) {
  return String(n).padStart(2, "0");
}

// 6:00〜23:xx の範囲で、時間帯ごとに間隔を変えたダイヤをそれっぽく生成する。
function genDay(seedOffset) {
  const entries = [];
  for (let h = 6; h <= 23; h++) {
    let interval;
    if (h <= 6 || h >= 22) interval = 20;
    else if (h >= 7 && h <= 9) interval = 8;
    else if (h >= 17 && h <= 19) interval = 8;
    else interval = 13;

    let m = (h * 7 + seedOffset) % interval;
    let i = 0;
    while (m < 60) {
      entries.push({
        time: `${pad(h)}:${pad(m)}`,
        lowFloor: (h + m + i + seedOffset) % 4 === 0,
      });
      m += interval;
      i++;
    }
  }
  return entries;
}

function genStop(stop, rosenId, directions) {
  const dirs = {};
  directions.forEach((dirName, di) => {
    dirs[dirName] = {
      "平日": genDay(di * 3 + 0),
      "土曜": genDay(di * 3 + 1),
      "日祝": genDay(di * 3 + 2),
    };
  });
  return {
    stop,
    rosenId,
    directions: dirs,
    fetchedAt: new Date().toISOString(),
    sample: true,
  };
}

const stops = [
  { stop: "鹿児島駅前", rosenId: ROSEN_1, directions: ["谷山方面"] },
  { stop: "天文館通", rosenId: ROSEN_1, directions: ["谷山方面", "鹿児島駅前方面"] },
  { stop: "郡元", rosenId: ROSEN_1, directions: ["谷山方面", "鹿児島駅前方面"] },
  { stop: "谷山", rosenId: ROSEN_1, directions: ["鹿児島駅前方面"] },
];

for (const s of stops) {
  const data = genStop(s.stop, s.rosenId, s.directions);
  const file = path.join(OUT_DIR, `${s.stop}.json`);
  writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf-8");
  console.log("wrote", file);
}
