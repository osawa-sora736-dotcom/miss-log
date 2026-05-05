import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppColors } from "../../constants/app-theme";

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <View
      style={{
        padding: 15,
        borderRadius: 18,
        backgroundColor: "#F8FAFC",
        borderWidth: 1,
        borderColor: "#E2E8F0",
      }}
    >
      <Text style={{ fontSize: 15, fontWeight: "700", color: "#0F172A" }}>{title}</Text>
      <Text style={{ marginTop: 7, fontSize: 13, lineHeight: 21, color: "#475569" }}>
        {body}
      </Text>
    </View>
  );
}

export default function Onboarding2() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 22, paddingBottom: 28 }}>
        <View style={{ flex: 1, justifyContent: "space-between" }}>
          <View>
            <Text style={{ fontSize: 26, lineHeight: 34, fontWeight: "700", color: "#0F172A" }}>
              記録は、あなたの強みになる。
            </Text>
            <Text style={{ marginTop: 12, fontSize: 15, lineHeight: 25, color: "#334155" }}>
              受験でも仕事でも、伸びる人は「次にどうするか」を残しています。
            </Text>

            <View style={{ marginTop: 22, gap: 10 }}>
              <Feature
                title="ミスを1分で記録"
                body="タイトル、科目、重要度、写真を残して、あとで思い出しやすくします。"
              />
              <Feature
                title="復習で忘れにくく"
                body="昨日・1週間前・先月・ランダムのミスを見返して、同じ失敗を減らします。"
              />
              <Feature
                title="印刷して持ち歩ける"
                body="大事なミスだけを絞り込んで、試験前や仕事前の見返し用にできます。"
              />
            </View>
          </View>

          <View style={{ marginTop: 24, gap: 10 }}>
            <Pressable
              onPress={() => router.back()}
              style={{
                paddingVertical: 14,
                borderRadius: 16,
                backgroundColor: "#F1F5F9",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#0F172A", fontWeight: "700" }}>戻る</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/(onboarding)/step3")}
              style={{
                paddingVertical: 15,
                borderRadius: 16,
                backgroundColor: AppColors.primaryDark,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>次へ</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

