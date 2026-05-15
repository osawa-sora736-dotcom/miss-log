import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppColors } from "../../constants/app-theme";

export default function Onboarding1() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FCFF" }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 22, paddingBottom: 28 }}>
        <View style={{ flex: 1, justifyContent: "space-between", overflow: "hidden" }}>
          <View
            style={{
              position: "absolute",
              top: 34,
              right: -72,
              width: 190,
              height: 190,
              borderRadius: 95,
              backgroundColor: "#BAE6FD",
              opacity: 0.55,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: 190,
              left: -54,
              width: 128,
              height: 128,
              borderRadius: 64,
              backgroundColor: "#E0F2FE",
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: 118,
              right: 32,
              width: 78,
              height: 78,
              borderRadius: 39,
              backgroundColor: "#7DD3FC",
              opacity: 0.35,
            }}
          />

          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <View
              style={{
                paddingVertical: 8,
                paddingHorizontal: 15,
                borderRadius: 999,
                backgroundColor: "#E0F2FE",
                borderWidth: 1,
                borderColor: "#BAE6FD",
              }}
            >
              <Text style={{ color: AppColors.primaryDark, fontWeight: "800" }}>ミスログ</Text>
            </View>

            <Text
              style={{
                marginTop: 26,
                fontSize: 34,
                lineHeight: 43,
                fontWeight: "800",
                color: "#0F172A",
                textAlign: "center",
              }}
            >
              同じミスは{"\n"}もうしない
            </Text>

            <Text
              style={{
                marginTop: 18,
                fontSize: 16,
                lineHeight: 27,
                color: "#0F172A",
                textAlign: "center",
              }}
            >
              ミスログはあなたのための{"\n"}記録ノートです。
            </Text>
          </View>

          <Pressable
            onPress={() => router.push("/(onboarding)/step2")}
            style={{
              marginTop: 24,
              paddingVertical: 15,
              borderRadius: 18,
              backgroundColor: AppColors.primaryDark,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>次へ</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
