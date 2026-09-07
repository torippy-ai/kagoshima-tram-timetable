import { useMemo, useState } from "react";
import { lines } from "../lib/data";
import { ChevronRightIcon, SearchIcon } from "../components/icons";

export function Search({
  onOpenStop,
}: {
  onOpenStop: (stop: string, rosenId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [lineFilter, setLineFilter] = useState<string>("all");

  const rows = useMemo(() => {
    type Row = { stop: string; lineNames: string[]; rosenId: string };
    const byStop = new Map<string, Row>();

    for (const line of lines) {
      if (lineFilter !== "all" && line.id !== lineFilter) continue;
      for (const stop of line.stops) {
        const existing = byStop.get(stop);
        if (existing) {
          existing.lineNames.push(line.name);
        } else {
          byStop.set(stop, { stop, lineNames: [line.name], rosenId: line.rosenId });
        }
      }
    }

    let result = Array.from(byStop.values());
    if (query.trim()) {
      result = result.filter((r) => r.stop.includes(query.trim()));
    }
    return result;
  }, [query, lineFilter]);

  return (
    <div>
      <div className="header">
        <div className="title">検索</div>
      </div>
      <div className="content">
        <label className="searchbox">
          <SearchIcon size={18} />
          <input
            type="text"
            placeholder="停留所名で検索"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>

        <div className="segrow">
          <button
            className={"pill" + (lineFilter === "all" ? " active" : "")}
            onClick={() => setLineFilter("all")}
          >
            全件
          </button>
          {lines.map((line) => (
            <button
              key={line.id}
              className={"pill" + (lineFilter === line.id ? " active" : "")}
              onClick={() => setLineFilter(line.id)}
            >
              {line.name.replace(/（.*）/, "")}
            </button>
          ))}
        </div>

        <div className="list">
          {rows.length === 0 && <div className="empty-state">該当する停留所が見つかりません</div>}
          {rows.map((row) => (
            <button
              key={row.stop}
              className="listrow"
              onClick={() => onOpenStop(row.stop, row.rosenId)}
            >
              <div>
                <span className="stopname" style={{ fontSize: 15, fontWeight: 600 }}>
                  {row.stop}
                </span>
                {row.lineNames.map((name) => (
                  <span key={name} className="linebadge">
                    {name.replace(/（.*）/, "")}
                  </span>
                ))}
              </div>
              <ChevronRightIcon className="chev" size={18} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
