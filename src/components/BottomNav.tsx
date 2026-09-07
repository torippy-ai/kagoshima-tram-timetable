import { HomeIcon, SearchIcon, StarIcon } from "./icons";

export type TabName = "home" | "search" | "favorites";

export function BottomNav({
  active,
  onNavigate,
}: {
  active: TabName;
  onNavigate: (tab: TabName) => void;
}) {
  const items: { key: TabName; label: string; icon: JSX.Element }[] = [
    { key: "home", label: "ホーム", icon: <HomeIcon /> },
    { key: "search", label: "検索", icon: <SearchIcon /> },
    { key: "favorites", label: "お気に入り", icon: <StarIcon /> },
  ];
  return (
    <nav className="navbar">
      {items.map((item) => (
        <button
          key={item.key}
          className={"navitem" + (active === item.key ? " active" : "")}
          onClick={() => onNavigate(item.key)}
          aria-current={active === item.key}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
