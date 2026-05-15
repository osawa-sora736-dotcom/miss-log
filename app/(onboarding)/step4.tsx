import { router } from "expo-router";
import { OnboardingBody, OnboardingFrame, OnboardingTitle } from "./OnboardingFrame";

export default function Onboarding4() {
  return (
    <OnboardingFrame
      primaryLabel="無料ではじめる"
      onBack={() => router.back()}
      onPrimary={() => router.replace("/(tabs)/add")}
    >
      <OnboardingTitle>
        まずは無料で{"\n"}はじめられます。
      </OnboardingTitle>
      <OnboardingBody>
        今後、一部機能が有料になる場合は{"\n"}事前にお知らせします。
      </OnboardingBody>
    </OnboardingFrame>
  );
}
