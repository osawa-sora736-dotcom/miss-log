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
        記録があなたの{"\n"}強みになる。
      </OnboardingTitle>
      <OnboardingBody>
        受験にも仕事にも{"\n"}つかえます。
      </OnboardingBody>
    </OnboardingFrame>
  );
}
