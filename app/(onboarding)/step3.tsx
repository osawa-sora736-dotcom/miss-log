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

export default function Onboarding3() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 22, paddingBottom: 28 }}>
        <View style={{ flex: 1, justifyContent: "space-between" }}>
          <View>
            <Text style={{ fontSize: 26, lineHeight: 34, fontWeight: "700", color: "#0F172A" }}>
              いつでもどこでもミスを復習
            </Text>
            <Text style={{ marginTop: 12, fontSize: 15, lineHeight: 25, color: "#334155" }}>
              思い出したいタイミングで、必要なミスだけ見返せます。
            </Text>

            <View style={{ marginTop: 22, gap: 10 }}>
              <Feature
                title="カレンダーで見返す"
                body="いつ、どんなミスをしたかを日付ごとに確認できます。"
              />
              <Feature
                title="ランダム復習"
                body="毎日3件のミスを選んで、忘れかけた頃に思い出せます。"
              />
              <Feature
                title="印刷して持ち歩く"
                body="大事なミスを選んで、試験前や仕事前の確認に使えます。"
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
              onPress={() => router.push("/(onboarding)/step4")}
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
