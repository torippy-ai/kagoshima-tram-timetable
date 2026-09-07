# 鹿児島市電 時刻表アプリ

鹿児島市電（鹿児島市交通局）の次発案内・時刻表を確認できる、個人利用向けのPWA（スマートフォンのホーム画面に追加できるWebアプリ）です。

要件定義・詳細設計の内容は別途お渡しした設計ドキュメントを参照してください。このリポジトリはその設計に基づく実装（MVP）です。

## できること

- ホーム画面でお気に入り登録した停留所の「次発」「次々発」をすぐ確認できる
- 停留所名・系統から時刻表を検索できる
- 停留所の時刻表を、方面・曜日区分（平日／土曜／日祝）ごとに確認できる（祝日判定込み）
- お気に入りの登録・削除・並び替え（端末内保存）
- ホーム画面に追加してオフラインでも直近のデータを表示できる（PWA）

## ローカルでの動かし方

```bash
npm install
npm run dev
```

`http://localhost:5173` を開くと確認できます。

## データについて（重要）

`src/data/timetable/` 以下の時刻表データは、**現時点ではダミーのサンプルデータ**です（各ファイルに `"sample": true` と入っています）。鹿児島市電はGTFS等のオープンデータが公開されておらず、公式サイトの時刻検索ページ（HTML）から取得するしかないため、`scripts/scrape.mjs` というデータ取得スクリプトを用意しています。

```bash
npm run scrape
```

このスクリプトは公式サイト（`kotsu-city-kagoshima.jp`）に実際にアクセスして、`src/data/lines.json`（系統・停留所一覧）と `src/data/timetable/*.json`（停留所ごとの時刻表）を更新します。**今回このスクリプトを開発した環境からは外部サイトへのアクセスができなかったため、実際に動かして出力を確認することができていません。** GitHub Actions（後述のワークフロー）などネットワークが使える環境で最初に実行したら、生成されたJSONの中身を一度目視で確認し、想定と違っていたら `scripts/scrape.mjs` の `parseTimetable` 関数を調整してください（時刻・方面・曜日区分の読み取りロジックにコメントを書いてあります）。

`node scripts/test-parse.mjs` で、パース処理そのものの単体テスト（ネットワーク不要）を実行できます。

### 既知の制限

- 公式サイトの利用規約により、取得したデータの利用は個人的・非営利目的の範囲にとどめてください。
- 1系統以外（2系統・出入庫便/直通便）の停留所一覧は、公式サイトのルート説明文から拾った概要リストで、`bus_list.php` による完全な確認はまだできていません（`lines.json` の `verified` が `false` になっています）。`npm run scrape` を実行すると自動的に検証・更新されます。
- 複数の系統が通る停留所（鹿児島駅前、郡元など）は、系統ごとにファイルを分けず、方面（○○行き）単位で1つのJSONにまとめる設計にしています。
- 曜日区分の祝日判定には `@holiday-jp/holiday_jp` を使っていますが、臨時ダイヤ（年末年始等）には対応していません。

## GitHub Pagesへの公開手順

1. GitHubで新しいリポジトリを作成する（例: `kagoshima-tram-timetable`）。リポジトリ名をこれと変える場合は `vite.config.ts` の `REPO_NAME` を合わせて変更してください。
2. このプロジェクト一式をそのリポジトリにpushする。
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<あなたのアカウント>/kagoshima-tram-timetable.git
   git push -u origin main
   ```
3. GitHubのリポジトリ設定 → Pages → Source を「GitHub Actions」に設定する。
4. `main` にpushすると `.github/workflows/deploy.yml` が自動的にビルド・公開します（初回は手動で Actions タブから `Deploy to GitHub Pages` を実行してもOKです）。
5. `.github/workflows/update-data.yml` が毎日深夜（JST 4:00）に自動で時刻表データを取得し、変更があればコミット・自動的に再デプロイします。手動で今すぐ実行したい場合は Actions タブから `Update tram timetable data` を実行してください。

公開後のURLは `https://<あなたのアカウント>.github.io/kagoshima-tram-timetable/` になります（リポジトリ名を変えた場合はそのリポジトリ名に置き換わります）。

公式サイトのサイトポリシー上「個人的な利用や非営利的な使用目的」に限定されている点を踏まえ、URLを積極的に他者へ共有しない運用を想定しています。

## PWAとしてスマホに追加する

公開したURLをスマートフォンのブラウザ（Safari/Chrome等）で開き、「ホーム画面に追加」を選択してください。

## ディレクトリ構成

```
src/
  pages/        画面コンポーネント（ホーム・検索・詳細・お気に入り管理）
  components/   共通コンポーネント（アイコン、下部タブ）
  lib/          次発計算・お気に入り保存・データ読み込みのロジック
  data/         系統マスタ・時刻表データ（lines.json, timetable/*.json）
scripts/
  scrape.mjs         本番用のデータ取得スクリプト（GitHub Actionsで実行）
  gen-sample-data.mjs 開発用サンプルデータの生成スクリプト
  test-parse.mjs      scrape.mjs のパース処理の単体テスト
.github/workflows/
  deploy.yml         GitHub Pagesへのビルド・デプロイ
  update-data.yml    時刻表データの定期取得
```

## 今後の改善候補

要件定義書に記載のとおり、発車が近づいた際のプッシュ通知、リアルタイム運行情報との連携、多言語対応などは今回のスコープ外です。また、お気に入りの並び替えは上下ボタンによる簡易実装になっており、ドラッグ&ドロップへの改善余地があります。
