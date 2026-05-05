import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppColors } from "../../constants/app-theme";
import { FREE_MISTAKE_LIMIT, SUBSCRIPTION_PRODUCT_ID } from "../../lib/subscription";

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
              まずは無料で、少しだけ。
            </Text>
            <Text style={{ marginTop: 12, fontSize: 15, lineHeight: 25, color: "#334155" }}>
              最初の{FREE_MISTAKE_LIMIT}件は無料で記録できます。続けたいと思えたら、月額300円でミスログProへ。
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
                ミスログ Pro
              </Text>
              <View style={{ flexDirection: "row", alignItems: "flex-end", marginTop: 4 }}>
                <Text style={{ fontSize: 38, fontWeight: "700", color: "#0F172A" }}>300</Text>
                <Text style={{ marginBottom: 8, marginLeft: 4, fontSize: 15, fontWeight: "700" }}>
                  円 / 月
                </Text>
              </View>
              <Text style={{ marginTop: 6, fontSize: 13, lineHeight: 20, color: "#475569" }}>
                コーヒー1杯より安く、毎日のミスを成長の材料として積み上げられます。
              </Text>
            </View>

            <View style={{ marginTop: 16, gap: 10 }}>
              <Point text="記録が増えるほど、自分の弱点と伸びしろが見える" />
              <Point text="受験前・仕事前に、選んだミスを印刷して持ち歩ける" />
              <Point text="商品IDだけ後で接続できる設計で、今はExpo Goで試せる" />
            </View>

            <Text style={{ marginTop: 14, fontSize: 11, lineHeight: 17, color: "#64748B" }}>
              本番サブスクリプションID: {SUBSCRIPTION_PRODUCT_ID}
            </Text>
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

