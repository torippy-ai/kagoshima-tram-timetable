export type DayType = "平日" | "土曜" | "日祝";

export interface TimeEntry {
  /** "HH:MM" 形式（24時間表記） */
  time: string;
  /** 超低床電車かどうか */
  lowFloor: boolean;
}

export interface StopTimetable {
  stop: string;
  rosenId: string;
  directions: Record<string, Record<DayType, TimeEntry[]>>;
  /** データ取得日時（ISO文字列） */
  fetchedAt: string;
  /**
   * true の場合、実データではなく開発用のサンプルデータであることを示す。
   * 本番では GitHub Actions の定期スクレイピングで実データに置き換わる想定。
   */
  sample?: boolean;
}

export interface LineInfo {
  id: string;
  name: string;
  rosenId: string;
  stops: string[];
  /** 停留所一覧が公式サイトの bus_list.php で確認済みかどうか */
  verified: boolean;
}

export interface FavoriteEntry {
  stop: string;
  direction: string;
  rosenId: string;
}
