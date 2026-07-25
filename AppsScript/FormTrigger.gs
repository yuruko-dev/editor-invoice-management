/**
 * フォーム送信時トリガー（インストール型: setup()で登録される）
 */
function onFormSubmit(e) {
  try {
    if (!e || !e.response) {
      throw new Error('フォーム送信イベントを取得できませんでした。');
    }
    const itemResponses = e.response.getItemResponses();

    let editorName = '';
    let targetMonth = '';
    let fileIds = [];

    itemResponses.forEach(function (ir) {
      const title = ir.getItem().getTitle();
      if (title === Q_EDITOR) {
        editorName = (ir.getResponse() || '').toString().trim();
      } else if (title === Q_MONTH) {
        targetMonth = (ir.getResponse() || '').toString().trim();
      } else if (title === Q_FILE) {
        fileIds = ir.getResponse() || []; // ファイルアップロード項目は file ID の配列
      } else if (title === Q_NOTE) {
        // 備考は特に加工不要（フォーム回答シートにそのまま記録される）
      }
    });

    if (!editorName) throw new Error('編集者名が空です。');
    if (!targetMonth) throw new Error('請求対象月が空です。');

    let fileLink = '';
    fileIds.forEach(function (fileId) {
      const file = moveFileToMonthFolder(fileId, targetMonth);
      if (!fileLink) fileLink = file.getUrl();
    });

    refreshSubmissionStatus({
      name: editorName,
      month: targetMonth,
      timestamp: e.response.getTimestamp(),
      link: fileLink
    });
  } catch (err) {
    logError('onFormSubmit', err);
  }
}
