/**
 * 提出状況シートの再集計
 * @param {{name:string, month:string, timestamp:(Date|string), link:string}=} latestSubmission
 *   フォーム送信直後に呼び出す場合、その送信内容を渡す。
 *   「フォーム回答」シートへの行書き込みがトリガー発火に間に合わない場合があるため、
 *   シートの読み取り結果とこの値をマージして最新提出として扱う。
 */
function refreshSubmissionStatus(latestSubmission) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const statusSheet = ss.getSheetByName(SHEET_STATUS);
  const responsesSheet = ss.getSheetByName(SHEET_RESPONSES);
  const masterSheet = ss.getSheetByName(SHEET_MASTER);
  if (!statusSheet || !responsesSheet || !masterSheet) {
    throw new Error('必要なシートが見つかりません。先にメニューから「初期セットアップ実行」を行ってください。');
  }

  // 対象月の決定（未入力なら当月をセット）
  let targetMonth = normalizeMonthValue(statusSheet.getRange(STATUS_MONTH_CELL).getValue());
  if (!targetMonth) {
    targetMonth = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM');
    statusSheet.getRange(STATUS_MONTH_CELL).setValue(targetMonth);
  }

  // 編集者マスターから在籍中の編集者一覧を取得
  const masterValues = masterSheet.getDataRange().getValues();
  const editors = [];
  for (let i = 1; i < masterValues.length; i++) {
    const name = (masterValues[i][0] || '').toString().trim();
    const status = (masterValues[i][2] || '').toString().trim();
    if (name && status !== '退職') {
      editors.push(name);
    }
  }
  editors.sort();

  // フォーム回答から対象月の最新提出のみを編集者ごとに抽出
  // タイムスタンプ列は常に先頭(0列目)、その他はヘッダー名から列位置を特定する（項目の並び順に依存しない）
  const respValues = responsesSheet.getDataRange().getValues();
  const header = respValues[0] || [];
  const colEditor = header.indexOf(Q_EDITOR);
  const colMonth = header.indexOf(Q_MONTH);
  const colFile = header.indexOf(Q_FILE);
  if (colEditor < 0 || colMonth < 0 || colFile < 0) {
    throw new Error(
      'フォーム回答シートに「' + Q_EDITOR + '」「' + Q_MONTH + '」「' + Q_FILE + '」の列が見つかりません。フォームの質問タイトルを確認してください。'
    );
  }

  const latestByEditor = {};
  for (let i = 1; i < respValues.length; i++) {
    const row = respValues[i];
    const timestamp = row[0];
    const name = (row[colEditor] || '').toString().trim();
    const month = normalizeMonthValue(row[colMonth]);
    const fileLink = row[colFile];
    if (!name || month !== targetMonth) continue;

    const ts = timestamp instanceof Date ? timestamp.getTime() : new Date(timestamp).getTime();
    const current = latestByEditor[name];
    if (!current || ts > current.ts) {
      latestByEditor[name] = { ts: ts, timestamp: timestamp, link: fileLink };
    }
  }

  // フォーム送信直後の呼び出しの場合、シート反映待ちに備えて送信内容を直接マージする
  if (latestSubmission && latestSubmission.name && latestSubmission.month === targetMonth) {
    const subTs = latestSubmission.timestamp instanceof Date
      ? latestSubmission.timestamp.getTime()
      : new Date(latestSubmission.timestamp).getTime();
    const current = latestByEditor[latestSubmission.name];
    if (!current || subTs >= current.ts) {
      latestByEditor[latestSubmission.name] = {
        ts: subTs,
        timestamp: latestSubmission.timestamp,
        link: latestSubmission.link
      };
    }
  }

  // 一覧テーブルを作成
  const tableRows = editors.map(function (name) {
    const entry = latestByEditor[name];
    if (entry) {
      return [name, '提出済み', entry.timestamp, entry.link];
    }
    return [name, '未提出', '', ''];
  });

  const startRow = STATUS_TABLE_HEADER_ROW + 1;
  const clearRows = Math.max(statusSheet.getMaxRows() - startRow + 1, tableRows.length);
  if (clearRows > 0) {
    statusSheet.getRange(startRow, 1, clearRows, 4).clearContent();
  }
  if (tableRows.length > 0) {
    statusSheet.getRange(startRow, 1, tableRows.length, 4).setValues(tableRows);
  }

  // サマリー集計
  const targetCount = editors.length;
  const submittedCount = editors.filter(function (name) {
    return !!latestByEditor[name];
  }).length;
  const unsubmittedCount = targetCount - submittedCount;
  const rate = targetCount > 0 ? submittedCount / targetCount : 0;

  statusSheet.getRange(STATUS_TARGET_COUNT_CELL).setValue(targetCount);
  statusSheet.getRange(STATUS_SUBMITTED_COUNT_CELL).setValue(submittedCount);
  statusSheet.getRange(STATUS_UNSUBMITTED_COUNT_CELL).setValue(unsubmittedCount);
  statusSheet.getRange(STATUS_RATE_CELL).setValue(rate);
}

/**
 * 提出状況シートの対象月セル(B1)を手動で変更したときに自動再集計する
 * シンプルトリガー（コンテナバインドスクリプトなので自動で有効）
 */
function onEdit(e) {
  try {
    if (!e || !e.range) return;
    const sheet = e.range.getSheet();
    if (sheet.getName() === SHEET_STATUS && e.range.getA1Notation() === STATUS_MONTH_CELL) {
      refreshSubmissionStatus();
    }
  } catch (err) {
    logError('onEdit', err);
  }
}
