import { useCallback, useEffect, useState } from "react";
import type { FavoriteEntry } from "../types";

const KEY = "kagoshima-tram-favorites";

function load(): FavoriteEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    // プライベートブラウジング等で localStorage が使えない場合は空扱いにする
    return [];
  }
}

function save(favorites: FavoriteEntry[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(favorites));
  } catch {
    // 保存に失敗しても致命的ではないため無視する
  }
}

function sameEntry(a: FavoriteEntry, b: FavoriteEntry) {
  return a.stop === b.stop && a.direction === b.direction && a.rosenId === b.rosenId;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteEntry[]>(() => load());

  useEffect(() => {
    save(favorites);
  }, [favorites]);

  const isFavorite = useCallback(
    (entry: FavoriteEntry) => favorites.some((f) => sameEntry(f, entry)),
    [favorites]
  );

  const addFavorite = useCallback((entry: FavoriteEntry) => {
    setFavorites((prev) => (prev.some((f) => sameEntry(f, entry)) ? prev : [...prev, entry]));
  }, []);

  const removeFavorite = useCallback((entry: FavoriteEntry) => {
    setFavorites((prev) => prev.filter((f) => !sameEntry(f, entry)));
  }, []);

  const toggleFavorite = useCallback((entry: FavoriteEntry) => {
    setFavorites((prev) =>
      prev.some((f) => sameEntry(f, entry))
        ? prev.filter((f) => !sameEntry(f, entry))
        : [...prev, entry]
    );
  }, []);

  const moveFavorite = useCallback((index: number, direction: -1 | 1) => {
    setFavorites((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);

  return { favorites, isFavorite, addFavorite, removeFavorite, toggleFavorite, moveFavorite };
}
