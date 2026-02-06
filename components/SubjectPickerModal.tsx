import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { addSubject, deleteSubject, getSubjects, renameSubject } from "../lib/db";

export type Subject = string;

export function SubjectPickerModal({
  value,
  onChange,
}: {
  value: Subject;
  onChange: (v: Subject) => void;
}) {
  const [open, setOpen] = useState(false);

  const [subjects, setSubjects] = useState<string[]>([]);
  const [mode, setMode] = useState<"pick" | "add" | "edit">("pick");

  const [input, setInput] = useState("");

  // ★スクロール制御（キーボードで隠れたら自動で上へ）
  const scrollRef = useRef<ScrollView>(null);
  const scrollToForm = () => {
    // 少し待ってキーボード高さが確定してからスクロール
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: 260, animated: true });
    }, 80);
  };

  const refresh = () => {
    const list = getSubjects();
    setSubjects(list);

    // いま選ばれてる科目が消えてたら先頭に寄せる（事故防止）
    if (list.length && value && !list.includes(value)) {
      onChange(list[0]);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (open) refresh();
  }, [open]);

  const canEdit = useMemo(() => !!value, [value]);

  const onAdd = () => {
    const n = input.trim();
    if (!n) return;

    try {
      addSubject(n);

      // 追加→即反映
      const list = getSubjects();
      setSubjects(list);

      setInput("");
      onChange(n); // 追加した科目をそのまま選択
      setMode("pick");
    } catch (e: any) {
      const msg =
        e?.message === "duplicate"
          ? "同じ科目名がすでにあります"
          : "追加できませんでした";
      Alert.alert("科目の追加", msg);
    }
  };

  const onRename = () => {
    const n = input.trim();
    if (!n) return;
    if (!value) return;

    Alert.alert(
      "科目名を変更",
      `「${value}」を「${n}」に変更します。\n過去の記録にも反映されます。`,
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "変更",
          style: "destructive",
          onPress: () => {
            try {
              const old = value;
              renameSubject(old, n);

              // 変更→即反映
              const list = getSubjects();
              setSubjects(list);

              setInput("");
              onChange(n);
              setMode("pick");
            } catch (e: any) {
              const msg =
                e?.message === "duplicate"
                  ? "同じ科目名がすでにあります"
                  : "変更できませんでした";
              Alert.alert("科目名の変更", msg);
            }
          },
        },
      ]
    );
  };

  const onDelete = () => {
  if (!value) return;

  Alert.alert(
    "科目を削除",
    `「${value}」を削除します。\n（使用中の科目は削除できません）`,
    [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: () => {
          try {
            const deleting = value;

            deleteSubject(deleting);

            // ★削除成功直後に最新一覧を取り直す
            const list = getSubjects();
            setSubjects(list);

            // ★「画面に残る」を潰す：親の選択値を即更新
            const next = list[0] ?? "英語";
            onChange(next);

            // ★モード/入力も戻す
            setInput("");
            setMode("pick");

            // ★削除できたのが分かるように（どっちか好きな方）
            // 1) モーダルを閉じる（おすすめ）
            setOpen(false);

            // 2) あるいはメッセージ出す（閉じない派なら）
            // Alert.alert("削除しました", `「${deleting}」を削除しました`);
          } catch (e: any) {
            const msg =
              e?.message === "in_use"
                ? "この科目は既に記録で使われているため削除できません"
                : "削除できませんでした";
            Alert.alert("科目の削除", msg);
          }
        },
      },
    ]
  );
};

  // Pickerの候補が空だった時の保険（基本はseedされる）
  const pickerItems = subjects.length ? subjects : ["英語"];

  return (
    <>
      {/* 小さく表示 */}
      <Pressable
        onPress={() => {
          setMode("pick");
          setOpen(true);
        }}
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 12,
          padding: 12,
          marginBottom: 14,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ fontWeight: "800", color: "#111" }}>{value}</Text>
        <Text style={{ color: "#666", fontWeight: "800" }}>選択 ▾</Text>
      </Pressable>

      {/* 下から展開 */}
      <Modal visible={open} transparent animationType="slide">
        <Pressable
          onPress={() => setOpen(false)}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.25)" }}
        />

        {/* ★ここがキーボード回避の本体 */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
        >
          <View
            style={{
              backgroundColor: "#fff",
              paddingTop: 10,
              paddingBottom: 20,
              paddingHorizontal: 14,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: "85%", // ★隠れないように余白
            }}
          >
            <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled">
              {/* ヘッダー */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontWeight: "900", fontSize: 16, color: "#111" }}>
                  科目を選択
                </Text>

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <Pressable
                    onPress={() => {
                      setMode("add");
                      setInput("");
                      scrollToForm();
                    }}
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 10,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: "#ddd",
                    }}
                  >
                    <Text style={{ fontWeight: "900", color: "#111" }}>追加</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      if (!canEdit) return;
                      setMode("edit");
                      setInput(value ?? "");
                      scrollToForm();
                    }}
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 10,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: "#ddd",
                      opacity: canEdit ? 1 : 0.4,
                    }}
                  >
                    <Text style={{ fontWeight: "900", color: "#111" }}>編集</Text>
                  </Pressable>

                <Pressable
  onPress={() => setOpen(false)}
  style={{
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  }}
>
  <Text style={{ fontWeight: "900", color: "#ff8a3d" }}>完了</Text>
</Pressable>

                </View>
              </View>

              {/* モード別UI */}
              {mode === "pick" && (
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: "#eee",
                    borderRadius: 12,
                    overflow: "hidden",
                  }}
                >
                  <Picker
                    selectedValue={value}
                    onValueChange={(v) => onChange(String(v))}
                    itemStyle={{ color: "#111" }}
                  >
                    {pickerItems.map((s) => (
                      <Picker.Item key={s} label={s} value={s} />
                    ))}
                  </Picker>
                </View>
              )}

              {mode === "add" && (
                <View style={{ marginTop: 10 }}>
                  <Text style={{ fontWeight: "800", color: "#111", marginBottom: 6 }}>
                    新しい科目名
                  </Text>
                  <TextInput
                    value={input}
                    onChangeText={setInput}
                    placeholder="例：地理、古文、世界史…"
                    placeholderTextColor="#999"
                    onFocus={scrollToForm}
                    style={{
                      borderWidth: 1,
                      borderColor: "#ddd",
                      borderRadius: 12,
                      padding: 12,
                      color: "#111",
                    }}
                  />

                  <Pressable
                    onPress={onAdd}
                    style={{
                      marginTop: 10,
                      backgroundColor: "#ff8a3d",
                      paddingVertical: 12,
                      borderRadius: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "900" }}>追加する</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setMode("pick")}
                    style={{ marginTop: 10, alignItems: "center" }}
                  >
                    <Text style={{ color: "#666", fontWeight: "800" }}>戻る</Text>
                  </Pressable>

                  <View style={{ height: 40 }} />
                </View>
              )}

              {mode === "edit" && (
                <View style={{ marginTop: 10 }}>
                  <Text style={{ fontWeight: "800", color: "#111", marginBottom: 6 }}>
                    科目名を変更（対象：{value}）
                  </Text>
                  <TextInput
                    value={input}
                    onChangeText={setInput}
                    placeholder="新しい科目名"
                    placeholderTextColor="#999"
                    onFocus={scrollToForm}
                    style={{
                      borderWidth: 1,
                      borderColor: "#ddd",
                      borderRadius: 12,
                      padding: 12,
                      color: "#111",
                    }}
                  />

                  <Pressable
                    onPress={onRename}
                    style={{
                      marginTop: 10,
                      backgroundColor: "#ff8a3d",
                      paddingVertical: 12,
                      borderRadius: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "900" }}>変更する</Text>
                  </Pressable>

                  <Pressable
                    onPress={onDelete}
                    style={{
                      marginTop: 10,
                      borderWidth: 1,
                      borderColor: "#ff8a3d",
                      paddingVertical: 12,
                      borderRadius: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#ff8a3d", fontWeight: "900" }}>
                      この科目を削除
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setMode("pick")}
                    style={{ marginTop: 10, alignItems: "center" }}
                  >
                    <Text style={{ color: "#666", fontWeight: "800" }}>戻る</Text>
                  </Pressable>

                  <View style={{ height: 40 }} />
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
