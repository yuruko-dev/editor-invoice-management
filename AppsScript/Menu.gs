/**
 * スプレッドシートを開いたときにカスタムメニューを表示する（シンプルトリガー）
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('請求書管理')
    .addItem('初期セットアップ実行', 'setup')
    .addSeparator()
    .addItem('新規フォームを作成して連携', 'createFormAndLink')
    .addItem('編集者名の選択肢をフォームに反映', 'syncEditorChoicesToForm')
    .addItem('月の選択肢を再生成', 'refreshMonthChoices')
    .addSeparator()
    .addItem('提出状況を再集計', 'refreshSubmissionStatus')
    .addToUi();
}

// 編集者マスターの内容をフォームの「編集者名」選択肢に反映する
function syncEditorChoicesToForm() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const formUrl = ss.getFormUrl();
    if (!formUrl) throw new Error('連携されたフォームが見つかりません。');
    const form = FormApp.openByUrl(formUrl);

    const masterSheet = ss.getSheetByName(SHEET_MASTER);
    if (!masterSheet) throw new Error(SHEET_MASTER + 'シートが見つかりません。');

    const values = masterSheet.getDataRange().getValues();
    const names = [];
    for (let i = 1; i < values.length; i++) {
      const name = (values[i][0] || '').toString().trim();
      const status = (values[i][2] || '').toString().trim();
      if (name && status !== '退職') names.push(name);
    }
    if (names.length === 0) throw new Error('編集者マスターに有効な編集者がいません。');

    const editorItem = form.getItems(FormApp.ItemType.LIST).find(function (it) {
      return it.getTitle() === Q_EDITOR;
    });
    if (!editorItem) throw new Error('フォームに「' + Q_EDITOR + '」項目が見つかりません。');

    editorItem.asListItem().setChoiceValues(names);
    SpreadsheetApp.getUi().alert('編集者名の選択肢を更新しました。（' + names.length + '件）');
  } catch (err) {
    logError('syncEditorChoicesToForm', err);
    SpreadsheetApp.getUi().alert('エラー: ' + err.message);
  }
}

// 対象月の選択肢（フォーム・提出状況シート双方）を再生成する
function refreshMonthChoices() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const monthChoices = buildMonthChoices(6, 3);

    const statusSheet = ss.getSheetByName(SHEET_STATUS);
    if (statusSheet) {
      const rule = SpreadsheetApp.newDataValidation()
        .requireValueInList(monthChoices, true)
        .setAllowInvalid(false)
        .build();
      statusSheet.getRange(STATUS_MONTH_CELL).setDataValidation(rule);
    }

    const formUrl = ss.getFormUrl();
    if (formUrl) {
      const form = FormApp.openByUrl(formUrl);
      const monthItem = form.getItems(FormApp.ItemType.LIST).find(function (it) {
        return it.getTitle() === Q_MONTH;
      });
      if (monthItem) monthItem.asListItem().setChoiceValues(monthChoices);
    }
    SpreadsheetApp.getUi().alert('月の選択肢を更新しました。');
  } catch (err) {
    logError('refreshMonthChoices', err);
    SpreadsheetApp.getUi().alert('エラー: ' + err.message);
  }
}
