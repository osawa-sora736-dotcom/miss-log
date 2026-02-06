// app/mistake/[id].tsx
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
// ✅ 最新SDK対応
import * as FileSystem from "expo-file-system/legacy";

import {
  deleteMistake,
  getMistakeById,
  getPhotosByMistakeId,
  insertMistakePhotos,
  MistakePhotoRow,
  MistakeRow,
  updateMistake,
  deleteMistakePhoto,
} from "../../lib/db";
import { SubjectPickerModal, Subject } from "../../components/SubjectPickerModal";
import { PhotoGallery } from "../_components/PhotoGallery";

// ❌ ImageViewing のインポートは不要です（PhotoGalleryに入っているため）

const Chip = ({
  label,
  selected,
  onPress,
  tone,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  tone?: "normal" | "danger";
}) => (
  <Pressable
    onPress={onPress}
    style={{
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 14,
      backgroundColor:
        tone === "danger"
          ? selected
            ? "#ff4d4f"
            : "#ffe8e8"
          : selected
          ? "#ff8a3d"
          : "#f2f2f2",
      marginRight: 8,
    }}
  >
    <Text
      style={{
        color:
          tone === "danger"
            ? selected
              ? "#fff"
              : "#d11"
            : selected
            ? "#fff"
            : "#222",
        fontWeight: "800",
      }}
    >
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

export default function MistakeDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const mistakeId = useMemo(() => Number(params.id), [params.id]);

  const [loaded, setLoaded] = useState(false);
  const [row, setRow] = useState<MistakeRow | null>(null);

  const [occurredAt, setOccurredAt] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const [subject, setSubject] = useState<Subject>("英語");
  const [importance, setImportance] = useState<1 | 2 | 3>(2);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const [toast, setToast] = useState("");
  const [photos, setPhotos] = useState<MistakePhotoRow[]>([]);

  // ✅ 写真保存先
  const photosDir = useMemo(() => {
    const base =
      (FileSystem as any).documentDirectory ??
      (FileSystem as any).cacheDirectory ??
      "";
    return `${base}mistake-photos/`;
  }, []);

  const showToast = (msg: string, ms = 1400) => {
    setToast(msg);
    setTimeout(() => setToast(""), ms);
  };

  const reload = () => {
    if (!Number.isFinite(mistakeId) || mistakeId <= 0) return;

    const r = getMistakeById(mistakeId);
    setRow(r);

    if (r) {
      setOccurredAt(new Date(r.occurred_at));
      setSubject((r.subject as Subject) ?? "英語");
      setImportance((r.importance as 1 | 2 | 3) ?? 2);
      setTitle(r.title ?? "");
      setBody(r.body ?? "");
      setPhotos(getPhotosByMistakeId(mistakeId));
    }
  };

  useEffect(() => {
    if (!Number.isFinite(mistakeId) || mistakeId <= 0) return;
    reload();
    setLoaded(true);
  }, [mistakeId]);

  const onSave = () => {
    const t = title.trim();
    const b = body.trim();

    if (!t) return showToast("タイトルを入力してね");
    if (!b) return showToast("内容を入力してね");

    updateMistake({
      id: mistakeId,
      title: t,
      body: b,
      subject,
      importance,
      occurred_at: occurredAt.toISOString(),
    });

    Keyboard.dismiss();
    showToast("保存しました");
    setTimeout(() => router.back(), 150);
  }; // ✅ ここに閉じカッコ「}」が抜けていました！

  // ✅ 追加ロジック
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

    const picked: PickedPhoto[] = result.assets
      .filter((a) => !!a.uri)
      .map((a) => ({ uri: a.uri }));

    if (picked.length === 0) return;

    try {
      await ensureDir(photosDir);

      const savedUris: string[] = [];
      for (const p of picked) {
        const fileName = genFileName(p.uri);
        const dest = `${photosDir}${fileName}`;
        await FileSystem.copyAsync({ from: p.uri, to: dest });
        savedUris.push(dest);
      }

      if (savedUris.length > 0) {
        await insertMistakePhotos(mistakeId, savedUris);
      }

      setPhotos(getPhotosByMistakeId(mistakeId));
      showToast("写真を追加しました");
    } catch (e) {
      console.log(e);
      showToast("写真の追加に失敗しました");
    }
  };

  // ✅ 削除ロジック
  const removePhotoAt = (index: number) => {
    const target = photos[index];
    if (!target) return;

    Alert.alert("写真を削除しますか？", "この写真は元に戻せません。", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMistakePhoto(target.id);
            try {
              const info = await FileSystem.getInfoAsync(target.uri);
              if (info.exists) {
                await FileSystem.deleteAsync(target.uri, { idempotent: true });
              }
            } catch {}

            setPhotos(getPhotosByMistakeId(mistakeId));
            showToast("削除しました");
          } catch (e) {
            console.log(e);
            showToast("削除に失敗しました");
          }
        },
      },
    ]);
  };

  const onDelete = () => {
    Alert.alert("削除しますか？", "このミスは元に戻せません。", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: () => {
          deleteMistake(mistakeId);
          router.back();
        },
      },
    ]);
  };

  if (!loaded) {
    return (
      <View style={{ flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ opacity: 0.6, color: "#111" }}>読み込み中…</Text>
      </View>
    );
  }

  if (!row) {
    return (
      <View style={{ flex: 1, backgroundColor: "#fff", padding: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: "900", color: "#111" }}>見つかりません</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16, backgroundColor: "#111", padding: 12, borderRadius: 12, alignItems: "center" }}>
          <Text style={{ color: "#fff", fontWeight: "900" }}>戻る</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#fff" }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          
          <Text style={{ fontWeight: "900", marginBottom: 6, marginTop: 14, color: "#111" }}>日時</Text>
          <Pressable onPress={() => setShowPicker(true)} style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 12, padding: 12, marginBottom: 14 }}>
            <Text style={{ fontWeight: "900", color: "#111" }}>{formatDate(occurredAt)}</Text>
          </Pressable>
          {showPicker && <DateTimePicker value={occurredAt} mode="datetime" display="spinner" locale="ja-JP" onChange={(_, d) => { setShowPicker(false); if (d) setOccurredAt(d); }} />}

          <Text style={{ fontWeight: "900", marginBottom: 6, color: "#111" }}>科目</Text>
          <SubjectPickerModal value={subject} onChange={setSubject} />

          <Text style={{ fontWeight: "900", marginBottom: 6, color: "#111" }}>重要度</Text>
          <View style={{ flexDirection: "row", marginBottom: 14 }}>
            {[1, 2, 3].map((v) => (
              <Chip key={v} label={v === 1 ? "Low" : v === 2 ? "Mid" : "High"} selected={importance === v} onPress={() => setImportance(v as 1|2|3)} />
            ))}
          </View>

          <Text style={{ fontWeight: "900", marginBottom: 6, color: "#111" }}>タイトル</Text>
          <TextInput value={title} onChangeText={setTitle} style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 12, padding: 12, marginBottom: 14, color: "#111" }} />

          <Text style={{ fontWeight: "900", marginBottom: 6, color: "#111" }}>内容</Text>
          <TextInput value={body} onChangeText={setBody} multiline style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 12, padding: 12, minHeight: 140, textAlignVertical: "top", color: "#111" }} />

          <Text style={{ fontWeight: "900", marginBottom: 6, marginTop: 14, color: "#111" }}>写真</Text>
          
          {/* ✅ PhotoGalleryにImageViewing機能が内蔵されているので、これだけでOKです */}
          <PhotoGallery
            photos={photos.map((p) => ({ uri: p.uri }))}
            onPressAdd={pickPhotos}
            onRemoveAt={removePhotoAt}
            mainAspectRatio={1}
          />
          
          {/* ❌ ここにあった ImageViewing や onPressImage は削除しました */}

          <Pressable onPress={onSave} style={{ marginTop: 10, backgroundColor: "#ff8a3d", padding: 14, borderRadius: 14, alignItems: "center" }}>
            <Text style={{ color: "#fff", fontWeight: "900" }}>保存</Text>
          </Pressable>

          <Pressable onPress={onDelete} style={{ marginTop: 12, backgroundColor: "#ff4d4f", padding: 14, borderRadius: 14, alignItems: "center" }}>
            <Text style={{ color: "#fff", fontWeight: "900" }}>削除</Text>
          </Pressable>

          {toast ? <Text style={{ marginTop: 10, color: "#ff8a3d", fontWeight: "900" }}>{toast}</Text> : null}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}