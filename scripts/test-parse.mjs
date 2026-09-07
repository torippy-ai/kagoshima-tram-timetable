// scrape.mjs のパース関数を、公式サイトへ実際にアクセスせずに検証するテスト。
// 実際のページ構造を完全に再現したものではないが、想定される
// マークアップのバリエーション（時刻と低床マークが同じテキストノードか、
// 別要素かなど）に対してステートマシンが正しく動くことを確認する。
import assert from "node:assert/strict";
import { parseStopList, parseTimetable } from "./scrape.mjs";

// --- parseStopList ---
{
  const html = `
    <table>
      <a href="time_table.php?rosenId=1820,1821&amp;name=%E9%B9%BF%E5%85%90%E5%B3%B6%E9%A7%85%E5%89%8D&amp;syubetuId=1">鹿児島駅前</a>
      <a href="time_table.php?rosenId=1820,1821&amp;name=%E5%A4%A9%E6%96%87%E9%A4%A8%E9%80%9A&amp;syubetuId=1">天文館通</a>
      <a href="time_table.php?rosenId=1820,1821&amp;name=%E8%B0%B7%E5%B1%B1&amp;syubetuId=1">谷山</a>
    </table>`;
  const stops = parseStopList(html);
  assert.deepEqual(stops, ["鹿児島駅前", "天文館通", "谷山"]);
  console.log("OK: parseStopList - 基本ケース");
}

// --- parseTimetable: 列位置で方面が決まる基本ケース ---
{
  const html = `
    <html><body><main><article>
      <table>
        <tr><td>路線図など無関係な外側テーブル</td></tr>
      </table>
      <table>
        <tr><td>谷山行き</td><td>鹿児島駅前行き</td></tr>
        <tr><td>平日</td><td>平日</td></tr>
        <tr><td>07:05</td><td>07:10</td></tr>
        <tr><td>07:20※</td><td>07:25</td></tr>
        <tr><td>土曜</td><td>土曜</td></tr>
        <tr><td>08:00</td><td>08:05</td></tr>
      </table>
    </article></main></body></html>`;
  const result = parseTimetable(html, "天文館通", "1820,1821");
  assert.deepEqual(result.directions["谷山行き"]["平日"], [
    { time: "07:05", lowFloor: false },
    { time: "07:20", lowFloor: true },
  ]);
  assert.deepEqual(result.directions["鹿児島駅前行き"]["平日"], [
    { time: "07:10", lowFloor: false },
    { time: "07:25", lowFloor: false },
  ]);
  assert.deepEqual(result.directions["谷山行き"]["土曜"], [{ time: "08:00", lowFloor: false }]);
  console.log("OK: parseTimetable - 列位置による方面の割り当て");
}

// --- parseTimetable: 曜日区分の見出しが1セルのみ（コルスパン相当）のケース ---
{
  const html = `
    <html><body><main><article>
      <table>
        <tr><td>谷山行き</td></tr>
        <tr><td>日曜・祝日</td></tr>
        <tr><td>09:15※</td></tr>
        <tr><td>09:30</td></tr>
      </table>
    </article></main></body></html>`;
  const result = parseTimetable(html, "郡元", "1820,1821");
  assert.deepEqual(result.directions["谷山行き"]["日祝"], [
    { time: "09:15", lowFloor: true },
    { time: "09:30", lowFloor: false },
  ]);
  console.log("OK: parseTimetable - 単一セルの曜日区分見出し");
}

console.log("すべてのテストに成功しました。");
