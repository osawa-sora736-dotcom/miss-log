import { router } from "expo-router";
import { OnboardingBody, OnboardingFrame, OnboardingTitle } from "./OnboardingFrame";

export default function Onboarding1() {
  return (
    <OnboardingFrame primaryLabel="次へ" onPrimary={() => router.push("/(onboarding)/step2")}>
      <OnboardingTitle>
        ミスログは{"\n"}記録アプリです
      </OnboardingTitle>
      <OnboardingBody>
        ミスログはあなたのための{"\n"}記録ノートです。
      </OnboardingBody>
    </OnboardingFrame>
  );
}
