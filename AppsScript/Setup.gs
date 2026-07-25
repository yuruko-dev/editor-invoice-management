/**
 * 初期セットアップ
 * スプレッドシートのメニュー「請求書管理 > 初期セットアップ実行」から実行する。
 * 何度実行しても安全（既存のシート・トリガーは重複作成しない）。
 */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const responsesSheet = ensureResponsesSheetName(ss);
  ensureSheet(ss, SHEET_MASTER, ['編集者名', 'メールアドレス', '状態']);
  const statusSheet = ensureSheet(ss, SHEET_STATUS, null);
  ensureSheet(ss, SHEET_LOG, ['日時', '発生箇所', 'エラー内容']);

  fixMonthColumnFormat(responsesSheet);
  setupStatusSheetLayout(statusSheet);
  getRootFolder();
  installFormSubmitTrigger(ss);

  SpreadsheetApp.getUi().alert(
    'セットアップが完了しました。\n' +
    '「編集者マスター」シートに編集者を登録し、メニューの「編集者名の選択肢をフォームに反映」を実行してください。'
  );
}

// フォームの回答シートを "フォーム回答" という名前に統一する
function ensureResponsesSheetName(ss) {
  let sheet = ss.getSheetByName(SHEET_RESPONSES);
  if (sheet) return sheet;

  const candidate = ss.getSheets().find(function (s) {
    return /^フォームの回答/.test(s.getName()) || /^Form Responses/.test(s.getName());
  });
  if (candidate) {
    candidate.setName(SHEET_RESPONSES);
    return candidate;
  }
  throw new Error(
    'フォームの回答シートが見つかりません。先にGoogleフォームを作成し、回答の送信先をこのスプレッドシートに設定してください（メニューの「新規フォームを作成して連携」でも作成できます）。'
  );
}

// フォーム回答シートの「請求対象月」列をプレーンテキスト化し、
// 既に日付型として保存されてしまっている既存行の値も "yyyy-MM" 文字列に修正する。
function fixMonthColumnFormat(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 1 || lastCol < 1) return;

  const header = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const colIndex = header.indexOf(Q_MONTH); // 0始まり
  if (colIndex < 0) return;

  const col = colIndex + 1; // 1始まり
  const fullColumnRange = sheet.getRange(2, col, Math.max(sheet.getMaxRows() - 1, 1), 1);
  fullColumnRange.setNumberFormat('@');

  if (lastRow < 2) return;
  const dataRange = sheet.getRange(2, col, lastRow - 1, 1);
  const values = dataRange.getValues();
  const normalized = values.map(function (row) {
    return [normalizeMonthValue(row[0])];
  });
  dataRange.setValues(normalized);
}

function ensureSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers) sheet.appendRow(headers);
  }
  return sheet;
}

function setupStatusSheetLayout(sheet) {
  sheet.getRange('A1').setValue('対象月');
  sheet.getRange('A2').setValue('対象人数');
  sheet.getRange('A3').setValue('提出済み人数');
  sheet.getRange('A4').setValue('未提出人数');
  sheet.getRange('A5').setValue('提出率');

  const monthCell = sheet.getRange(STATUS_MONTH_CELL);
  // 表示形式が「自動」だと "2026-07" のような文字列が日付型として保存され、
  // 文字列比較が常に不一致になるため、プレーンテキストに固定する。
  monthCell.setNumberFormat('@');
  const existingMonth = normalizeMonthValue(monthCell.getValue());
  if (!existingMonth) {
    monthCell.setValue(Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM'));
  } else {
    monthCell.setValue(existingMonth);
  }
  const monthChoices = buildMonthChoices(6, 3);
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(monthChoices, true)
    .setAllowInvalid(false)
    .build();
  monthCell.setDataValidation(rule);

  sheet.getRange(STATUS_RATE_CELL).setNumberFormat('0.0%');

  sheet.getRange(STATUS_TABLE_HEADER_ROW, 1, 1, 4)
    .setValues([['編集者名', '状態', '提出日時', '請求書ファイルのリンク']])
    .setFontWeight('bold');
}

// onFormSubmit のインストール型トリガーを（重複なく）設定する
// 注意: forSpreadsheet(ss).onFormSubmit() で作成すると e.response が渡されず
// e.values / e.namedValues のみになる（ファイルアップロードのfile IDが取得できない）。
// そのためフォーム本体(forForm)にトリガーを張る。
function installFormSubmitTrigger(ss) {
  const formUrl = ss.getFormUrl();
  if (!formUrl) {
    throw new Error('このスプレッドシートにはフォームが連携されていません。先にフォームと連携してください。');
  }
  const form = FormApp.openByUrl(formUrl);

  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'onFormSubmit') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('onFormSubmit').forForm(form).onFormSubmit().create();
}

// 対象月の選択肢（相対月）を生成する。monthsBefore/monthsAfter は現在月からの範囲
function buildMonthChoices(monthsBefore, monthsAfter) {
  const list = [];
  const now = new Date();
  for (let i = -monthsBefore; i <= monthsAfter; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    list.push(Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM'));
  }
  return list;
}
