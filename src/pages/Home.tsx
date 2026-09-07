import type { DayType, FavoriteEntry } from "../types";
import { getTimetable } from "../lib/data";
import { formatNowLabel, minutesUntilLabel, upcomingDepartures } from "../lib/time";
import { ChevronRightIcon } from "../components/icons";

export function Home({
  favorites,
  now,
  dayType,
  onOpenDetail,
  onGoSearch,
}: {
  favorites: FavoriteEntry[];
  now: Date;
  dayType: DayType;
  onOpenDetail: (entry: FavoriteEntry) => void;
  onGoSearch: () => void;
}) {
  return (
    <div>
      <div className="header">
        <div className="title">鹿児島市電</div>
        <div className="dateinfo">
          {formatNowLabel(now)}
          <span className="badge">{dayType}</span>
        </div>
      </div>
      <div className="content">
        <div className="sectionlabel">お気に入り</div>

        {favorites.length === 0 && (
          <div className="empty-state">
            お気に入りがまだ登録されていません。
            <br />
            検索から停留所を探して登録してください。
          </div>
        )}

        {favorites.map((fav) => {
          const timetable = getTimetable(fav.stop);
          const entries = timetable?.directions[fav.direction]?.[dayType];

          return (
            <button
              key={`${fav.stop}__${fav.direction}`}
              className="card tappable"
              onClick={() => onOpenDetail(fav)}
            >
              <div className="row">
                <div>
                  <span className="stopname">{fav.stop}</span>
                </div>
                <ChevronRightIcon className="chev" />
              </div>
              <div className="direction">→ {fav.direction}</div>

              {!timetable && <div className="muted-note">時刻表データがありません</div>}

              {timetable && entries && entries.length > 0 && (
                <NextDepartureRows entries={entries} now={now} />
              )}

              {timetable && entries && entries.length === 0 && (
                <div className="muted-note">本日の運行は終了しました</div>
              )}
            </button>
          );
        })}

        <button className="dashedbtn" onClick={onGoSearch}>
          ＋ お気に入りを追加
        </button>
      </div>
    </div>
  );
}

function NextDepartureRows({
  entries,
  now,
}: {
  entries: { time: string; lowFloor: boolean }[];
  now: Date;
}) {
  const upcoming = upcomingDepartures(entries, now, 2);

  if (upcoming.length === 0) {
    return <div className="muted-note">本日の運行は終了しました</div>;
  }

  const [next, nextNext] = upcoming;
  return (
    <>
      <div className="nextrow">
        <div className="nextbig">{minutesUntilLabel(next.minutesUntil)}</div>
        <div className="nextsub">{next.entry.time}発</div>
      </div>
      {nextNext && (
        <div className="nextsub">
          次 {nextNext.entry.time}発（{minutesUntilLabel(nextNext.minutesUntil)}）
        </div>
      )}
    </>
  );
}
