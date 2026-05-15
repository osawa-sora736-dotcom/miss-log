import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppColors } from "../../constants/app-theme";

export default function Onboarding2() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FCFF" }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 22, paddingBottom: 28 }}>
        <View style={{ flex: 1, justifyContent: "space-between", overflow: "hidden" }}>
          <View
            style={{
              position: "absolute",
              top: 74,
              left: -62,
              width: 180,
              height: 180,
              borderRadius: 90,
              backgroundColor: "#BAE6FD",
              opacity: 0.46,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: 250,
              right: -48,
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: "#38BDF8",
              opacity: 0.18,
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: 108,
              left: 42,
              width: 58,
              height: 58,
              borderRadius: 29,
              backgroundColor: "#7DD3FC",
              opacity: 0.42,
            }}
          />

          <View style={{ flex: 1, justifyContent: "center" }}>
            <Text
              style={{
                fontSize: 32,
                lineHeight: 42,
                fontWeight: "800",
                color: "#0F172A",
                textAlign: "center",
              }}
            >
              記録があなたの{"\n"}強みになる。
            </Text>
            <Text
              style={{
                marginTop: 18,
                fontSize: 17,
                lineHeight: 28,
                color: "#0F172A",
                textAlign: "center",
              }}
            >
              受験にも仕事にも{"\n"}つかえます。
            </Text>

            <View
              style={{
                alignSelf: "center",
                marginTop: 34,
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 999,
                backgroundColor: "#E0F2FE",
                borderWidth: 1,
                borderColor: "#BAE6FD",
              }}
            >
              <Text style={{ color: AppColors.primaryDark, fontWeight: "800" }}>
                ミスは、次の準備になる。
              </Text>
            </View>
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
              onPress={() => router.push("/(onboarding)/step3")}
              style={{
                paddingVertical: 15,
                borderRadius: 18,
                backgroundColor: AppColors.primaryDark,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>次へ</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
