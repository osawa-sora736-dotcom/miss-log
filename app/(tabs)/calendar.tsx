// app/(tabs)/calendar.tsx
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
// ✅ 最新SDK対応
import * as FileSystem from "expo-file-system/legacy";

import {
  getAllMistakes,
  MistakeRow,
  insertMistake,
  insertMistakePhotos,
} from "../../lib/db";
import { SubjectPickerModal, Subject } from "../../components/SubjectPickerModal";
import { PhotoGallery } from "../_components/PhotoGallery";

// === 便利関数 & 定数 ===
const WEEK = ["日", "月", "火", "水", "木", "金", "土"] as const;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function dayKeyLocal(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function formatHeaderMonth(d: Date) {
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
}

function formatDateTime(d: Date) {
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  const hh = d.getHours();
  const mi = pad2(d.getMinutes());
  return `${mm}/${dd} ${hh}:${mi}`;
}

const importanceMeta = (v: number) => {
  if (v === 3) return { label: "High", bg: "#ff4d4f", w: 3 };
  if (v === 2) return { label: "Mid", bg: "#ff8a3d", w: 2 };
  return { label: "Low", bg: "#9aa0a6", w: 1 };
};

function addMonths(base: Date, diff: number) {
  const d = new Date(base);
  d.setDate(1);
  d.setMonth(d.getMonth() + diff);
  return d;
}

function buildMonthGrid(monthDate: Date) {
  const y = monthDate.getFullYear();
  const m = monthDate.getMonth();
  const first = new Date(y, m, 1);
  const firstDow = first.getDay(); // 0=Sun
  const start = new Date(y, m, 1 - firstDow);

  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push(d);
  }
  return { cells };
}

function alphaFromScore(score: number, maxScore: number) {
  if (score <= 0 || maxScore <= 0) return 0;
  const t = Math.min(score / maxScore, 1);
  return 0.10 + 0.55 * t;
}

const parseDateParamToLocalNoon = (dateStr: string) => {
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!y || !mo || !d) return null;
  return new Date(y, mo - 1, d, 12, 0, 0);
};

// === コンポーネント定義 ===
const Chip = ({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    style={{
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 14,
      backgroundColor: selected ? "#ff8a3d" : "#f2f2f2",
      marginRight: 8,
    }}
  >
    <Text style={{ color: selected ? "#fff" : "#222", fontWeight: "700" }}>
      {label}
    </Text>
  </Pressable>
);

const ensureDir = async (dirUri: string) => {
  const info = await FileSystem.getInfoAsync(dirUri);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dirUri, { intermediates: true });
  }
};

const genFileName = (srcUri: string) => {
  const ext = (() => {
    const m = srcUri.match(/\.([a-zA-Z0-9]+)(\?|#|$)/);
    return m?.[1]?.toLowerCase() ?? "jpg";
  })();
  return `${Date.now()}_${Math.random().toString(16).slice(2)}.${ext}`;
};

export default function CalendarScreen() {
  const params = useLocalSearchParams<{ focus?: string }>();

  const [rows, setRows] = useState<MistakeRow[]>([]);

  const [month, setMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const [selected, setSelected] = useState(() => new Date());

  // === モーダル入力用 ===
  const [modalVisible, setModalVisible] = useState(false);
  const [formDate, setFormDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [subject, setSubject] = useState<Subject>("英語");
  const [importance, setImportance] = useState<1 | 2 | 3>(2);
  const [photos, setPhotos] = useState<{ uri: string }[]>([]);

  const photosDir = useMemo(() => {
    const base =
      (FileSystem as any).documentDirectory ??
      (FileSystem as any).cacheDirectory ??
      "";
    return `${base}mistake-photos/`;
  }, []);

  const load = useCallback(() => {
    setRows(getAllMistakes());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    const focus = params.focus;
    if (!focus || typeof focus !== "string") return;

    const d = parseDateParamToLocalNoon(focus);
    if (!d) return;

    setSelected(d);
    const m = new Date(d);
    m.setDate(1);
    setMonth(m);
  }, [params.focus]);

  const grid = useMemo(() => buildMonthGrid(month), [month]);
  const selectedKey = useMemo(() => dayKeyLocal(selected), [selected]);

const { countsByDayKey, scoresByDayKey, maxScoreInMonth } = useMemo(() => {
    const counts = new Map<string, number>();
    const scores = new Map<string, number>();

    const y = month.getFullYear();
    const m = month.getMonth();

    for (const r of rows) {
      const d = new Date(r.occurred_at);
      if (Number.isNaN(d.getTime())) continue;

      // その月のデータだけを集計対象にする
      if (d.getFullYear() === y && d.getMonth() === m) {
        const k = dayKeyLocal(d);
        
        // 件数をカウント
        counts.set(k, (counts.get(k) ?? 0) + 1);

        // 重要度スコアを加算 (High=3, Mid=2, Low=1)
        const w = importanceMeta(r.importance).w;
        scores.set(k, (scores.get(k) ?? 0) + w);
      }
    }

    // 色の濃さを決めるために、その月で一番高いスコアを算出
    let maxScore = 0;
    for (const v of scores.values()) maxScore = Math.max(maxScore, v);

    return { countsByDayKey: counts, scoresByDayKey: scores, maxScoreInMonth: maxScore };
  }, [rows, month]);

  const selectedRows = useMemo(() => {
    const list = rows.filter((r) => {
      const d = new Date(r.occurred_at);
      if (Number.isNaN(d.getTime())) return false;
      return dayKeyLocal(d) === selectedKey;
    });

    list.sort((a, b) => {
      const ta = new Date(a.occurred_at).getTime();
      const tb = new Date(b.occurred_at).getTime();
      return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
    });
    return list;
  }, [rows, selectedKey]);

  const onTapDay = useCallback((d: Date) => {
    setSelected(d);
  }, []);

  const onPrevMonth = useCallback(() => {
    setMonth((prev) => addMonths(prev, -1));
  }, []);

  const onNextMonth = useCallback(() => {
    setMonth((prev) => addMonths(prev, +1));
  }, []);

  // === モーダル操作 ===
  const openAddModal = () => {
    // 初期値：選択中の日付 + 現在時刻
    const now = new Date();
    const initDate = new Date(selected);
    initDate.setHours(now.getHours(), now.getMinutes());
    
    setFormDate(initDate);
    setTitle("");
    setBody("");
    setSubject("英語");
    setImportance(2);
    setPhotos([]);
    setModalVisible(true);
  };

  const pickPhotos = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("許可が必要です", "写真へのアクセスを許可してください");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 0,
      quality: 1,
    });
    if (!result.canceled) {
      const uris = result.assets.map((a) => ({ uri: a.uri }));
      setPhotos((prev) => [...prev, ...uris]);
    }
  };

  const removePhotoAt = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const onSave = async () => {
    const t = title.trim();
    const b = body.trim();

    if (!t) return Alert.alert("エラー", "タイトルを入力してください");
    if (!b) return Alert.alert("エラー", "内容を入力してください");

    try {
      const mistakeId = await insertMistake({
        title: t,
        body: b,
        subject,
        importance,
        occurred_at: formDate.toISOString(),
      });

      const photoUris = photos.map((p) => p.uri);
      if (photoUris.length > 0) {
        if (photosDir) {
          await ensureDir(photosDir);
          const finalUris = [];
          for (const uri of photoUris) {
            const fileName = genFileName(uri);
            const dest = `${photosDir}${fileName}`;
            await FileSystem.copyAsync({ from: uri, to: dest });
            finalUris.push(dest);
          }
          await insertMistakePhotos(mistakeId, finalUris);
        }
      }

      setModalVisible(false);
      load(); // カレンダー更新
      Alert.alert("完了", "ミスを追加しました！");
    } catch (e: any) {
      console.log(e);
      Alert.alert("保存失敗", e.message);
    }
  };

  return (
    <>
      <ScrollView contentContainerStyle={{ paddingBottom: 36, backgroundColor: "#fff" }}>
        {/* ヘッダー */}
        <View style={{ backgroundColor: "#ff8a3d", paddingTop: 12, paddingBottom: 12, paddingHorizontal: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
            <Pressable onPress={onPrevMonth} style={{ padding: 10 }}>
              <Text style={{ color: "#fff", fontWeight: "900", fontSize: 18 }}>◀︎</Text>
            </Pressable>
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 20, marginHorizontal: 14 }}>
              {formatHeaderMonth(month)}
            </Text>
            <Pressable onPress={onNextMonth} style={{ padding: 10 }}>
              <Text style={{ color: "#fff", fontWeight: "900", fontSize: 18 }}>▶︎</Text>
            </Pressable>
          </View>
        </View>

        {/* 曜日 */}
        <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e5e5e5" }}>
          {WEEK.map((w, i) => (
            <View
              key={w}
              style={{
                flex: 1,
                paddingVertical: 8,
                alignItems: "center",
                backgroundColor: "#fafafa",
                borderRightWidth: i === 6 ? 0 : 1,
                borderRightColor: "#eee",
              }}
            >
              <Text style={{ fontWeight: "800", color: i === 0 ? "#d44" : i === 6 ? "#46f" : "#444" }}>
                {w}
              </Text>
            </View>
          ))}
        </View>

        {/* カレンダー */}
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {grid.cells.map((d, idx) => {
            const inMonth = d.getMonth() === month.getMonth();
            const k = dayKeyLocal(d);
            const count = countsByDayKey.get(k) ?? 0;
            const score = scoresByDayKey.get(k) ?? 0;
            const isSelected = k === selectedKey;

            const alpha = alphaFromScore(score, maxScoreInMonth);
            const heatBg = alpha > 0 ? `rgba(255, 138, 61, ${alpha})` : "#fff";

            return (
              <Pressable
                key={`${k}-${idx}`}
                onPress={() => onTapDay(d)}
                style={{
                  width: "14.2857%",
                  borderRightWidth: idx % 7 === 6 ? 0 : 1,
                  borderRightColor: "#eee",
                  borderBottomWidth: 1,
                  borderBottomColor: "#eee",
                  padding: 6,
                  height: 62,
                  backgroundColor: isSelected ? "#fff3ea" : heatBg,
                  opacity: inMonth ? 1 : 0.35,
                }}
              >
                <Text style={{ fontWeight: "900", color: "#222" }}>{d.getDate()}</Text>
                {count > 0 ? (
                  <View style={{ marginTop: 6, alignSelf: "flex-start", backgroundColor: "#ff8a3d", borderRadius: 10, paddingVertical: 2, paddingHorizontal: 8 }}>
                    <Text style={{ color: "#fff", fontWeight: "900", fontSize: 12 }}>{count}</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {/* 下部：詳細・追加ボタン */}
        <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
          
          {/* ✅ 「この日にミスを追加」ボタン */}
          <Pressable
            onPress={openAddModal}
            style={({ pressed }) => ({
              backgroundColor: pressed ? "#f0f0f0" : "#f9f9f9",
              paddingVertical: 12,
              borderRadius: 12,
              alignItems: "center",
              marginBottom: 16,
              borderWidth: 1,
              borderColor: "#eee",
              borderStyle: "dashed",
            })}
          >
            <Text style={{ fontWeight: "900", color: "#ff8a3d", fontSize: 16 }}>
              ＋ {selected.getMonth() + 1}/{selected.getDate()} にミスを追加
            </Text>
          </Pressable>

          <Text style={{ fontSize: 14, fontWeight: "900", marginBottom: 8 }}>
            {selected.getMonth() + 1}/{selected.getDate()} の記録
          </Text>

          {selectedRows.length === 0 ? (
            <Text style={{ opacity: 0.6 }}>記録はありません。</Text>
          ) : (
            <View>
              {selectedRows.slice(0, 10).map((r) => {
                const meta = importanceMeta(r.importance);
                return (
                  <Pressable
                    key={r.id}
                    onPress={() =>
                      router.push({ pathname: "/mistake/[id]", params: { id: String(r.id) } } as any)
                    }
                    style={{
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: "#eee",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <View style={{ backgroundColor: meta.bg, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, marginRight: 10 }}>
                        <Text style={{ color: "#fff", fontWeight: "900", fontSize: 12 }}>{meta.label}</Text>
                      </View>
                      <Text style={{ fontSize: 15, fontWeight: "900", flexShrink: 1, color: "#111" }}>{r.title}</Text>
                    </View>
                    <Text style={{ marginTop: 6, fontSize: 12, color: "#666" }}>
                      {r.subject} / {formatDateTime(new Date(r.occurred_at))}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* === 追加モーダル（スクロール修正版） === */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        {/* ✅ Flex:1 を指定して全画面確保 */}
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: "#fff" }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* ヘッダー部分 */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderColor: "#eee", alignItems: "center" }}>
            <Pressable onPress={() => setModalVisible(false)}>
              <Text style={{ color: "#ff8a3d", fontWeight: "bold", fontSize: 16 }}>キャンセル</Text>
            </Pressable>
            <Text style={{ fontWeight: "900", fontSize: 16 }}>ミスを追加</Text>
            <Pressable onPress={onSave}>
              <Text style={{ color: "#ff8a3d", fontWeight: "bold", fontSize: 16 }}>保存</Text>
            </Pressable>
          </View>

          {/* ✅ 中身をScrollViewにして、キーボード操作を快適に */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {/* 画面全体のタップでキーボードを下げる */}
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View>
                {/* 日時変更 (タップ可能・シンプル表示) */}
                <Text style={{ fontWeight: "900", marginBottom: 6 }}>日時</Text>
                <Pressable
                  onPress={() => setShowDatePicker(true)}
                  style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 12, padding: 12, marginBottom: 14 }}
                >
                  {/* ✅ 年を削除し、月日時間を表示 */}
                  <Text style={{ fontWeight: "900", color: "#111" }}>
                    {formDate.getMonth() + 1}月{formDate.getDate()}日 {pad2(formDate.getHours())}:{pad2(formDate.getMinutes())}
                  </Text>
                  <Text style={{ fontSize: 11, color: "#999", marginTop: 4 }}>タップして変更</Text>
                </Pressable>

                {showDatePicker && (
                  <DateTimePicker
                    value={formDate}
                    mode="datetime"
                    display="spinner"
                    locale="ja-JP"
                    textColor="black"
                  themeVariant="light"
                    onChange={(_, d) => {
                      setShowDatePicker(false);
                      if (d) setFormDate(d);
                    }}
                  />
                )}

                {/* 科目 */}
                <Text style={{ fontWeight: "900", marginBottom: 6 }}>科目</Text>
                <SubjectPickerModal value={subject} onChange={setSubject} />

                {/* 重要度 */}
                <Text style={{ fontWeight: "900", marginBottom: 6, marginTop: 12 }}>重要度</Text>
                <View style={{ flexDirection: "row", marginBottom: 12 }}>
                  {[1, 2, 3].map((v) => (
                    <Chip
                      key={v}
                      label={v === 1 ? "Low" : v === 2 ? "Mid" : "High"}
                      selected={importance === v}
                      onPress={() => setImportance(v as 1 | 2 | 3)}
                    />
                  ))}
                </View>

{/* ... (前略) ... */}
{/* タイトル */}
<Text style={{ fontWeight: "900", marginBottom: 6 }}>タイトル</Text>
<TextInput
  value={title}
  onChangeText={setTitle}
  placeholder="例：定期テスト数学大問２"
  placeholderTextColor="#999"
  style={{
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  }}
/>


{/* 内容 */}
<Text style={{ fontWeight: "900", marginBottom: 6 }}>内容</Text>
<TextInput
  value={body}
  onChangeText={setBody}
  placeholder="分母≠０を忘れていた。"
  placeholderTextColor="#999"
  multiline
  style={{
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    height: 100,
    textAlignVertical: "top",
    marginBottom: 12,
  }}
/>


                {/* 写真 */}
                <Text style={{ fontWeight: "900", marginBottom: 6 }}>写真</Text>
                <PhotoGallery
                  photos={photos}
                  onPressAdd={pickPhotos}
                  onRemoveAt={removePhotoAt}
                  mainAspectRatio={1}
                />
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}