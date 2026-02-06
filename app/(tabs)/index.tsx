import { useFocusEffect, router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  Keyboard,
} from "react-native";
import { MistakeRow, searchMistakes, getSubjects } from "../../lib/db";

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  const hh = d.getHours();
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${mi}`;
};

const importanceMeta = (v: number) => {
  if (v === 3) return { label: "High", bg: "#ff4d4f" };
  if (v === 2) return { label: "Mid", bg: "#ff8a3d" };
  return { label: "Low", bg: "#9aa0a6" };
};

type ImportanceFilter = "ALL" | 1 | 2 | 3;
type SubjectFilter = "ALL" | string;
type SortKey = "date" | "importance" | "subject";

export default function ListScreen() {
  const [rows, setRows] = useState<MistakeRow[]>([]);

  // ✅ 折りたたみ
  const [filterOpen, setFilterOpen] = useState(false);

  // ========= draft（UIで編集中） =========
  const [draftQ, setDraftQ] = useState("");
  const [draftImportance, setDraftImportance] =
    useState<ImportanceFilter>("ALL");
  const [draftSubject, setDraftSubject] = useState<SubjectFilter>("ALL");

  // ========= applied（実際に反映される条件） =========
  const [q, setQ] = useState("");
  const [importance, setImportance] = useState<ImportanceFilter>("ALL");
  const [subject, setSubject] = useState<SubjectFilter>("ALL");

  // 並び替え（現状は即反映のまま）
  const [sort, setSort] = useState<SortKey>("date");

  // 科目チップ用（DBから）
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);

  // ✅ 「次の条件」を渡して確実に検索を実行する関数
  const runSearch = useCallback(
    (next?: {
      q?: string;
      importance?: ImportanceFilter;
      subject?: SubjectFilter;
      sort?: SortKey;
    }) => {
      const qq = (next?.q ?? q).trim();
      const imp = next?.importance ?? importance;
      const sub = next?.subject ?? subject;
      const sk = next?.sort ?? sort;

      setRows(
        searchMistakes({
          q: qq || undefined,
          subject: sub !== "ALL" ? sub : undefined,
          importance: imp !== "ALL" ? imp : undefined,
          sort: sk,
        })
      );
    },
    [q, importance, subject, sort]
  );

  // ✅ 画面が表示されるたびに：科目一覧更新＋現在の条件で検索
  const load = useCallback(() => {
    const subs = getSubjects();
    setSubjectOptions(subs);

    // applied subject が消えていたら ALL に戻す（検索にもALLを反映）
    let appliedSubject: SubjectFilter = subject;
    if (subject !== "ALL" && subs.length > 0 && !subs.includes(subject)) {
      appliedSubject = "ALL";
      setSubject("ALL");
      // draftもズレないように合わせる
      setDraftSubject("ALL");
    }

    // draft subject が消えていたらALLへ
    if (draftSubject !== "ALL" && subs.length > 0 && !subs.includes(draftSubject)) {
      setDraftSubject("ALL");
    }

    runSearch({ subject: appliedSubject });
  }, [subject, draftSubject, runSearch]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const Chip = ({
    label,
    active,
    onPress,
  }: {
    label: string;
    active: boolean;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 999,
        backgroundColor: active ? "#111" : "#f2f2f2",
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <Text
        style={{
          color: active ? "#fff" : "#111",
          fontWeight: "700",
          fontSize: 12,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );

  const countText = useMemo(() => `${rows.length} 件`, [rows.length]);

  // ✅ 未適用（dirty）判定
  const isSearchDirty = useMemo(() => draftQ.trim() !== q.trim(), [draftQ, q]);
  const isFilterDirty = useMemo(
    () => draftImportance !== importance || draftSubject !== subject,
    [draftImportance, importance, draftSubject, subject]
  );

  // ✅ 検索適用
  const applySearch = () => {
    const nextQ = draftQ.trim();
    setQ(nextQ);
    Keyboard.dismiss();
    runSearch({ q: nextQ });
  };

  // ✅ 絞込適用
  const applyFilter = () => {
    const nextImp = draftImportance;
    const nextSub = draftSubject;

    setImportance(nextImp);
    setSubject(nextSub);

    runSearch({ importance: nextImp, subject: nextSub });
  };

  const clearAll = () => {
    setDraftQ("");
    setDraftImportance("ALL");
    setDraftSubject("ALL");

    setQ("");
    setImportance("ALL");
    setSubject("ALL");

    Keyboard.dismiss();
    runSearch({ q: "", importance: "ALL", subject: "ALL" });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 8,
          borderBottomWidth: 1,
          borderBottomColor: "#e5e5e5",
        }}
      >
       

        {/* 検索 */}
        <View style={{ marginTop: 10 }}>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <TextInput
                value={draftQ}
                onChangeText={setDraftQ}
                placeholder="検索（タイトル / 内容）"
                placeholderTextColor="#888"
                autoCapitalize="none"
                autoCorrect={false}
                style={{
                  borderWidth: 1,
                  borderColor: "#e5e5e5",
                  borderRadius: 12,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  fontSize: 14,
                  backgroundColor: "#fff",
                  color: "#111",
                }}
                returnKeyType="search"
                onSubmitEditing={applySearch}
              />
            </View>

            <Pressable
              onPress={applySearch}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 12,
                backgroundColor: isSearchDirty ? "#111" : "#cfcfcf",
              }}
              disabled={!isSearchDirty}
            >
              <Text style={{ color: "#fff", fontWeight: "900" }}>検索</Text>
            </Pressable>
          </View>

          {/* ✅ 折りたたみトグル（検索の下） */}
          <Pressable
            onPress={() => setFilterOpen((v) => !v)}
            style={{
              marginTop: 8,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: "#f2f2f2",
              alignItems: "center",
            }}
          >
            <Text style={{ fontWeight: "700", color: "#111" }}>
              {filterOpen ? "▲ 絞り込み・並び替えを閉じる" : "▼ 絞り込み・並び替え"}
            </Text>
          </Pressable>
        </View>

        {/* ✅ 絞り込み＋並び替え（折りたたみ対象） */}
        {filterOpen && (
          <View style={{ marginTop: 10 }}>
            {/* 絞り込み */}
            <Text style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
              絞り込み
            </Text>

            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              <Chip
                label="重要度: すべて"
                active={draftImportance === "ALL"}
                onPress={() => setDraftImportance("ALL")}
              />
              <Chip
                label="High"
                active={draftImportance === 3}
                onPress={() => setDraftImportance(3)}
              />
              <Chip
                label="Mid"
                active={draftImportance === 2}
                onPress={() => setDraftImportance(2)}
              />
              <Chip
                label="Low"
                active={draftImportance === 1}
                onPress={() => setDraftImportance(1)}
              />
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 4 }}>
              <Chip
                label="科目: すべて"
                active={draftSubject === "ALL"}
                onPress={() => setDraftSubject("ALL")}
              />
              {subjectOptions.map((s) => (
                <Chip
                  key={s}
                  label={s}
                  active={draftSubject === s}
                  onPress={() => setDraftSubject(s)}
                />
              ))}
            </View>

            {/* 絞込ボタン + クリア */}
            <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
              <Pressable
                onPress={applyFilter}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  backgroundColor: isFilterDirty ? "#111" : "#cfcfcf",
                }}
                disabled={!isFilterDirty}
              >
                <Text style={{ color: "#fff", fontWeight: "900" }}>絞込</Text>
              </Pressable>

              <Pressable
                onPress={clearAll}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  backgroundColor: "#f2f2f2",
                  borderWidth: 1,
                  borderColor: "#e5e5e5",
                }}
              >
                <Text style={{ color: "#111", fontWeight: "900" }}>クリア</Text>
              </Pressable>
            </View>

            {/* 並び替え */}
            <Text style={{ fontSize: 12, color: "#666", marginTop: 10, marginBottom: 6 }}>
              並び替え
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              <Chip
                label="日付"
                active={sort === "date"}
                onPress={() => {
                  setSort("date");
                  runSearch({ sort: "date" });
                }}
              />
              <Chip
                label="重要度"
                active={sort === "importance"}
                onPress={() => {
                  setSort("importance");
                  runSearch({ sort: "importance" });
                }}
              />
              <Chip
                label="科目"
                active={sort === "subject"}
                onPress={() => {
                  setSort("subject");
                  runSearch({ sort: "subject" });
                }}
              />
            </View>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginVertical: 12,
          }}
        >
          <Text style={{ fontSize: 12, color: "#666" }}>{countText}</Text>
        </View>

        {rows.length === 0 ? (
          <Text style={{ opacity: 0.6, marginTop: 24 }}>まだミスがありません。</Text>
        ) : (
          rows.map((r) => {
            const meta = importanceMeta(r.importance);

            return (
              <Pressable
                key={r.id}
                onPress={() =>
                  router.push({
                    pathname: "/mistake/[id]",
                    params: { id: String(r.id) },
                  } as any)
                }
                style={{
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: "#eee",
                }}
              >
                <View style={{ flexDirection: "row", gap: 12 }}>
                  {r.firstPhotoUri ? (
                    <Image
                      source={{ uri: r.firstPhotoUri }}
                      style={{
                        width: 58,
                        height: 58,
                        borderRadius: 12,
                        backgroundColor: "#f2f2f2",
                      }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 58,
                        height: 58,
                        borderRadius: 12,
                        backgroundColor: "#f2f2f2",
                      }}
                    />
                  )}

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <View
                        style={{
                          backgroundColor: meta.bg,
                          paddingVertical: 4,
                          paddingHorizontal: 10,
                          borderRadius: 999,
                          marginRight: 10,
                        }}
                      >
                        <Text style={{ color: "#fff", fontWeight: "800", fontSize: 12 }}>
                          {meta.label}
                        </Text>
                      </View>

                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "700",
                          flexShrink: 1,
                          color: "#111",
                        }}
                      >
                        {r.title}
                      </Text>
                    </View>

                    <Text style={{ marginTop: 6, fontSize: 13, color: "#444" }}>
                      {r.subject || "（未設定）"}
                    </Text>

                    <Text
                      style={{ marginTop: 4, fontSize: 14, color: "#444" }}
                      numberOfLines={2}
                    >
                      {r.body}
                    </Text>

                    <Text style={{ marginTop: 6, fontSize: 12, color: "#888" }}>
                      {formatDate(r.occurred_at)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
