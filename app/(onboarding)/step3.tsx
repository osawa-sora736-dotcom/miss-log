import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppColors } from "../../constants/app-theme";

const ONBOARDING_KEY = "onboardingDone";

function Point({ text }: { text: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
      <View
        style={{
          marginTop: 6,
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: AppColors.primaryDark,
        }}
      />
      <Text style={{ flex: 1, fontSize: 14, lineHeight: 22, color: "#334155" }}>{text}</Text>
    </View>
  );
}

export default function Onboarding3() {
  const onStart = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
      router.replace("/(tabs)");
    } catch (e) {
      console.warn(e);
      Alert.alert("エラー", "保存に失敗しました。もう一度お試しください。");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: AppColors.primarySoft }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 22, paddingBottom: 28 }}>
        <View style={{ flex: 1, justifyContent: "space-between" }}>
          <View>
            <Text style={{ fontSize: 26, lineHeight: 34, fontWeight: "700", color: "#0F172A" }}>
              まずは無料で、しっかり使えます。
            </Text>
            <Text style={{ marginTop: 12, fontSize: 15, lineHeight: 25, color: "#334155" }}>
              現在、ミスログは無料で利用できます。今後、一部機能を有料プランとして提供する可能性があります。
            </Text>

            <View
              style={{
                marginTop: 22,
                padding: 18,
                borderRadius: 20,
                backgroundColor: "#fff",
                borderWidth: 1,
                borderColor: "#BAE6FD",
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#64748B" }}>
                今後の予定
              </Text>
              <Text style={{ marginTop: 6, fontSize: 20, lineHeight: 28, fontWeight: "700", color: "#0F172A" }}>
                有料化する場合は、事前にお知らせします。
              </Text>
              <Text style={{ marginTop: 8, fontSize: 13, lineHeight: 20, color: "#475569" }}>
                バックアップ、印刷用エクスポート、記録件数の拡張などを有料プランにする可能性があります。
              </Text>
            </View>

            <View style={{ marginTop: 16, gap: 10 }}>
              <Point text="記録が増えるほど、自分の弱点と伸びしろが見える" />
              <Point text="受験前・仕事前に、選んだミスを印刷して持ち歩ける" />
              <Point text="有料化する場合は、アプリ内または公式サイトで事前に案内" />
            </View>
          </View>

          <View style={{ marginTop: 24, gap: 10 }}>
            <Pressable
              onPress={() => router.back()}
              style={{
                paddingVertical: 14,
                borderRadius: 16,
                backgroundColor: "#fff",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#BAE6FD",
              }}
            >
              <Text style={{ color: "#0F172A", fontWeight: "700" }}>戻る</Text>
            </Pressable>
            <Pressable
              onPress={onStart}
              style={{
                paddingVertical: 15,
                borderRadius: 16,
                backgroundColor: AppColors.primaryDark,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                無料ではじめる
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

