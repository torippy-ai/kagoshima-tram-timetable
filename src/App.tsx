import { useEffect, useState } from "react";
import type { FavoriteEntry } from "./types";
import { useFavorites } from "./lib/storage";
import { getDayType } from "./lib/time";
import { findLinesForStop } from "./lib/data";
import { BottomNav, type TabName } from "./components/BottomNav";
import { Home } from "./pages/Home";
import { Search } from "./pages/Search";
import { Detail } from "./pages/Detail";
import { Favorites } from "./pages/Favorites";

type Screen =
  | { name: "home" }
  | { name: "search" }
  | { name: "favorites" }
  | { name: "detail"; stop: string; direction?: string; from: TabName };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: "home" });
  const [now, setNow] = useState(() => new Date());
  const { favorites, isFavorite, toggleFavorite, removeFavorite, moveFavorite } = useFavorites();

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const dayType = getDayType(now);
  const activeTab: TabName = screen.name === "detail" ? screen.from : screen.name;

  const goDetailFromFavorite = (entry: FavoriteEntry) => {
    setScreen({ name: "detail", stop: entry.stop, direction: entry.direction, from: activeTab });
  };

  const goDetailFromSearch = (stop: string) => {
    setScreen({ name: "detail", stop, from: "search" });
  };

  return (
    <div className="app">
      {screen.name === "home" && (
        <Home
          favorites={favorites}
          now={now}
          dayType={dayType}
          onOpenDetail={goDetailFromFavorite}
          onGoSearch={() => setScreen({ name: "search" })}
        />
      )}

      {screen.name === "search" && <Search onOpenStop={(stop) => goDetailFromSearch(stop)} />}

      {screen.name === "favorites" && (
        <Favorites
          favorites={favorites}
          onOpenDetail={goDetailFromFavorite}
          onRemove={removeFavorite}
          onMove={moveFavorite}
          onGoSearch={() => setScreen({ name: "search" })}
        />
      )}

      {screen.name === "detail" && (
        <Detail
          stop={screen.stop}
          initialDirection={screen.direction}
          now={now}
          todayDayType={dayType}
          isFavorite={(direction) => {
            const line = findLinesForStop(screen.stop)[0];
            return isFavorite({ stop: screen.stop, direction, rosenId: line?.rosenId ?? "" });
          }}
          onToggleFavorite={(direction) => {
            const line = findLinesForStop(screen.stop)[0];
            toggleFavorite({ stop: screen.stop, direction, rosenId: line?.rosenId ?? "" });
          }}
          onBack={() => setScreen({ name: screen.from } as Screen)}
        />
      )}

      <BottomNav active={activeTab} onNavigate={(tab) => setScreen({ name: tab } as Screen)} />
    </div>
  );
}
