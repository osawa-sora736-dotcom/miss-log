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
        今後、一部機能を有料にする場合がありますが、{"\n"}その際は事前にお知らせします。
      </OnboardingBody>
    </OnboardingFrame>
  );
}
