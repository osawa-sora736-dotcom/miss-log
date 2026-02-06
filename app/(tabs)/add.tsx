// app/(tabs)/add.tsx
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  Alert,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";

import { insertMistake, insertMistakePhotos } from "../../lib/db";
import { SubjectPickerModal, Subject } from "../../components/SubjectPickerModal";
import { PhotoGallery } from "../_components/PhotoGallery";

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

const formatDate = (d: Date) => {
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  const hh = d.getHours();
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${mi}`;
};

const dateParamToDate = (dateParam: string) => {
  const parts = dateParam.split("-");
  if (parts.length !== 3) return null;

  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d))
    return null;

  const dt = new Date(y, m - 1, d, 12, 0, 0);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
};

type PickedPhoto = { uri: string };

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

export default function AddScreen() {
  const params = useLocalSearchParams<{ date?: string; from?: string }>();

  const [occurredAt, setOccurredAt] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const [subject, setSubject] = useState<Subject>("英語");
  const [importance, setImportance] = useState<1 | 2 | 3>(2);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const [toast, setToast] = useState("");
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);

  const photosDir = useMemo(() => {
    const base: string =
      (FileSystem as any).documentDirectory ?? (FileSystem as any).cacheDirectory ?? "";
    return `${base}mistake-photos/`;
  }, []);

  const showToast = (msg: string, ms = 1500) => {
    setToast(msg);
    setTimeout(() => setToast(""), ms);
  };

  const resetFormToNow = useCallback(() => {
    setOccurredAt(new Date());
    setSubject("英語");
    setImportance(2);
    setTitle("");
    setBody("");
    setPhotos([]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      const dp = typeof params.date === "string" ? params.date : undefined;

      if (dp) {
        const dt = dateParamToDate(dp);
        if (dt) setOccurredAt(dt);
        else setOccurredAt(new Date());
      } else {
        setOccurredAt(new Date());
      }
      setShowPicker(false);
    }, [params.date])
  );

  const pickPhotos = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showToast("写真へのアクセスが必要です");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 0,
      quality: 1,
    });

    if (result.canceled) return;

    const newOnes: PickedPhoto[] = result.assets
      .filter((a) => !!a.uri)
      .map((a) => ({ uri: a.uri }));

    setPhotos((prev) => [...prev, ...newOnes]);
  };

  const removePhotoAt = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const onCancel = () => {
    resetFormToNow();
    
    // ✅ 修正ポイント: 戻る場所を明示
    if (params.from === "calendar") {
      router.push("/calendar");
    } else {
      // 通常（タブ）からの場合は一覧画面へ飛ばす（backは使わない）
      router.replace("/");
    }
  };

  const onSave = async () => {
    const t = title.trim();
    const b = body.trim();

    if (!t) return showToast("タイトルを入力してください");
    if (!b) return showToast("内容を入力してください");

    try {
      const savedPhotoUris = photos.map((p) => p.uri);

      const mistakeId = await insertMistake({
        title: t,
        body: b,
        subject,
        importance,
        occurred_at: occurredAt.toISOString(),
      });

      if (savedPhotoUris.length > 0) {
        if (photosDir) {
           await ensureDir(photosDir);
           const finalUris = [];
           for(const uri of savedPhotoUris) {
             const fileName = genFileName(uri);
             const dest = `${photosDir}${fileName}`;
             await FileSystem.copyAsync({ from: uri, to: dest });
             finalUris.push(dest);
           }
           await insertMistakePhotos(mistakeId, finalUris);
        }
      }

      Keyboard.dismiss();
      resetFormToNow();

      // ✅ 修正ポイント: 保存後も確実に移動させる（エラー回避）
      if (params.from === "calendar") {
        router.push("/calendar");
      } else {
        // デフォルトの場合は一覧（ホーム）に戻る
        // router.back() をやめて replace("/") にすることで「戻り先なしエラー」を回避
        router.replace("/");
      }

    } catch (e: any) {
      console.log("save error:", e);
      Alert.alert("保存失敗", `原因: ${e.message}`);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: "#eee",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#fff",
        }}
      >
        {/* カレンダー経由のときだけキャンセルボタン表示 */}
        {params.from === "calendar" ? (
          <Pressable onPress={onCancel} style={{ paddingVertical: 6, paddingRight: 10 }}>
            <Text style={{ color: "#ff8a3d", fontWeight: "900" }}>キャンセル</Text>
          </Pressable>
        ) : (
          <View style={{ width: 72 }} />
        )}

      

        <View style={{ width: 72 }} />
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 36 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={{ fontWeight: "800", marginBottom: 6, color: "#111" }}>日時</Text>
          <Pressable
            onPress={() => setShowPicker(true)}
            style={{
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 12,
              padding: 12,
              marginBottom: 14,
            }}
          >
            <Text style={{ fontWeight: "800", color: "#111" }}>
              {formatDate(occurredAt)}
            </Text>
            <Text style={{ marginTop: 4, fontSize: 12, color: "#111", opacity: 0.6 }}>
              タップで変更
            </Text>
          </Pressable>

          {showPicker && (
            <DateTimePicker
              value={occurredAt}
              mode="datetime"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              locale="ja-JP"
              textColor="black"
              onChange={(_, date) => {
                setShowPicker(false);
                if (date) setOccurredAt(date);
              }}
            />
          )}

          <Text style={{ fontWeight: "800", marginBottom: 6, color: "#111" }}>科目</Text>
          <SubjectPickerModal value={subject} onChange={setSubject} />

          <Text style={{ fontWeight: "800", marginBottom: 6, color: "#111" }}>重要度</Text>
          <View style={{ flexDirection: "row", marginBottom: 14 }}>
            <Chip label="Low" selected={importance === 1} onPress={() => setImportance(1)} />
            <Chip label="Mid" selected={importance === 2} onPress={() => setImportance(2)} />
            <Chip label="High" selected={importance === 3} onPress={() => setImportance(3)} />
          </View>

          <Text style={{ fontWeight: "800", marginBottom: 6, color: "#111" }}>タイトル</Text>
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
              marginBottom: 14,
              color: "#111",
              backgroundColor: "#fff"
            }}
            returnKeyType="next"
          />

          <Text style={{ fontWeight: "800", marginBottom: 6, color: "#111" }}>内容</Text>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="例：分母≠０を忘れていた"
            multiline
            style={{
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 12,
              padding: 12,
              minHeight: 140,
              textAlignVertical: "top",
              marginBottom: 14,
              color: "#111",
              backgroundColor: "#fff"
            }}
          />

          <Text style={{ fontWeight: "800", marginBottom: 6, color: "#111" }}>写真</Text>
          <PhotoGallery
            photos={photos.map((p) => ({ uri: p.uri }))}
            onPressAdd={pickPhotos}
            onRemoveAt={removePhotoAt}
            mainAspectRatio={1}
          />

          <Pressable
            onPress={onSave}
            style={{
              marginTop: 14,
              backgroundColor: "#ff8a3d",
              paddingVertical: 14,
              borderRadius: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "900" }}>保存</Text>
          </Pressable>

          {toast ? (
            <Text style={{ marginTop: 10, color: "#ff8a3d", fontWeight: "800" }}>
              {toast}
            </Text>
          ) : null}

          <View style={{ height: 80 }} />
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}