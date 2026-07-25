/**
 * (任意) 新規にGoogleフォームを作成し、このスプレッドシートに連携する。
 * すでに手動でフォームを作成済みの場合は実行不要。
 * 実行後、フォームの編集URLがアラート表示される。
 */
function createFormAndLink() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss.getFormUrl()) {
    throw new Error('このスプレッドシートには既にフォームが連携されています。');
  }

  const form = FormApp.create('編集チーム請求書提出フォーム');
  form.setDescription('毎月の請求書提出用フォームです。請求対象月・請求書ファイルを添えて提出してください。');

  form.addListItem()
    .setTitle(Q_EDITOR)
    .setRequired(true)
    .setChoiceValues(['(セットアップ後に「編集者名の選択肢をフォームに反映」で更新してください)']);

  form.addListItem()
    .setTitle(Q_MONTH)
    .setRequired(true)
    .setChoiceValues(buildMonthChoices(6, 3));

  form.addFileUploadItem()
    .setTitle(Q_FILE)
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle(Q_NOTE)
    .setRequired(false);

  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  SpreadsheetApp.getUi().alert(
    'フォームを作成しました。\n編集用URL:\n' + form.getEditUrl() +
    '\n\nこの後、メニューの「初期セットアップ実行」を行ってください。'
  );
}
