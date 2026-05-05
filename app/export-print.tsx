import { useFocusEffect, router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { getSubjects, MistakeRow, searchMistakes } from "../lib/db";
import { AppColors, importanceLabel } from "../constants/app-theme";

type ImportanceFilter = "ALL" | 1 | 2 | 3;
type SubjectFilter = "ALL" | string;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
};

const buildPrintHtml = (rows: MistakeRow[]) => {
  const createdAt = new Date();
  const items = rows
    .map(
      (row, index) => `
        <section class="mistake">
          <div class="meta">
            <span>No. ${index + 1}</span>
            <span>${escapeHtml(formatDate(row.occurred_at))}</span>
            <span>${escapeHtml(row.subject || "未設定")}</span>
            <span>重要度 ${escapeHtml(importanceLabel(row.importance))}</span>
          </div>
          <h2>${escapeHtml(row.title)}</h2>
          <p>${escapeHtml(row.body).replace(/\n/g, "<br />")}</p>
          <div class="memo">
            <strong>次に気をつけること</strong>
            <div></div>
          </div>
        </section>`
    )
    .join("\n");

  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ミスログ 印刷用まとめ</title>
  <style>
    body {
      margin: 0;
      padding: 32px;
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic", sans-serif;
      background: #fff;
    }
    header {
      margin-bottom: 24px;
      border-bottom: 2px solid #0284c7;
      padding-bottom: 16px;
    }
    h1 {
      margin: 0;
      font-size: 26px;
    }
    .summary {
      margin-top: 8px;
      color: #475569;
      font-size: 13px;
    }
    .mistake {
      break-inside: avoid;
      page-break-inside: avoid;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 18px;
      margin-bottom: 16px;
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      font-size: 12px;
      color: #0369a1;
      font-weight: 700;
    }
    .meta span {
      background: #e0f2fe;
      border-radius: 999px;
      padding: 4px 9px;
    }
    h2 {
      margin: 12px 0 8px;
      font-size: 19px;
    }
    p {
      margin: 0;
      font-size: 14px;
      line-height: 1.8;
      white-space: normal;
    }
    .memo {
      margin-top: 14px;
      font-size: 13px;
      color: #334155;
    }
    .memo div {
      margin-top: 8px;
      height: 42px;
      border: 1px dashed #94a3b8;
      border-radius: 8px;
    }
    @media print {
      body { padding: 18mm; }
      .mistake { border-color: #94a3b8; }
    }
  </style>
</head>
<body>
  <header>
    <h1>ミスログ 印刷用まとめ</h1>
    <div class="summary">${rows.length}件 / 作成日 ${createdAt.getFullYear()}/${createdAt.getMonth() + 1}/${createdAt.getDate()}</div>
  </header>
  ${items}
</body>
</html>`;
};

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 999,
        backgroundColor: active ? AppColors.primaryDark : "#F1F5F9",
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <Text style={{ color: active ? "#fff" : "#0F172A", fontWeight: "600" }}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function ExportPrintScreen() {
  const [rows, setRows] = useState<MistakeRow[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [importance, setImportance] = useState<ImportanceFilter>("ALL");
  const [subject, setSubject] = useState<SubjectFilter>("ALL");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    const nextRows = searchMistakes({
      q: q.trim() || undefined,
      importance: importance === "ALL" ? undefined : importance,
      subject: subject === "ALL" ? undefined : subject,
      sort: "review",
    });
    setRows(nextRows);
    setSubjects(getSubjects());
    setSelectedIds((prev) => {
      const allowed = new Set(nextRows.map((row) => row.id));
      return new Set([...prev].filter((id) => allowed.has(id)));
    });
  }, [importance, q, subject]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const selectedRows = useMemo(
    () => rows.filter((row) => selectedIds.has(row.id)),
    [rows, selectedIds]
  );

  const toggle = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(rows.map((row) => row.id)));
  const clearSelection = () => setSelectedIds(new Set());

  const onExport = async () => {
    if (selectedRows.length === 0) {
      Alert.alert("ミスを選択してください", "印刷用に出したいミスにチェックを入れてください。");
      return;
    }

    setBusy(true);
    try {
      const html = buildPrintHtml(selectedRows);
      const dir = (FileSystem as any).cacheDirectory ?? (FileSystem as any).documentDirectory;
      const path = `${dir}misslog-print-${Date.now()}.html`;
      await FileSystem.writeAsStringAsync(path, html, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, {
          mimeType: "text/html",
          dialogTitle: "印刷用ファイルを共有",
          UTI: "public.html",
        });
        Alert.alert("完了しました", `${selectedRows.length}件の印刷用ファイルを作成しました。`);
      } else {
        Alert.alert("完了しました", `印刷用ファイルを作成しました。\n${path}`);
      }
    } catch (e: any) {
      Alert.alert("作成に失敗しました", e?.message ?? "もう一度お試しください。");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: "#E2E8F0",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: AppColors.primaryDark, fontWeight: "700" }}>戻る</Text>
        </Pressable>
        <Text style={{ fontSize: 16, fontWeight: "700", color: "#0F172A" }}>
          印刷用エクスポート
        </Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <TextInput
          value={q}
          onChangeText={setQ}
          onSubmitEditing={load}
          placeholder="タイトル・内容で検索"
          placeholderTextColor="#94A3B8"
          style={{
            borderWidth: 1,
            borderColor: "#CBD5E1",
            borderRadius: 14,
            paddingVertical: 11,
            paddingHorizontal: 12,
            color: "#0F172A",
          }}
        />

        <View style={{ marginTop: 12, flexDirection: "row", flexWrap: "wrap" }}>
          <Chip label="重要度: すべて" active={importance === "ALL"} onPress={() => setImportance("ALL")} />
          <Chip label="高" active={importance === 3} onPress={() => setImportance(3)} />
          <Chip label="中" active={importance === 2} onPress={() => setImportance(2)} />
          <Chip label="低" active={importance === 1} onPress={() => setImportance(1)} />
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          <Chip label="科目: すべて" active={subject === "ALL"} onPress={() => setSubject("ALL")} />
          {subjects.map((name) => (
            <Chip key={name} label={name} active={subject === name} onPress={() => setSubject(name)} />
          ))}
        </View>

        <Pressable
          onPress={load}
          style={{
            marginTop: 4,
            paddingVertical: 12,
            borderRadius: 14,
            backgroundColor: "#F1F5F9",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#0F172A", fontWeight: "700" }}>この条件で絞り込む</Text>
        </Pressable>

        <View
          style={{
            marginTop: 16,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#64748B", fontWeight: "600" }}>
            {selectedRows.length} / {rows.length}件を選択
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable onPress={selectAll}>
              <Text style={{ color: AppColors.primaryDark, fontWeight: "700" }}>全選択</Text>
            </Pressable>
            <Pressable onPress={clearSelection}>
              <Text style={{ color: "#64748B", fontWeight: "700" }}>解除</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ marginTop: 10 }}>
          {rows.map((row) => {
            const selected = selectedIds.has(row.id);
            return (
              <Pressable
                key={row.id}
                onPress={() => toggle(row.id)}
                style={{
                  paddingVertical: 13,
                  borderBottomWidth: 1,
                  borderBottomColor: "#E2E8F0",
                  flexDirection: "row",
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: selected ? AppColors.primaryDark : "#CBD5E1",
                    backgroundColor: selected ? AppColors.primaryDark : "#fff",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>{selected ? "✓" : ""}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#0F172A" }}>
                    {row.title}
                  </Text>
                  <Text style={{ marginTop: 4, fontSize: 12, color: "#64748B" }}>
                    {formatDate(row.occurred_at)} / {row.subject} / 重要度 {importanceLabel(row.importance)}
                  </Text>
                  <Text numberOfLines={2} style={{ marginTop: 5, fontSize: 13, lineHeight: 19, color: "#475569" }}>
                    {row.body}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={onExport}
          disabled={busy}
          style={{
            marginTop: 18,
            paddingVertical: 15,
            borderRadius: 16,
            backgroundColor: busy ? "#94A3B8" : AppColors.primaryDark,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
            {busy ? "作成中..." : "印刷用HTMLを作成"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

