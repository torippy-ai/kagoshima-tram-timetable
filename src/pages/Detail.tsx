import { useMemo, useState } from "react";
import type { DayType, TimeEntry } from "../types";
import { getTimetable } from "../lib/data";
import { parseTimeToMinutes } from "../lib/time";
import { ChevronLeftIcon, StarIcon } from "../components/icons";

const DAY_TYPES: DayType[] = ["平日", "土曜", "日祝"];

export function Detail({
  stop,
  initialDirection,
  now,
  todayDayType,
  isFavorite,
  onToggleFavorite,
  onBack,
}: {
  stop: string;
  initialDirection?: string;
  now: Date;
  todayDayType: DayType;
  isFavorite: (direction: string) => boolean;
  onToggleFavorite: (direction: string) => void;
  onBack: () => void;
}) {
  const timetable = getTimetable(stop);
  const directionNames = timetable ? Object.keys(timetable.directions) : [];

  const [direction, setDirection] = useState(
    initialDirection && directionNames.includes(initialDirection)
      ? initialDirection
      : directionNames[0]
  );
  const [dayType, setDayType] = useState<DayType>(todayDayType);

  const entries: TimeEntry[] = timetable?.directions[direction]?.[dayType] ?? [];
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const isToday = dayType === todayDayType;

  const hourGroups = useMemo(() => {
    const groups = new Map<number, TimeEntry[]>();
    for (const entry of entries) {
      const hour = Number(entry.time.split(":")[0]);
      if (!groups.has(hour)) groups.set(hour, []);
      groups.get(hour)!.push(entry);
    }
    return Array.from(groups.entries()).sort((a, b) => a[0] - b[0]);
  }, [entries]);

  const nextTime = useMemo(() => {
    if (!isToday) return null;
    const upcoming = entries
      .map((e) => parseTimeToMinutes(e.time))
      .filter((m) => m >= nowMinutes)
      .sort((a, b) => a - b);
    return upcoming[0] ?? null;
  }, [entries, isToday, nowMinutes]);

  return (
    <div>
      <div className="header">
        <button className="iconbtn" onClick={onBack} aria-label="戻る">
          <ChevronLeftIcon />
        </button>
        <div className="title">{stop}</div>
        {direction && (
          <button
            className="iconbtn"
            onClick={() => onToggleFavorite(direction)}
            aria-label="お気に入り切り替え"
          >
            <StarIcon filled={isFavorite(direction)} />
          </button>
        )}
      </div>

      {!timetable && (
        <div className="content">
          <div className="empty-state">
            この停留所の時刻表データがまだありません。
            <br />
            （サンプルデータ未登録、または今後のデータ取得を待っています）
          </div>
        </div>
      )}

      {timetable && (
        <>
          <div className="subrow">
            {directionNames.map((name) => (
              <button
                key={name}
                className={"subtab" + (name === direction ? " active" : "")}
                onClick={() => setDirection(name)}
              >
                {name}
              </button>
            ))}
          </div>
          <div className="daytabrow">
            {DAY_TYPES.map((dt) => (
              <button
                key={dt}
                className={"daytab" + (dt === dayType ? " active" : "")}
                onClick={() => setDayType(dt)}
              >
                {dt}
                {dt === todayDayType ? "（本日）" : ""}
              </button>
            ))}
          </div>
          <div className="content">
            {hourGroups.length === 0 && (
              <div className="empty-state">この方面・曜日区分の時刻表データがありません</div>
            )}
            {hourGroups.map(([hour, mins]) => (
              <div className="hourrow" key={hour}>
                <div className="hournum">{hour}</div>
                <div className="mins">
                  {mins.map((m) => {
                    const minutes = parseTimeToMinutes(m.time);
                    const isNext = isToday && nextTime === minutes;
                    return (
                      <span key={m.time} className={isNext ? "now" : ""}>
                        {m.time.split(":")[1]}
                        {m.lowFloor ? "*" : ""}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="legend">
              ＊は超低床電車です。
              {isToday && "青色は現在時刻からの次発です。"}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
