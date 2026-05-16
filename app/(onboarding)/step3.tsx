import { router } from "expo-router";
import { Text, View } from "react-native";
import { OnboardingFrame, OnboardingTitle } from "./OnboardingFrame";

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <View
      style={{
        paddingVertical: 14,
        paddingHorizontal: 15,
        borderRadius: 18,
        backgroundColor: "rgba(255, 255, 255, 0.82)",
        borderWidth: 1,
        borderColor: "#BAE6FD",
      }}
    >
      <Text style={{ fontSize: 17, fontWeight: "800", color: "#0F172A" }}>{title}</Text>
      <Text style={{ marginTop: 7, fontSize: 15, lineHeight: 23, color: "#0F172A" }}>
        {body}
      </Text>
    </View>
  );
}

export default function Onboarding3() {
  return (
    <OnboardingFrame
      primaryLabel="はじめる"
      onBack={() => router.back()}
      onPrimary={() => router.replace("/(tabs)/add")}
    >
      <OnboardingTitle>
        いつでもどこでも{"\n"}ミスを復習
      </OnboardingTitle>
      <View style={{ marginTop: 24, gap: 10 }}>
        <Feature title="カレンダーで見返す" body="いつ、どんなミスをしたかを日付ごとに確認。" />
        <Feature title="ランダム復習" body="毎日3件を選んで、忘れかけた頃に思い出す。" />
        <Feature title="印刷して持ち歩く" body="大事なミスだけ選んで、試験前や仕事前に確認。" />
      </View>
    </OnboardingFrame>
  );
}
