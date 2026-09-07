import holidayJp from "@holiday-jp/holiday_jp";
import type { DayType, TimeEntry } from "../types";

/** 日付から曜日区分（平日／土曜／日祝）を判定する。祝日判定には holiday_jp を用いる。 */
export function getDayType(date: Date): DayType {
  if (holidayJp.isHoliday(date) || date.getDay() === 0) return "日祝";
  if (date.getDay() === 6) return "土曜";
  return "平日";
}

export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function formatNowLabel(date: Date): string {
  const weekdayNames = ["日", "月", "火", "水", "木", "金", "土"];
  const w = weekdayNames[date.getDay()];
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${date.getMonth() + 1}/${date.getDate()}(${w}) ${hh}:${mm}`;
}

export interface UpcomingDeparture {
  entry: TimeEntry;
  minutesUntil: number;
}

/**
 * 発車時刻の一覧から、現在時刻以降の直近 n 件を返す。
 * 当日の運行がすでに終了している場合は空配列を返す。
 */
export function upcomingDepartures(
  entries: TimeEntry[],
  now: Date,
  count = 2
): UpcomingDeparture[] {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return entries
    .map((entry) => ({ entry, minutesUntil: parseTimeToMinutes(entry.time) - nowMinutes }))
    .filter((d) => d.minutesUntil >= 0)
    .sort((a, b) => a.minutesUntil - b.minutesUntil)
    .slice(0, count);
}

export function minutesUntilLabel(minutes: number): string {
  if (minutes <= 0) return "まもなく";
  return `あと${minutes}分`;
}
