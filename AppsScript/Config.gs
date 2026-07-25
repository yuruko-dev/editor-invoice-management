/**
 * シート名・フォーム項目名などの共通設定
 */

// シート名
const SHEET_RESPONSES = 'フォーム回答';
const SHEET_MASTER = '編集者マスター';
const SHEET_STATUS = '提出状況';
const SHEET_LOG = 'ログ';

// フォーム項目タイトル（フォーム側の質問タイトルと完全一致させること）
const Q_EDITOR = '編集者名';
const Q_MONTH = '請求対象月';
const Q_FILE = '請求書ファイル';
const Q_NOTE = '備考';

// 添付ファイルの格納先ルートフォルダ
const ROOT_FOLDER_NAME = '請求書_添付';
const ROOT_FOLDER_PROP_KEY = 'ROOT_FOLDER_ID';

// 提出状況シートのレイアウト
const STATUS_MONTH_CELL = 'B1';
const STATUS_TARGET_COUNT_CELL = 'B2';
const STATUS_SUBMITTED_COUNT_CELL = 'B3';
const STATUS_UNSUBMITTED_COUNT_CELL = 'B4';
const STATUS_RATE_CELL = 'B5';
const STATUS_TABLE_HEADER_ROW = 7; // この行に見出し、次行からデータ

// "yyyy-MM" 形式の月文字列に正規化する。
// スプレッドシートのセル書式が「自動」だと "2026-07" のような文字列が
// 日付型として保存されてしまうことがあるため、Date型でも文字列型でも吸収する。
function normalizeMonthValue(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM');
  }
  return (value || '').toString().trim();
}
