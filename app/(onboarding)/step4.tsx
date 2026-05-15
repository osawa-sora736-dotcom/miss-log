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
        現在、ミスログは{"\n"}無料で利用できます。
      </OnboardingTitle>
      <OnboardingBody>
        今後、一部機能を有料プランとして{"\n"}提供する可能性があります。
      </OnboardingBody>
    </OnboardingFrame>
  );
}
