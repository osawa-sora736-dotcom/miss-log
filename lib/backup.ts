// lib/backup.ts
import * as FileSystem from "expo-file-system/legacy";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import JSZip from "jszip";
import { Buffer } from "buffer";

import {
  clearAllDataForRestore,
  exportAllDataForBackup,
  importAllDataFromBackup,
  initDb,
  normalizePhotoUris,
} from "./db";

const BASE64: "base64" = "base64";

// ✅ 共通: ディレクトリ作成ヘルパー
async function ensureDir(dirUri: string) {
  const info = await FileSystem.getInfoAsync(dirUri);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dirUri, { intermediates: true });
  }
}

function backupFileName() {
  const d = new Date();
  const pad2 = (n: number) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mi = pad2(d.getMinutes());
  return `miss-log-backup-${y}${m}${day}-${hh}${mi}.zip`;
}

type BackupJson = {
  version: 1;
  exported_at: string;
  data: ReturnType<typeof exportAllDataForBackup>;
};

// 👇 引数に photosDir を追加しました
export async function createZipBackup(photosDir: string): Promise<void> {
  initDb();

  // 受け取ったパスが空ならエラー
  if (!photosDir) throw new Error("保存先パスが受け取れませんでした (photosDir is empty)");

  const zip = new JSZip();

  // 1) DB → JSON
  const data = exportAllDataForBackup();
  const payload: BackupJson = {
    version: 1,
    exported_at: new Date().toISOString(),
    data,
  };
  zip.file("data.json", JSON.stringify(payload));

  // 2) photos/ をZIPへ
  const photosInfo = await FileSystem.getInfoAsync(photosDir);
  
  if (photosInfo.exists && photosInfo.isDirectory) {
    const files = await FileSystem.readDirectoryAsync(photosDir);
    const photosFolder = zip.folder("photos");
    if (photosFolder) {
      for (const name of files) {
        if (!/\.(jpg|jpeg|png|heic|webp)$/i.test(name)) continue;

        const path = `${photosDir}${name}`;
        const finfo = await FileSystem.getInfoAsync(path);
        if (!finfo.exists) continue;

        const b64 = await FileSystem.readAsStringAsync(path, { encoding: BASE64 });
        photosFolder.file(name, b64, { base64: true });
      }
    }
  }

  // 3) ZIP生成
  const zipBase64: string = await zip.generateAsync({
    type: "base64",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  const cacheDir = (FileSystem as any).cacheDirectory ?? (FileSystem as any).documentDirectory ?? "";
  if (!cacheDir) throw new Error("一時保存先が見つかりません (cacheDir is empty)");

  const outPath = `${cacheDir}${backupFileName()}`;
  await FileSystem.writeAsStringAsync(outPath, zipBase64, { encoding: BASE64 });

  // 4) 共有
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(outPath, {
      mimeType: "application/zip",
      dialogTitle: "バックアップZIPを保存",
      UTI: "public.zip-archive",
    });
  } else {
    throw new Error("Sharing not available");
  }
}

// 👇 こちらも引数に photosDir を追加
export async function restoreFromZipBackup(photosDir: string): Promise<"ok" | "canceled"> {
  initDb();

  const picked = await DocumentPicker.getDocumentAsync({
    type: ["application/zip", "application/octet-stream"],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (picked.canceled) return "canceled";
  const file = picked.assets?.[0];
  if (!file?.uri) throw new Error("ファイルが選択されていません");

  if (!photosDir) throw new Error("保存先パスが受け取れませんでした");

  // 1) ZIP読み込み
  const zipBase64 = await FileSystem.readAsStringAsync(file.uri, { encoding: BASE64 });
  const zipBytes = Buffer.from(zipBase64, "base64");

  const zip = await JSZip.loadAsync(zipBytes);

  const dataFile = zip.file("data.json");
  if (!dataFile) throw new Error("ZIP内に data.json がありません。正しいバックアップですか？");

  const jsonText = await dataFile.async("string");
  const payload = JSON.parse(jsonText) as BackupJson;

  if (!payload || payload.version !== 1) {
    throw new Error("対応していないバージョンです");
  }

  // 2) DB復元
  clearAllDataForRestore();
  importAllDataFromBackup(payload.data);

  // 3) 写真復元
  await ensureDir(photosDir);

  const photosFolder = zip.folder("photos");
  if (photosFolder) {
    const entries = Object.values(photosFolder.files);

    for (const entry of entries) {
      if (entry.dir) continue;
      const name = entry.name.replace(/^photos\//, "");
      if (!name) continue;

      const b64 = await entry.async("base64");
      const dest = `${photosDir}${name}`;
      await FileSystem.writeAsStringAsync(dest, b64, { encoding: BASE64 });
    }
  }

  // 4) DBパス調整
  normalizePhotoUris(photosDir);

  return "ok";
}
