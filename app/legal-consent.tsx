import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { acceptLegal, openPrivacy, openTerms } from "../lib/legal";
import { getMistakeCount } from "../lib/db";
import { AppColors } from "../constants/app-theme";

export default function LegalConsentScreen() {
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);

  const onStart = async () => {
    if (!checked || busy) return;
    setBusy(true);
    await acceptLegal();
    router.replace(getMistakeCount() > 0 ? ("/(tabs)" as any) : "/(onboarding)");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FCFF" }}>
      <View style={{ flex: 1, padding: 22, justifyContent: "center" }}>
        <View
          style={{
            borderWidth: 1,
            borderColor: "#BAE6FD",
            borderRadius: 24,
            padding: 22,
            backgroundColor: "#fff",
          }}
        >
          <Text style={{ fontSize: 26, lineHeight: 34, fontWeight: "800", color: "#0F172A" }}>
            はじめる前に
          </Text>
          <Text style={{ marginTop: 14, fontSize: 15, lineHeight: 25, color: "#0F172A" }}>
            ミスログの利用規約とプライバシーポリシーを確認してください。内容は公式サイトで更新されます。
          </Text>

          <View style={{ marginTop: 22, gap: 10 }}>
            <LegalButton label="利用規約を確認" onPress={openTerms} />
            <LegalButton label="プライバシーポリシーを確認" onPress={openPrivacy} />
          </View>

          <Pressable
            onPress={() => setChecked((current) => !current)}
            style={{ marginTop: 22, flexDirection: "row", alignItems: "center", gap: 10 }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 7,
                borderWidth: 2,
                borderColor: checked ? AppColors.primaryDark : "#94A3B8",
                backgroundColor: checked ? AppColors.primaryDark : "#fff",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {checked ? <Text style={{ color: "#fff", fontWeight: "900" }}>✓</Text> : null}
            </View>
            <Text style={{ flex: 1, fontSize: 14, lineHeight: 22, color: "#0F172A" }}>
              利用規約とプライバシーポリシーに同意します。
            </Text>
          </Pressable>

          <Pressable
            onPress={onStart}
            disabled={!checked || busy}
            style={{
              marginTop: 22,
              paddingVertical: 15,
              borderRadius: 18,
              backgroundColor: checked ? AppColors.primaryDark : "#CBD5E1",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>
              ミスログをはじめる
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function LegalButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 13,
        paddingHorizontal: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#BAE6FD",
        backgroundColor: "#F8FCFF",
      }}
    >
      <Text style={{ color: AppColors.primaryDark, fontWeight: "800" }}>{label}</Text>
    </Pressable>
  );
}
