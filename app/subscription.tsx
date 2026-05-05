import { router } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  FREE_MISTAKE_LIMIT,
  SUBSCRIPTION_PRODUCT_ID,
  setProUnlockedForTesting,
} from "../lib/subscription";
import { AppColors } from "../constants/app-theme";

function ValueCard({ title, body }: { title: string; body: string }) {
  return (
    <View
      style={{
        padding: 14,
        borderRadius: 16,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#D7EEFA",
      }}
    >
      <Text style={{ fontSize: 15, fontWeight: "700", color: "#0F172A" }}>
        {title}
      </Text>
      <Text style={{ marginTop: 6, fontSize: 13, lineHeight: 20, color: "#475569" }}>
        {body}
      </Text>
    </View>
  );
}

export default function SubscriptionScreen() {
  const onStartTesting = async () => {
    await setProUnlockedForTesting(true);
    Alert.alert("テスト用にProを有効にしました", "Expo Goで続きの動作を確認できます。", [
      { text: "OK", onPress: () => router.replace("/(tabs)/add") },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: AppColors.primarySoft }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 36 }}>
        <Pressable onPress={() => router.back()} style={{ alignSelf: "flex-start" }}>
          <Text style={{ color: AppColors.primaryDark, fontWeight: "700" }}>戻る</Text>
        </Pressable>

        <View style={{ marginTop: 24 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: AppColors.primaryDark }}>
            ミスログ Pro
          </Text>
          <Text
            style={{
              marginTop: 8,
              fontSize: 30,
              lineHeight: 38,
              fontWeight: "700",
              color: "#0F172A",
            }}
          >
            同じミスを、未来の強みに変える。
          </Text>
          <Text style={{ marginTop: 12, fontSize: 15, lineHeight: 24, color: "#334155" }}>
            無料では最初の{FREE_MISTAKE_LIMIT}件まで記録できます。続けて使うなら、月額300円で記録・復習・印刷用エクスポートを開放します。
          </Text>
        </View>

        <View
          style={{
            marginTop: 22,
            padding: 18,
            borderRadius: 20,
            backgroundColor: "#fff",
            borderWidth: 1,
            borderColor: "#BAE6FD",
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#64748B" }}>
            月額
          </Text>
          <View style={{ flexDirection: "row", alignItems: "flex-end", marginTop: 4 }}>
            <Text style={{ fontSize: 40, fontWeight: "700", color: "#0F172A" }}>
              300
            </Text>
            <Text style={{ marginBottom: 8, marginLeft: 4, fontSize: 16, fontWeight: "700" }}>
              円
            </Text>
          </View>
          <Text style={{ marginTop: 8, fontSize: 13, lineHeight: 20, color: "#475569" }}>
            コーヒー1杯より安く、毎日の反省を「伸びるための材料」として残せます。
          </Text>
        </View>

        <View style={{ marginTop: 14, gap: 10 }}>
          <ValueCard
            title="自分が成長していることが見える"
            body="ミスの傾向を残すほど、次に気をつけるポイントがはっきりします。"
          />
          <ValueCard
            title="記録があなたの強みになる"
            body="苦手や失敗を隠すのではなく、改善してきた証拠として積み上げられます。"
          />
          <ValueCard
            title="印刷して持ち歩ける"
            body="試験前や仕事前に、選んだミスだけを印刷用ファイルとして見返せます。"
          />
        </View>

        <Pressable
          onPress={() =>
            Alert.alert(
              "購入機能は準備中です",
              `本番では ${SUBSCRIPTION_PRODUCT_ID} の月額300円サブスクリプションをここに接続します。`
            )
          }
          style={{
            marginTop: 22,
            paddingVertical: 15,
            borderRadius: 16,
            backgroundColor: AppColors.primaryDark,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
            月額300円で続ける
          </Text>
        </Pressable>

        <Pressable
          onPress={onStartTesting}
          style={{
            marginTop: 10,
            paddingVertical: 14,
            borderRadius: 16,
            backgroundColor: "#fff",
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#BAE6FD",
          }}
        >
          <Text style={{ color: AppColors.primaryDark, fontWeight: "700" }}>
            Expo Goでテスト用に開放する
          </Text>
        </Pressable>

        <Text style={{ marginTop: 12, fontSize: 11, lineHeight: 17, color: "#64748B" }}>
          本番購入ID: {SUBSCRIPTION_PRODUCT_ID}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

