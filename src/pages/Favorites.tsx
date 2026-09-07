import type { FavoriteEntry } from "../types";
import { DownIcon, UpIcon } from "../components/icons";

export function Favorites({
  favorites,
  onOpenDetail,
  onRemove,
  onMove,
  onGoSearch,
}: {
  favorites: FavoriteEntry[];
  onOpenDetail: (entry: FavoriteEntry) => void;
  onRemove: (entry: FavoriteEntry) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onGoSearch: () => void;
}) {
  return (
    <div>
      <div className="header">
        <div className="title">お気に入り管理</div>
      </div>
      <div className="content">
        {favorites.length === 0 && (
          <div className="empty-state">
            お気に入りがまだ登録されていません。
            <br />
            検索から停留所を探して登録してください。
          </div>
        )}

        {favorites.length > 0 && (
          <div className="list">
            {favorites.map((fav, index) => (
              <div className="fav-listrow" key={`${fav.stop}__${fav.direction}`}>
                <div className="reorder-col">
                  <button
                    onClick={() => onMove(index, -1)}
                    disabled={index === 0}
                    aria-label="上へ"
                  >
                    <UpIcon size={14} />
                  </button>
                  <button
                    onClick={() => onMove(index, 1)}
                    disabled={index === favorites.length - 1}
                    aria-label="下へ"
                  >
                    <DownIcon size={14} />
                  </button>
                </div>
                <button className="listrow" style={{ border: "none", padding: 0, flex: 1 }} onClick={() => onOpenDetail(fav)}>
                  <div>
                    <div className="stopname" style={{ fontSize: 15 }}>{fav.stop}</div>
                    <div className="direction">→ {fav.direction}</div>
                  </div>
                </button>
                <button className="delbtn" onClick={() => onRemove(fav)} aria-label="削除">
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <button className="dashedbtn" onClick={onGoSearch}>
          ＋ 追加する
        </button>
      </div>
    </div>
  );
}
