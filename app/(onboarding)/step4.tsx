import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppColors } from "../../constants/app-theme";

export default function Onboarding4() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FCFF" }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 22, paddingBottom: 28 }}>
        <View style={{ flex: 1, justifyContent: "space-between", overflow: "hidden" }}>
          <View
            style={{
              position: "absolute",
              top: 44,
              right: -54,
              width: 168,
              height: 168,
              borderRadius: 84,
              backgroundColor: "#BAE6FD",
              opacity: 0.5,
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: 106,
              left: -44,
              width: 128,
              height: 128,
              borderRadius: 64,
              backgroundColor: "#E0F2FE",
            }}
          />

          <View style={{ flex: 1, justifyContent: "center" }}>
            <View
              style={{
                alignSelf: "center",
                width: 156,
                height: 156,
                borderRadius: 78,
                backgroundColor: "#E0F2FE",
                borderWidth: 1,
                borderColor: "#7DD3FC",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 18, color: AppColors.primaryDark, fontWeight: "800" }}>
                はじめる
              </Text>
              <Text style={{ marginTop: 5, fontSize: 30, color: "#0F172A", fontWeight: "800" }}>
                無料
              </Text>
            </View>

            <Text
              style={{
                marginTop: 30,
                fontSize: 26,
                lineHeight: 36,
                fontWeight: "800",
                color: "#0F172A",
                textAlign: "center",
              }}
            >
              現在、ミスログは{"\n"}無料で利用できます。
            </Text>
            <Text
              style={{
                marginTop: 14,
                fontSize: 15,
                lineHeight: 25,
                color: "#0F172A",
                textAlign: "center",
              }}
            >
              今後、一部機能を有料プランとして提供する可能性があります。
            </Text>
          </View>

          <View style={{ marginTop: 24, gap: 10 }}>
            <Pressable
              onPress={() => router.back()}
              style={{
                paddingVertical: 14,
                borderRadius: 18,
                backgroundColor: "#fff",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#BAE6FD",
              }}
            >
              <Text style={{ color: "#0F172A", fontWeight: "800" }}>戻る</Text>
            </Pressable>
            <Pressable
              onPress={() => router.replace("/(tabs)/add")}
              style={{
                paddingVertical: 15,
                borderRadius: 18,
                backgroundColor: AppColors.primaryDark,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>
                無料ではじめる
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
