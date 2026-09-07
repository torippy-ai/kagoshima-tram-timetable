import type { LineInfo, StopTimetable } from "../types";
import linesJson from "../data/lines.json";

export const lines: LineInfo[] = linesJson as LineInfo[];

// data/timetable/ 以下の全 JSON をビルド時に取り込む。
// ファイル名（拡張子なし）が停留所名になっている。
const timetableModules = import.meta.glob("../data/timetable/*.json", { eager: true }) as Record<
  string,
  { default: StopTimetable }
>;

const timetableByStop = new Map<string, StopTimetable>();
for (const path in timetableModules) {
  const match = path.match(/([^/]+)\.json$/);
  if (!match) continue;
  const stopName = decodeURIComponent(match[1]);
  timetableByStop.set(stopName, timetableModules[path].default);
}

export function getTimetable(stop: string): StopTimetable | undefined {
  return timetableByStop.get(stop);
}

export function hasTimetable(stop: string): boolean {
  return timetableByStop.has(stop);
}

export function findLineByRosenId(rosenId: string): LineInfo | undefined {
  return lines.find((l) => l.rosenId === rosenId);
}

/** ある停留所がどの系統に含まれるかを調べる（複数系統にまたがる場合は全て返す） */
export function findLinesForStop(stop: string): LineInfo[] {
  return lines.filter((l) => l.stops.includes(stop));
}
