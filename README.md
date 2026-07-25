# 編集チーム請求書管理システム

<p align="center">
  <img src="docs/images/overview.png" alt="編集チーム請求書管理システム 概要" width="100%">
</p>

業務委託の編集者から毎月提出される請求書について、Googleフォームでの提出受付から、Driveへの自動格納、提出状況の自動集計までを一気通貫で行う、Google Apps Script (GAS) 製の業務効率化ツールです。

![Google Apps Script](https://img.shields.io/badge/Google_Apps_Script-4285F4?style=flat-square&logo=googleappsscript&logoColor=white)
![Google Sheets](https://img.shields.io/badge/Google_Sheets-34A853?style=flat-square&logo=googlesheets&logoColor=white)
![Google Drive](https://img.shields.io/badge/Google_Drive-FBBC04?style=flat-square&logo=googledrive&logoColor=white)
![Google Forms](https://img.shields.io/badge/Google_Forms-7248B9?style=flat-square&logo=googleforms&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)

## このツールが解決できること

- 📂 **整理の手間がゼロに**: 送られてきた請求書ファイルが月ごとのフォルダへ自動で整理されるため、手作業での仕分け・保管が不要になります
- ✅ **確認作業から解放**: 誰が提出済みで誰が未提出かを、毎回声をかけて確認する必要がなくなります
- 📊 **集計はいつも自動更新**: 提出率や人数を手計算・手入力する必要がなく、常に最新の状態をスプレッドシート上で確認できます

## 背景・課題

複数名の業務委託編集者から毎月請求書を集める運用では、以下のような手間が発生しがちです。

- 提出物（PDF等）がメールやチャットに散在し、月ごと・人ごとに整理されていない
- 誰が提出済みで誰がまだなのか、都度手作業で確認する必要がある
- 集計のためにスプレッドシートを毎回手で更新している

本ツールは Google フォームを提出窓口にすることで、**提出・保存・集計を自動化**します。

## 主な機能

| 機能 | 内容 |
| --- | --- |
| フォーム提出 → Drive自動格納 | 添付された請求書ファイルを「請求対象月」ごとのフォルダへ自動振り分け |
| 提出状況の自動集計 | 編集者マスターと突き合わせ、対象月ごとの提出済み／未提出人数・提出率をリアルタイムに表示 |
| 重複提出への対応 | 同月に複数回提出された場合は、最新の提出のみを有効な提出として扱う |
| カスタムメニュー | スプレッドシート上のメニューから、初期セットアップ・フォーム連携・選択肢更新・再集計をワンクリックで実行 |
| エラーログ | 処理中に発生した例外を専用シートに記録し、運用中の不具合追跡を容易にする |

## 処理の流れ

```mermaid
flowchart TD
    A["編集者がGoogleフォームに<br/>請求書ファイルを添えて提出"] --> B["onFormSubmit トリガー起動"]
    B --> C["Driveの対象月フォルダへ<br/>ファイルを自動移動"]
    B --> D["提出状況シートを再集計"]
    D --> E["提出済み/未提出リストと<br/>提出率を更新"]
    F["提出状況シートのB1セル<br/>対象月を手動変更"] --> G["onEdit トリガー起動"]
    G --> D
```

## ディレクトリ構成

```
.
├── AppsScript/
│   ├── appsscript.json
│   ├── .clasp.json.example
│   ├── Config.gs
│   ├── Setup.gs
│   ├── Menu.gs
│   ├── CreateForm.gs
│   ├── FormTrigger.gs
│   ├── DriveUtil.gs
│   ├── StatusUpdater.gs
│   └── ErrorLog.gs
├── docs/
│   └── images/
├── LICENSE
└── README.md
```

各ファイルの役割:

- `AppsScript/appsscript.json` : マニフェスト（タイムゾーン・OAuthスコープ等）
- `AppsScript/.clasp.json.example` : clasp設定のテンプレート（実ファイルは`.gitignore`対象）
- `AppsScript/Config.gs` : シート名・フォーム項目名などの定数定義
- `AppsScript/Setup.gs` : 初期セットアップ処理
- `AppsScript/Menu.gs` : カスタムメニュー・フォーム選択肢同期
- `AppsScript/CreateForm.gs` : Googleフォームの新規作成・連携
- `AppsScript/FormTrigger.gs` : フォーム送信時トリガー処理
- `AppsScript/DriveUtil.gs` : Driveフォルダ操作(月別フォルダの作成・ファイル移動)
- `AppsScript/StatusUpdater.gs` : 提出状況シートの集計ロジック
- `AppsScript/ErrorLog.gs` : エラーログ記録
- `docs/images/` : README用スクリーンショット(overview.png)の格納先

## 技術スタック

- **Google Apps Script (V8 runtime)**
- **Google Sheets API / Drive API / Forms API**（`SpreadsheetApp` / `DriveApp` / `FormApp` 各サービス経由）
- **PropertiesService** によるスクリプトプロパティ管理（Driveフォルダ ID の永続化など）
- **[clasp](https://github.com/google/clasp)**（ローカル開発・デプロイ用CLI、任意）

## セットアップ手順

このツールは特定のスプレッドシート・フォームに紐づくコンテナバインド型スクリプトです。自分の環境で使う場合は以下の手順でセットアップしてください。

### 1. スプレッドシートとスクリプトの準備

1. 新規にGoogleスプレッドシートを作成する
2. 「拡張機能」→「Apps Script」でスクリプトエディタを開く
3. `AppsScript/` 配下の `.gs` ファイルと `appsscript.json` の内容を、それぞれ同名のファイルとしてコピーする

### 2. （任意）clasp を使う場合

```bash
npm install -g @google/clasp
clasp login

cd AppsScript
cp .clasp.json.example .clasp.json
# .clasp.json の scriptId を、自分のGASプロジェクトのIDに書き換える
clasp push
```

`.clasp.json` にはスクリプトIDなど環境固有の情報が含まれるため、`.gitignore` によりリポジトリから除外しています。

### 3. フォームの用意

- 既存のフォームがあれば、スプレッドシートと回答連携させておく
- ない場合は、スプレッドシートのカスタムメニュー「請求書管理」→「新規フォームを作成して連携」で自動作成できる
  - 質問項目: `編集者名` / `請求対象月` / `請求書ファイル` / `備考`

### 4. 初期セットアップの実行

スプレッドシートを開き、カスタムメニュー「請求書管理」→「**初期セットアップ実行**」を実行します。

- 必要なシート（`フォーム回答` / `編集者マスター` / `提出状況` / `ログ`）を自動作成
- 請求書ファイルの格納用Driveフォルダを作成
- フォーム送信トリガーを登録

初回実行時、OAuth権限の承認ダイアログが表示されるので許可してください。

### 5. 編集者マスターの登録

「編集者マスター」シートに `編集者名 / メールアドレス / 状態` を入力します（`状態` に「退職」と入れると集計対象から除外されます）。

登録後、メニュー「**編集者名の選択肢をフォームに反映**」を実行すると、フォームの選択肢に反映されます。

### 6. 運用

- 編集者はフォームから毎月請求書を提出する
- 「提出状況」シートで、提出済み／未提出・提出率を自動で確認できる
- 対象月を変更したい場合は、「提出状況」シートのB1セルを書き換えると自動で再集計される

## セキュリティ・公開に関する注意

- スプレッドシートID・フォームURL・DriveフォルダID等はコード中にハードコードせず、実行時に `getActiveSpreadsheet()` / `getFormUrl()` / `PropertiesService` から動的に取得する設計としています
- `.clasp.json`（スクリプトIDなどの環境固有情報）はリポジトリに含めていません

## ライセンス

[MIT License](./LICENSE)
