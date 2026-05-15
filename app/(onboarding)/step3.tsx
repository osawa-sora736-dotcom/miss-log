import { router } from "expo-router";
import { Text, View } from "react-native";
import { OnboardingFrame, OnboardingTitle } from "./OnboardingFrame";

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <View
      style={{
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 18,
        backgroundColor: "rgba(255, 255, 255, 0.82)",
        borderWidth: 1,
        borderColor: "#BAE6FD",
      }}
    >
      <Text style={{ fontSize: 15, fontWeight: "800", color: "#0F172A" }}>{title}</Text>
      <Text style={{ marginTop: 5, fontSize: 13, lineHeight: 20, color: "#0F172A" }}>
        {body}
      </Text>
    </View>
  );
}

export default function Onboarding3() {
  return (
    <OnboardingFrame
      primaryLabel="次へ"
      onBack={() => router.back()}
      onPrimary={() => router.push("/(onboarding)/step4")}
    >
      <OnboardingTitle>
        いつでもどこでも{"\n"}ミスを復習
      </OnboardingTitle>
      <View style={{ marginTop: 28, gap: 10 }}>
        <Feature title="カレンダーで見返す" body="いつ、どんなミスをしたかを日付ごとに確認。" />
        <Feature title="ランダム復習" body="毎日3件を選んで、忘れかけた頃に思い出す。" />
        <Feature title="印刷して持ち歩く" body="大事なミスだけ選んで、試験前や仕事前に確認。" />
      </View>
    </OnboardingFrame>
  );
}
