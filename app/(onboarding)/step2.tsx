import { router } from "expo-router";
import { OnboardingBody, OnboardingFrame, OnboardingTitle } from "./OnboardingFrame";

export default function Onboarding2() {
  return (
    <OnboardingFrame
      primaryLabel="次へ"
      onBack={() => router.back()}
      onPrimary={() => router.push("/(onboarding)/step3")}
    >
      <OnboardingTitle>
        積み重ねた記録が{"\n"}あなたの強みになる。
      </OnboardingTitle>
      <OnboardingBody>
        受験にも仕事にも{"\n"}つかえます。
      </OnboardingBody>
    </OnboardingFrame>
  );
}
