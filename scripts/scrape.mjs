#!/usr/bin/env node
// 鹿児島市電の時刻表データを、公式サイトの時刻検索システムから取得して
// src/data/lines.json と src/data/timetable/*.json を更新するスクリプト。
//
// 実行前提:
// - 個人的な利用・非営利目的での利用に限る（公式サイトのサイトポリシーに基づく）。
// - サイトへの負荷を避けるため、リクエストの間隔を空けて実行する。
// - このスクリプトはこのプロジェクトが動作するサンドボックス環境からは
//   外部ネットワークアクセスが制限されているため実行できず、GitHub Actions
//   などネットワークが開いている環境で初めて動作確認できる。ページの実際の
//   HTML構造から「方面ラベル」「曜日区分ラベル」「HH:MM形式の時刻」を
//   文書順に読み取っていくヒューリスティックな実装のため、初回実行時に
//   出力内容を必ず目視確認し、想定と違う場合はパース処理を調整すること。
//
// 使い方: npm run scrape

import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import * as cheerio from "cheerio";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT, "src", "data");
const TIMETABLE_DIR = path.join(DATA_DIR, "timetable");
const LINES_JSON_PATH = path.join(DATA_DIR, "lines.json");

const BASE = "https://www.kotsu-city-kagoshima.jp/wp/timesearch/";
const SYUBETU_ID = "1"; // 市電（路面電車）
const USER_AGENT =
  "KagoshimaTramTimetableApp/0.1 (personal, non-commercial use; contact: repository owner)";

const DAY_TYPE_ALIASES = [
  { pattern: /日曜|祝日|日祝/, value: "日祝" },
  { pattern: /土曜/, value: "土曜" },
  { pattern: /平日/, value: "平日" },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchHtml(url) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.text();
}

/** bus_list.php を解析して、系統に属する停留所名を順番どおりに取得する。 */
function parseStopList(html) {
  const $ = cheerio.load(html);
  const stops = [];
  $('a[href*="time_table.php"]').each((_, el) => {
    const name = $(el).text().trim();
    if (name && !stops.includes(name)) stops.push(name);
  });
  return stops;
}

/**
 * time_table.php を解析する。
 *
 * ページは「方面（○○行き）」の見出しと「曜日区分（平日／土曜／日曜・祝日）」の見出しが
 * 時刻セルより前に出現する構造になっているため、DOM を文書順に走査しながら
 * 直近に見た方面・曜日区分を覚えておき、HH:MM 形式のテキストが見つかるたびに
 * その方面・曜日区分の配列へ追加する、という単純なステートマシンで読み取る。
 * テーブルの行・列構造そのものには依存しないため、多少のマークアップの違いに強い。
 */
const TIME_RE = /^(\d{1,2}:\d{2})\s*(※)?$/;
const DIRECTION_RE = /^(.+行き)$/;

/**
 * 時刻表本体のテーブルを特定する。
 * ページには路線図用の外側テーブルの中に、実際の時刻表テーブルが
 * ネストされている構造が確認できたため、「○○行き」という見出しセルを
 * 含む行を持つテーブルを時刻表テーブルとみなす。見つからない場合は
 * フォールバックとして、最初の行のセル数が最も多いテーブルを使う。
 */
function findTimetableTable($, container) {
  const tables = container.find("table").toArray();
  for (const tbl of tables) {
    const hasDirectionHeader = $(tbl)
      .find("tr")
      .toArray()
      .some((tr) =>
        $(tr)
          .find("td,th")
          .toArray()
          .some((cell) => DIRECTION_RE.test($(cell).text().trim()))
      );
    if (hasDirectionHeader) return tbl;
  }

  let best = null;
  let maxCols = 0;
  for (const tbl of tables) {
    const cols = $(tbl).find("tr").first().find("td,th").length;
    if (cols > maxCols) {
      maxCols = cols;
      best = tbl;
    }
  }
  return best;
}

/**
 * time_table.php を解析する。
 *
 * 実際のページ（2026年9月に初回実行して確認）は、「方面（○○行き）」の見出しセルが
 * colspan で複数列（曜日区分の数ぶん）にまたがり、その下の行に曜日区分
 * （平日／土曜／日曜・祝日）の見出しが列ごとに並ぶ、という2段見出しの表になっている
 * ケースがある（例: 谷山行き（3列）｜鹿児島駅前行き（3列） の下に 平日|土曜|日祝|平日|土曜|日祝）。
 * 一方で、方面の見出し列数がそのまま曜日区分の列数と一致し、曜日区分の切り替えが
 * 行単位（同じ曜日区分の値が全列に並ぶ見出し行が時刻データ行の間に挟まる）で
 * 表現されているページも存在する。
 *
 * どちらの構造にも対応できるよう、見出し行は colspan を考慮して列インデックスに
 * 展開し、「列ごとの方面」と「列ごとの曜日区分」を別々に管理する。曜日区分の見出し行の
 * 全セルが同じ値であれば行単位の切り替えとして機能し、列ごとに異なれば2段見出しとして
 * 機能する（同じロジックで両方のケースを表現できる）。
 */
function parseTimetable(html, stop, rosenId) {
  const $ = cheerio.load(html);
  const directions = {};
  const container = $("main article").length ? $("main article") : $("body");

  const table = findTimetableTable($, container);
  if (!table) {
    return { stop, rosenId, directions, fetchedAt: new Date().toISOString() };
  }

  // colspan を考慮して、見出し行のセルを列インデックスに展開する。
  function expandRowByColspan(tr) {
    const cols = [];
    $(tr)
      .find("td,th")
      .each((_, cell) => {
        const $cell = $(cell);
        const text = $cell.text().trim();
        const colspan = parseInt($cell.attr("colspan"), 10) || 1;
        for (let i = 0; i < colspan; i++) cols.push(text);
      });
    return cols;
  }

  let columnDirections = []; // 列インデックス → 方面名（colspan展開済み）
  let columnDayTypes = []; // 列インデックス → 曜日区分（colspan展開済み）
  let haveDirections = false;
  let haveDayTypes = false;

  $(table)
    .find("tr")
    .each((_, tr) => {
      const cells = $(tr)
        .find("td,th")
        .toArray()
        .map((cell) => $(cell).text().trim());
      if (cells.length === 0 || cells.every((c) => !c)) return;

      // 見出し行（方面）
      if (cells.some((c) => DIRECTION_RE.test(c))) {
        const expanded = expandRowByColspan(tr);
        columnDirections = expanded.map((text) => {
          const m = text.match(DIRECTION_RE);
          return m ? m[1] : null;
        });
        for (const d of columnDirections) {
          if (d && !directions[d]) directions[d] = { "平日": [], "土曜": [], "日祝": [] };
        }
        haveDirections = true;
        return;
      }

      // 見出し行（曜日区分）: セルのほぼ全てが曜日区分ラベルの場合、見出し行とみなす
      const dayMatches = cells.map((c) => DAY_TYPE_ALIASES.find((a) => a.pattern.test(c)));
      const nonEmptyCells = cells.filter((c) => c);
      if (
        nonEmptyCells.length > 0 &&
        dayMatches.filter(Boolean).length === nonEmptyCells.length
      ) {
        const expanded = expandRowByColspan(tr);
        columnDayTypes = expanded.map((text) => {
          const found = DAY_TYPE_ALIASES.find((a) => a.pattern.test(text));
          return found ? found.value : null;
        });
        haveDayTypes = true;
        return;
      }

      // データ行（時刻）
      if (!haveDirections || !haveDayTypes) return;
      cells.forEach((cellText, i) => {
        // 列ごとの方面配列・曜日区分配列と、時刻データ行の列数がずれる場合
        // （見出し行の colspan 展開結果とデータ行の実セル数が一致しないケース）に備えて、
        // 配列長がデータ行より短ければ、同じ値の並びを繰り返して補う。
        const direction =
          columnDirections[i % Math.max(columnDirections.length, 1)] ?? null;
        const dayType = columnDayTypes[i % Math.max(columnDayTypes.length, 1)] ?? null;
        if (!direction || !dayType) return;
        const timeMatch = cellText.match(TIME_RE);
        if (!timeMatch) return;
        const [h, m] = timeMatch[1].split(":");
        if (!directions[direction]) directions[direction] = { "平日": [], "土曜": [], "日祝": [] };
        directions[direction][dayType].push({
          time: `${h.padStart(2, "0")}:${m}`,
          lowFloor: Boolean(timeMatch[2]),
        });
      });
    });

  return {
    stop,
    rosenId,
    directions,
    fetchedAt: new Date().toISOString(),
  };
}

async function main() {
  const lines = JSON.parse(readFileSync(LINES_JSON_PATH, "utf-8"));
  mkdirSync(TIMETABLE_DIR, { recursive: true });

  // 1. 各系統の停留所一覧を取得して lines.json を更新する
  for (const line of lines) {
    const url = `${BASE}bus_list.php?rosenId=${encodeURIComponent(line.rosenId)}&syubetuId=${SYUBETU_ID}`;
    try {
      const html = await fetchHtml(url);
      const stops = parseStopList(html);
      if (stops.length > 0) {
        line.stops = stops;
        line.verified = true;
        console.log(`[stops] ${line.name}: ${stops.length}件`);
      } else {
        console.warn(`[stops] ${line.name}: 0件しか取得できませんでした。既存データを維持します。`);
      }
    } catch (err) {
      console.error(`[stops] ${line.name} の取得に失敗しました:`, err.message);
    }
    await sleep(1500);
  }
  writeFileSync(LINES_JSON_PATH, JSON.stringify(lines, null, 2) + "\n", "utf-8");

  // 2. 全系統・全停留所ぶんの停留所名を重複なく集め、それぞれ時刻表を取得する
  const stopToRosenIds = new Map();
  for (const line of lines) {
    for (const stop of line.stops) {
      if (!stopToRosenIds.has(stop)) stopToRosenIds.set(stop, []);
      stopToRosenIds.get(stop).push(line.rosenId);
    }
  }

  let okCount = 0;
  let ngCount = 0;

  for (const [stop, rosenIds] of stopToRosenIds) {
    // 複数系統にまたがる停留所は、それぞれの系統の rosenId で取得し、
    // 方面（○○行き）ごとにまとめて 1 ファイルに統合する。
    // 同じ方面・同じ時刻の重複はまとめ、時刻順に並べ替える
    // （以前は Object.assign で方面ごと丸ごと上書きしてしまい、複数系統が
    // 乗り入れる停留所でデータが失われるバグがあったため、時刻単位でマージする）。
    const merged = { stop, rosenId: rosenIds[0], directions: {}, fetchedAt: new Date().toISOString() };
    let anySuccess = false;

    for (const rosenId of rosenIds) {
      const url = `${BASE}time_table.php?rosenId=${encodeURIComponent(rosenId)}&name=${encodeURIComponent(
        stop
      )}&syubetuId=${SYUBETU_ID}`;
      try {
        const html = await fetchHtml(url);
        const parsed = parseTimetable(html, stop, rosenId);
        for (const [direction, dayMap] of Object.entries(parsed.directions)) {
          if (!merged.directions[direction]) {
            merged.directions[direction] = { "平日": [], "土曜": [], "日祝": [] };
          }
          for (const dayType of ["平日", "土曜", "日祝"]) {
            const existingTimes = new Set(merged.directions[direction][dayType].map((e) => e.time));
            for (const entry of dayMap[dayType] || []) {
              if (!existingTimes.has(entry.time)) {
                merged.directions[direction][dayType].push(entry);
                existingTimes.add(entry.time);
              }
            }
          }
        }
        anySuccess = true;
      } catch (err) {
        console.error(`[timetable] ${stop} (rosenId=${rosenId}) の取得に失敗しました:`, err.message);
      }
      await sleep(1500);
    }

    // 時刻順に並べ替える
    for (const dayMap of Object.values(merged.directions)) {
      for (const dayType of ["平日", "土曜", "日祝"]) {
        dayMap[dayType].sort((a, b) => a.time.localeCompare(b.time));
      }
    }

    if (anySuccess && Object.keys(merged.directions).length > 0) {
      const file = path.join(TIMETABLE_DIR, `${stop}.json`);
      writeFileSync(file, JSON.stringify(merged, null, 2) + "\n", "utf-8");
      okCount++;
    } else {
      console.warn(`[timetable] ${stop}: 有効なデータを取得できなかったため、既存ファイルを維持します。`);
      ngCount++;
    }
  }

  console.log(`完了: 成功 ${okCount}件 / 失敗・スキップ ${ngCount}件`);
  if (ngCount > 0) {
    console.log("失敗した停留所があります。既存データは維持されているので、次回の定期実行で再取得されます。");
  }
}

// このファイルが直接実行された場合のみ main() を実行する
// （テストスクリプトからパース関数だけを import できるようにするため）。
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}

export { parseStopList, parseTimetable };
