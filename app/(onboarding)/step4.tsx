import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppColors } from "../../constants/app-theme";

export default function Onboarding4() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: AppColors.primarySoft }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 22, paddingBottom: 28 }}>
        <View style={{ flex: 1, justifyContent: "space-between" }}>
          <View>
            <Text style={{ fontSize: 26, lineHeight: 34, fontWeight: "700", color: "#0F172A" }}>
              現在、ミスログは無料で利用できます。
            </Text>
            <Text style={{ marginTop: 12, fontSize: 15, lineHeight: 25, color: "#334155" }}>
              今後、一部機能を有料プランとして提供する可能性があります。
            </Text>
          </View>

          <View style={{ marginTop: 24, gap: 10 }}>
            <Pressable
              onPress={() => router.back()}
              style={{
                paddingVertical: 14,
                borderRadius: 16,
                backgroundColor: "#fff",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#BAE6FD",
              }}
            >
              <Text style={{ color: "#0F172A", fontWeight: "700" }}>戻る</Text>
            </Pressable>
            <Pressable
              onPress={() => router.replace("/(tabs)/add")}
              style={{
                paddingVertical: 15,
                borderRadius: 16,
                backgroundColor: AppColors.primaryDark,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                無料ではじめる
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
