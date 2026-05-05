import { useFocusEffect, router } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useScrollToTop } from "@react-navigation/native";
import {
  deleteMistake,
  deleteMistakes,
  getSubjects,
  MistakeRow,
  searchMistakes,
  setMistakeBookmarked,
} from "../../lib/db";
import { AppColors, importanceLabel } from "../../constants/app-theme";

const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

const importanceMeta = (value: number) => {
  if (value === 3) return { label: importanceLabel(value), color: AppColors.danger };
  if (value === 2) return { label: importanceLabel(value), color: AppColors.primaryDark };
  return { label: importanceLabel(value), color: AppColors.muted };
};

type ImportanceFilter = "ALL" | 1 | 2 | 3;
type SubjectFilter = "ALL" | string;
type SortKey = "date" | "importance" | "subject";

function FilterChip({
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
        backgroundColor: active ? AppColors.primarySoft : "#F8FAFC",
        borderWidth: 1,
        borderColor: active ? "#7DD3FC" : "#E2E8F0",
        marginRight: 8,
      }}
    >
      <Text
        style={{
          color: active ? AppColors.primaryDark : "#475569",
          fontSize: 12,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ListRow({
  row,
  selecting,
  selected,
  onPress,
  onLongPress,
  onToggleSelect,
  onDelete,
  onToggleBookmark,
}: {
  row: MistakeRow;
  selecting: boolean;
  selected: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onToggleSelect: () => void;
  onDelete: () => void;
  onToggleBookmark: () => void;
}) {
  const meta = importanceMeta(row.importance);
  const bookmarked = row.is_bookmarked === 1;

  return (
    <View style={{ backgroundColor: selected ? "#E0F2FE" : "#fff" }}>
        <Pressable
          onPress={selecting ? onToggleSelect : onPress}
          onLongPress={onLongPress}
          delayLongPress={260}
          style={{
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderBottomWidth: 1,
            borderBottomColor: "#E2E8F0",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            {selecting ? (
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  borderWidth: 2,
                  borderColor: selected ? AppColors.primaryDark : "#CBD5E1",
                  backgroundColor: selected ? AppColors.primaryDark : "#fff",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>{selected ? "✓" : ""}</Text>
              </View>
            ) : (
              <Pressable
                onPress={(event) => {
                  event.stopPropagation();
                  onToggleBookmark();
                }}
                hitSlop={10}
                style={{ width: 32, height: 46, alignItems: "center", justifyContent: "center" }}
              >
                <Text
                  style={{
                    color: bookmarked ? "#F59E0B" : "#CBD5E1",
                    fontSize: 24,
                    lineHeight: 26,
                  }}
                >
                  {bookmarked ? "★" : "☆"}
                </Text>
              </Pressable>
            )}

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text
                  numberOfLines={1}
                  style={{ flex: 1, fontSize: 15, fontWeight: "600", color: "#0F172A" }}
                >
                  {row.title}
                </Text>
                <Text style={{ fontSize: 12, color: "#94A3B8" }}>{formatDate(row.occurred_at)}</Text>
              </View>

              <Text numberOfLines={1} style={{ marginTop: 4, fontSize: 13, color: "#64748B" }}>
                {row.body}
              </Text>

              <View style={{ marginTop: 7, flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: meta.color,
                  }}
                />
                <Text style={{ fontSize: 12, color: "#64748B" }}>
                  {row.subject || "未設定"} ・ 重要度 {meta.label}
                </Text>
              </View>
            </View>
            {!selecting && row.firstPhotoUri ? (
              <Image
                source={{ uri: row.firstPhotoUri }}
                style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: "#F1F5F9" }}
              />
            ) : null}
          </View>
        </Pressable>
    </View>
  );
}

export default function ListScreen() {
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);

  const [rows, setRows] = useState<MistakeRow[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [importance, setImportance] = useState<ImportanceFilter>("ALL");
  const [subject, setSubject] = useState<SubjectFilter>("ALL");
  const [sort, setSort] = useState<SortKey>("date");
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const selecting = selectedIds.size > 0;

  const load = useCallback(
    (next?: {
      q?: string;
      importance?: ImportanceFilter;
      subject?: SubjectFilter;
      sort?: SortKey;
      bookmarkedOnly?: boolean;
    }) => {
      const nextQ = (next?.q ?? q).trim();
      const nextImportance = next?.importance ?? importance;
      const nextSubject = next?.subject ?? subject;
      const nextSort = next?.sort ?? sort;
      const nextBookmarkedOnly = next?.bookmarkedOnly ?? bookmarkedOnly;

      const subjects = getSubjects();
      setSubjectOptions(subjects);

      setRows(
        searchMistakes({
          q: nextQ || undefined,
          subject: nextSubject !== "ALL" ? nextSubject : undefined,
          importance: nextImportance !== "ALL" ? nextImportance : undefined,
          bookmarked: nextBookmarkedOnly,
          sort: nextSort,
        })
      );
    },
    [bookmarkedOnly, importance, q, sort, subject]
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const selectedRows = useMemo(
    () => rows.filter((row) => selectedIds.has(row.id)),
    [rows, selectedIds]
  );

  const selectedLabel = selectedIds.size ? `${selectedIds.size}件選択` : `${rows.length}件`;

  const toggleSelected = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const openDetail = (id: number) => {
    router.push({ pathname: "/mistake/[id]", params: { id: String(id) } } as any);
  };

  const confirmDeleteOne = (row: MistakeRow) => {
    Alert.alert("削除しますか？", `「${row.title}」を削除します。`, [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: () => {
          setRows((prev) => prev.filter((r) => r.id !== row.id));
          deleteMistake(row.id);
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(row.id);
            return next;
          });
        },
      },
    ]);
  };

  const confirmBulkDelete = () => {
    if (!selectedRows.length) return;
    Alert.alert("一括削除しますか？", `${selectedRows.length}件のミスを削除します。`, [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: () => {
          deleteMistakes([...selectedIds]);
          clearSelection();
          load();
        },
      },
    ]);
  };

  const toggleBookmark = (row: MistakeRow) => {
    const nextBookmarked = row.is_bookmarked !== 1;
    setRows((prev) => {
      const nextRows = prev.map((r) =>
        r.id === row.id ? { ...r, is_bookmarked: nextBookmarked ? 1 : 0 } : r
      );
      return bookmarkedOnly && !nextBookmarked
        ? nextRows.filter((r) => r.id !== row.id)
        : nextRows;
    });
    setMistakeBookmarked(row.id, nextBookmarked);
  };

  const applySearch = () => {
    Keyboard.dismiss();
    load({ q });
  };

  const applyImportance = (value: ImportanceFilter) => {
    setImportance(value);
    load({ importance: value });
  };

  const applySubject = (value: SubjectFilter) => {
    setSubject(value);
    load({ subject: value });
  };

  const applySort = (value: SortKey) => {
    setSort(value);
    load({ sort: value });
  };

  const toggleBookmarkedOnly = () => {
    const next = !bookmarkedOnly;
    setBookmarkedOnly(next);
    load({ bookmarkedOnly: next });
  };

  const resetFilters = () => {
    setQ("");
    setImportance("ALL");
    setSubject("ALL");
    setSort("date");
    setBookmarkedOnly(false);
    clearSelection();
    load({ q: "", importance: "ALL", subject: "ALL", sort: "date", bookmarkedOnly: false });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {selecting ? (
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: "#E2E8F0",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Pressable onPress={clearSelection} style={{ padding: 6 }}>
            <Text style={{ color: AppColors.primaryDark, fontWeight: "700" }}>解除</Text>
          </Pressable>
          <Text style={{ fontWeight: "700", color: "#0F172A" }}>{selectedLabel}</Text>
          <Pressable onPress={confirmBulkDelete} style={{ padding: 6 }}>
            <Text style={{ color: AppColors.danger, fontWeight: "700" }}>削除</Text>
          </Pressable>
        </View>
      ) : (
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 10,
            borderBottomWidth: 1,
            borderBottomColor: "#E2E8F0",
            backgroundColor: "#fff",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              paddingHorizontal: 12,
              borderRadius: 18,
              backgroundColor: "#F8FAFC",
              borderWidth: 1,
              borderColor: "#E2E8F0",
            }}
          >
            <Text style={{ color: "#94A3B8", fontSize: 17 }}>⌕</Text>
            <TextInput
              value={q}
              onChangeText={setQ}
              onSubmitEditing={applySearch}
              placeholder="ミスを検索"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              style={{
                flex: 1,
                paddingVertical: 11,
                color: "#0F172A",
                fontSize: 14,
              }}
            />
            {q ? (
              <Pressable
                onPress={() => {
                  setQ("");
                  load({ q: "" });
                }}
                style={{ padding: 5 }}
              >
                <Text style={{ color: "#64748B", fontWeight: "700" }}>×</Text>
              </Pressable>
            ) : null}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 10 }}
          >
            <FilterChip label="すべて" active={!bookmarkedOnly && importance === "ALL" && subject === "ALL"} onPress={resetFilters} />
            <FilterChip label="★ 保存" active={bookmarkedOnly} onPress={toggleBookmarkedOnly} />
            <FilterChip label="重要度 高" active={importance === 3} onPress={() => applyImportance(importance === 3 ? "ALL" : 3)} />
            <FilterChip label="重要度 中" active={importance === 2} onPress={() => applyImportance(importance === 2 ? "ALL" : 2)} />
            <FilterChip label="日付順" active={sort === "date"} onPress={() => applySort("date")} />
            <FilterChip label="重要度順" active={sort === "importance"} onPress={() => applySort("importance")} />
            <FilterChip label="科目順" active={sort === "subject"} onPress={() => applySort("subject")} />
          </ScrollView>

          {subjectOptions.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingTop: 8 }}
            >
              <FilterChip label="科目すべて" active={subject === "ALL"} onPress={() => applySubject("ALL")} />
              {subjectOptions.map((name) => (
                <FilterChip
                  key={name}
                  label={name}
                  active={subject === name}
                  onPress={() => applySubject(subject === name ? "ALL" : name)}
                />
              ))}
            </ScrollView>
          ) : null}
        </View>
      )}

      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: 24 }}>
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 10,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 12, color: "#64748B" }}>{selectedLabel}</Text>
          <Text style={{ fontSize: 11, color: "#94A3B8" }}>
            星で保存 / 長押しで選択
          </Text>
        </View>

        {rows.length === 0 ? (
          <Text style={{ marginTop: 40, textAlign: "center", color: "#94A3B8" }}>
            条件に合うミスがありません
          </Text>
        ) : (
          rows.map((row) => (
            <ListRow
              key={row.id}
              row={row}
              selecting={selecting}
              selected={selectedIds.has(row.id)}
              onPress={() => openDetail(row.id)}
              onLongPress={() => toggleSelected(row.id)}
              onToggleSelect={() => toggleSelected(row.id)}
              onDelete={() => confirmDeleteOne(row)}
              onToggleBookmark={() => toggleBookmark(row)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
