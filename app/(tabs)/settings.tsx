// app/(tabs)/settings.tsx
import { useState, useMemo } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
// ✅ 最新のSDK対応
import * as FileSystem from "expo-file-system/legacy";
import { createZipBackup, restoreFromZipBackup } from "../../lib/backup";

export default function SettingsScreen() {
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  // ✅ 修正済みのパス取得ロジック
  const photosDir = useMemo(() => {
    const base = (FileSystem as any).documentDirectory ?? (FileSystem as any).cacheDirectory ?? "";
    return `${base}mistake-photos/`;
  }, []);

  const showToast = (msg: string, ms = 1600) => {
    setToast(msg);
    setTimeout(() => setToast(""), ms);
  };

  const onBackup = async () => {
    if (busy) return;
    setBusy(true);
    try {
      console.log("Backup target:", photosDir);
      await createZipBackup(photosDir);
      showToast("バックアップZIPを作成しました（共有画面から保存できます）", 2200);
    } catch (e: any) {
      console.log(e);
      Alert.alert("作成失敗", `バックアップ作成に失敗しました\n${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const onRestore = async () => {
    if (busy) return;

    Alert.alert(
      "復元しますか？",
      "現在のデータはすべて消え、バックアップの内容に置き換わります。\n（元に戻せません）",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "復元する",
          style: "destructive",
          onPress: async () => {
            setBusy(true);
            try {
              console.log("Restore target:", photosDir);
              const result = await restoreFromZipBackup(photosDir);
              if (result === "canceled") {
                showToast("キャンセルしました");
              } else {
                Alert.alert("完了", "復元が完了しました！\nアプリを再起動すると反映されます。");
              }
            } catch (e: any) {
              console.log(e);
              Alert.alert("復元失敗", `復元できませんでした\n${e.message}`);
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* ヘッダー */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: "#eee",
        }}
      >
       
        <Text style={{ marginTop: 6, fontSize: 12, color: "#666", lineHeight: 18 }}>
          引き継ぎは「ZIPバックアップ」で行えます。機種変更前に必ず作成してください。
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* ===== ZIP引き継ぎ ===== */}
        <View
          style={{
            borderWidth: 1,
            borderColor: "#eee",
            borderRadius: 16,
            padding: 14,
            marginBottom: 14,
            backgroundColor: "#fff",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "900", color: "#111" }}>
            📦 ZIPバックアップ（引き継ぎ）
          </Text>

          <Text style={{ marginTop: 8, fontSize: 12, color: "#666", lineHeight: 18 }}>
            このZIPには「ミスの記録 / 写真 / 科目設定」がすべて含まれます。
          </Text>

          <View style={{ marginTop: 12, flexDirection: "row", gap: 10 }}>
            <Pressable
              onPress={onBackup}
              disabled={busy}
              style={{
                flex: 1,
                backgroundColor: busy ? "#cfcfcf" : "#ff8a3d",
                paddingVertical: 12,
                borderRadius: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "900" }}>
                {busy ? "処理中…" : "バックアップ作成"}
              </Text>
            </Pressable>

            <Pressable
              onPress={onRestore}
              disabled={busy}
              style={{
                flex: 1,
                backgroundColor: busy ? "#cfcfcf" : "#111",
                paddingVertical: 12,
                borderRadius: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "900" }}>
                {busy ? "処理中…" : "バックアップから復元"}
              </Text>
            </Pressable>
          </View>

          <View
            style={{
              marginTop: 10,
              padding: 10,
              borderRadius: 12,
              backgroundColor: "#fafafa",
            }}
          >
            <Text style={{ fontSize: 12, color: "#666", lineHeight: 18 }}>
              • 例：ファイルアプリ / iCloud Drive  などに保存できます{"\n"}
              • 復元すると、端末内のデータはバックアップ内容に置き換わります
            </Text>
          </View>
        </View>

        {/* ===== iCloud同期（未実装・表示のみ復活） ===== */}
        <View
          style={{
            borderWidth: 1,
            borderColor: "#eee",
            borderRadius: 16,
            padding: 14,
            marginBottom: 14,
            backgroundColor: "#fff",
            opacity: 0.6,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "900", color: "#111" }}>
            iCloud同期
          </Text>
          <Text style={{ marginTop: 8, fontSize: 12, color: "#666", lineHeight: 18 }}>
            ※ 準備中です。現状はZIPバックアップをご利用ください。
          </Text>

          <Pressable
            disabled
            style={{
              marginTop: 12,
              backgroundColor: "#e5e5e5",
              paddingVertical: 12,
              borderRadius: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#888", fontWeight: "900" }}>
              同期を有効にする（準備中）
            </Text>
          </Pressable>
        </View>

        {/* ===== 印刷用エクスポート（未実装・表示のみ復活） ===== */}
        <View
          style={{
            borderWidth: 1,
            borderColor: "#eee",
            borderRadius: 16,
            padding: 14,
            backgroundColor: "#fff",
            opacity: 0.6,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "900", color: "#111" }}>
            印刷用エクスポート
          </Text>
          <Text style={{ marginTop: 8, fontSize: 12, color: "#666", lineHeight: 18 }}>
            ※ 準備中です。PDF/HTML出力に対応予定です。
          </Text>

          <Pressable
            disabled
            style={{
              marginTop: 12,
              backgroundColor: "#e5e5e5",
              paddingVertical: 12,
              borderRadius: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#888", fontWeight: "900" }}>
              エクスポートする（準備中）
            </Text>
          </Pressable>
        </View>

        {toast ? (
          <Text style={{ marginTop: 14, color: "#ff8a3d", fontWeight: "900" }}>
            {toast}
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}