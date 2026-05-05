import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppColors } from "../../constants/app-theme";

export default function Onboarding1() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 22, paddingBottom: 28 }}>
        <View style={{ flex: 1, justifyContent: "space-between" }}>
          <View>
            <View
              style={{
                alignSelf: "flex-start",
                paddingVertical: 7,
                paddingHorizontal: 12,
                borderRadius: 999,
                backgroundColor: AppColors.primarySoft,
              }}
            >
              <Text style={{ color: AppColors.primaryDark, fontWeight: "700" }}>
                ミスログ
              </Text>
            </View>

            <Text
              style={{
                marginTop: 22,
                fontSize: 30,
                lineHeight: 39,
                fontWeight: "700",
                color: "#0F172A",
              }}
            >
              同じミスは、もうしない。
            </Text>

            <Text style={{ marginTop: 16, fontSize: 16, lineHeight: 28, color: "#334155" }}>
              ミスログは、失敗を責めるためではなく、次に勝つために残す記録ノートです。
            </Text>

            <View style={{ marginTop: 24, gap: 10 }}>
              {[
                "なぜ間違えたかを短く残す",
                "復習タイミングで思い出す",
                "試験前や仕事前に見返す",
              ].map((text) => (
                <View
                  key={text}
                  style={{
                    padding: 14,
                    borderRadius: 16,
                    backgroundColor: "#F8FAFC",
                    borderWidth: 1,
                    borderColor: "#E2E8F0",
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#0F172A" }}>
                    {text}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <Pressable
            onPress={() => router.push("/(onboarding)/step2")}
            style={{
              marginTop: 24,
              paddingVertical: 15,
              borderRadius: 16,
              backgroundColor: AppColors.primaryDark,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>次へ</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

