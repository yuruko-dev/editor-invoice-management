/**
 * エラーログ記録
 */
function logError(location, err) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let logSheet = ss.getSheetByName(SHEET_LOG);
    if (!logSheet) {
      logSheet = ss.insertSheet(SHEET_LOG);
      logSheet.appendRow(['日時', '発生箇所', 'エラー内容']);
    }
    const message = err && err.message ? err.message : String(err);
    logSheet.appendRow([new Date(), location, message]);
  } catch (e2) {
    // ログ記録自体に失敗しても処理は継続する（握りつぶす）
  }
}
