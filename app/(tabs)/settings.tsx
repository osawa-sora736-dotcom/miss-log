import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import * as FileSystem from "expo-file-system/legacy";
import { createZipBackup, restoreFromZipBackup } from "../../lib/backup";
import { AppColors } from "../../constants/app-theme";
import {
  getAllMistakePhotos,
  getMistakeCount,
  updateMistakePhotoUri,
} from "../../lib/db";
import { saveOptimizedPhoto } from "../../lib/photos";
import { FREE_MISTAKE_LIMIT, isProUnlocked } from "../../lib/subscription";

const formatMb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)}MB`;

export default function SettingsScreen() {
  const [busy, setBusy] = useState(false);
  const [busyDots, setBusyDots] = useState(0);
  const [toast, setToast] = useState("");

  const photosDir = useMemo(() => {
    const base = (FileSystem as any).documentDirectory ?? (FileSystem as any).cacheDirectory ?? "";
    return `${base}mistake-photos/`;
  }, []);

  const busyLabel = `処理中${".".repeat(busyDots)}`;

  useEffect(() => {
    if (!busy) {
      setBusyDots(0);
      return;
    }

    const timer = setInterval(() => {
      setBusyDots((current) => (current + 1) % 4);
    }, 420);

    return () => clearInterval(timer);
  }, [busy]);

  const showToast = (msg: string, ms = 1800) => {
    setToast(msg);
    setTimeout(() => setToast(""), ms);
  };

  const onBackup = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await createZipBackup(photosDir);
      showToast("バックアップZIPを作成しました");
    } catch (e: any) {
      Alert.alert("作成に失敗しました", e?.message ?? "もう一度お試しください。");
    } finally {
      setBusy(false);
    }
  };

  const onRestore = async () => {
    if (busy) return;

    Alert.alert(
      "バックアップから復元しますか？",
      "現在のデータはバックアップ内容に置き換わります。元に戻せないので注意してください。",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "復元する",
          style: "destructive",
          onPress: async () => {
            setBusy(true);
            try {
              const result = await restoreFromZipBackup(photosDir);
              if (result === "canceled") {
                showToast("キャンセルしました");
              } else {
                const proUnlocked = await isProUnlocked();
                const mistakeCount = getMistakeCount();
                if (!proUnlocked && mistakeCount > FREE_MISTAKE_LIMIT) {
                  Alert.alert(
                    "復元しました",
                    `${mistakeCount}件の記録があるため、続けるにはミスログProが必要です。`,
                    [{ text: "OK", onPress: () => router.replace("/subscription" as any) }]
                  );
                } else {
                  Alert.alert("復元しました", "アプリを再起動すると反映されます。");
                }
              }
            } catch (e: any) {
              Alert.alert("復元に失敗しました", e?.message ?? "もう一度お試しください。");
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  const onOptimizePhotos = async () => {
    if (busy) return;

    Alert.alert(
      "既存写真を軽量化しますか？",
      "保存済みの写真を圧縮し、バックアップサイズを小さくします。元の写真より重くなる場合は置き換えません。",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "軽量化する",
          onPress: async () => {
            setBusy(true);
            let checked = 0;
            let optimized = 0;
            let beforeTotal = 0;
            let afterTotal = 0;

            try {
              const photos = getAllMistakePhotos();

              for (const photo of photos) {
                const beforeInfo = await FileSystem.getInfoAsync(photo.uri);
                if (!beforeInfo.exists) continue;

                checked += 1;
                const beforeSize = Number((beforeInfo as any).size ?? 0);
                beforeTotal += beforeSize;

                const optimizedUri = await saveOptimizedPhoto(photo.uri, photosDir);
                const afterInfo = await FileSystem.getInfoAsync(optimizedUri);
                const afterSize = Number((afterInfo as any).size ?? 0);

                if (afterInfo.exists && afterSize > 0 && afterSize < beforeSize * 0.95) {
                  updateMistakePhotoUri(photo.id, optimizedUri);
                  optimized += 1;
                  afterTotal += afterSize;
                  try {
                    await FileSystem.deleteAsync(photo.uri, { idempotent: true });
                  } catch {}
                } else {
                  afterTotal += beforeSize;
                  try {
                    await FileSystem.deleteAsync(optimizedUri, { idempotent: true });
                  } catch {}
                }
              }

              if (checked === 0) {
                Alert.alert("写真がありません", "軽量化できる写真が見つかりませんでした。");
                return;
              }

              Alert.alert(
                "軽量化しました",
                `${checked}枚を確認し、${optimized}枚を軽量化しました。\n${formatMb(beforeTotal)} → ${formatMb(afterTotal)}`
              );
            } catch (e: any) {
              Alert.alert("軽量化に失敗しました", e?.message ?? "もう一度お試しください。");
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
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Text style={{ marginBottom: 12, fontSize: 12, color: "#64748B", lineHeight: 18 }}>
          データの保存、復元、印刷用ファイルの作成ができます。
        </Text>

        <View
          style={{
            borderWidth: 1,
            borderColor: "#E2E8F0",
            borderRadius: 16,
            padding: 14,
            marginBottom: 14,
            backgroundColor: "#fff",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#0F172A" }}>
            ZIPバックアップ
          </Text>
          <Text style={{ marginTop: 8, fontSize: 12, color: "#64748B", lineHeight: 18 }}>
            ミスの記録、写真、科目設定をZIPファイルとして保存できます。機種変更前にもおすすめです。
          </Text>

          <View style={{ marginTop: 12, flexDirection: "row", gap: 10 }}>
            <Pressable
              onPress={onBackup}
              disabled={busy}
              style={{
                flex: 1,
                backgroundColor: busy ? "#94A3B8" : AppColors.primaryDark,
                paddingVertical: 12,
                borderRadius: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>
                {busy ? busyLabel : "作成"}
              </Text>
            </Pressable>

            <Pressable
              onPress={onRestore}
              disabled={busy}
              style={{
                flex: 1,
                backgroundColor: busy ? "#94A3B8" : "#0F172A",
                paddingVertical: 12,
                borderRadius: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>
                {busy ? busyLabel : "復元"}
              </Text>
            </Pressable>
          </View>
        </View>

        <View
          style={{
            borderWidth: 1,
            borderColor: "#E2E8F0",
            borderRadius: 16,
            padding: 14,
            marginBottom: 14,
            backgroundColor: "#fff",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#0F172A" }}>
            写真を軽量化
          </Text>
          <Text style={{ marginTop: 8, fontSize: 12, color: "#64748B", lineHeight: 18 }}>
            以前に保存した写真を圧縮して、普段の保存容量とバックアップZIPを小さくします。
          </Text>

          <Pressable
            onPress={onOptimizePhotos}
            disabled={busy}
            style={{
              marginTop: 12,
              backgroundColor: busy ? "#94A3B8" : AppColors.primary,
              paddingVertical: 12,
              borderRadius: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>
              {busy ? busyLabel : "既存写真を軽量化"}
            </Text>
          </Pressable>
        </View>

        <View
          style={{
            borderWidth: 1,
            borderColor: "#E2E8F0",
            borderRadius: 16,
            padding: 14,
            marginBottom: 14,
            backgroundColor: "#fff",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#0F172A" }}>
            印刷用エクスポート
          </Text>
          <Text style={{ marginTop: 8, fontSize: 12, color: "#64748B", lineHeight: 18 }}>
            ミスを絞り込んで選択し、印刷しやすいHTMLファイルを作成します。
          </Text>

          <Pressable
            onPress={() => router.push("/export-print" as any)}
            disabled={busy}
            style={{
              marginTop: 12,
              backgroundColor: busy ? "#94A3B8" : AppColors.primaryDark,
              paddingVertical: 12,
              borderRadius: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>印刷用ファイルを作る</Text>
          </Pressable>
        </View>

        <View
          style={{
            borderWidth: 1,
            borderColor: "#E2E8F0",
            borderRadius: 16,
            padding: 14,
            backgroundColor: "#fff",
            opacity: 0.65,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#0F172A" }}>
            iCloud同期
          </Text>
          <Text style={{ marginTop: 8, fontSize: 12, color: "#64748B", lineHeight: 18 }}>
            準備中です。今はZIPバックアップをご利用ください。
          </Text>
        </View>

        {toast ? (
          <Text style={{ marginTop: 14, color: AppColors.primaryDark, fontWeight: "600" }}>
            {toast}
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}
