/**
 * Driveフォルダ操作まわり
 */

// ルートフォルダ（なければ作成）を取得
function getRootFolder() {
  const props = PropertiesService.getScriptProperties();
  const folderId = props.getProperty(ROOT_FOLDER_PROP_KEY);
  if (folderId) {
    try {
      return DriveApp.getFolderById(folderId);
    } catch (e) {
      // 保存されていたIDのフォルダが見つからない場合は作り直す
    }
  }
  const existing = DriveApp.getFoldersByName(ROOT_FOLDER_NAME);
  const folder = existing.hasNext() ? existing.next() : DriveApp.createFolder(ROOT_FOLDER_NAME);
  props.setProperty(ROOT_FOLDER_PROP_KEY, folder.getId());
  return folder;
}

// 対象月（"yyyy-MM"）に対応するフォルダを取得、なければ作成
function getOrCreateMonthFolder(monthStr) {
  const root = getRootFolder();
  const folders = root.getFoldersByName(monthStr);
  if (folders.hasNext()) return folders.next();
  return root.createFolder(monthStr);
}

// ファイルを対象月フォルダへ移動する（ファイル名は変更しない）
function moveFileToMonthFolder(fileId, monthStr) {
  const file = DriveApp.getFileById(fileId);
  const folder = getOrCreateMonthFolder(monthStr);
  file.moveTo(folder);
  return file;
}
