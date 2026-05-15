import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppColors } from "../constants/app-theme";

function NoticeCard({ title, body }: { title: string; body: string }) {
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
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: AppColors.primarySoft }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 36 }}>
        <Pressable onPress={() => router.back()} style={{ alignSelf: "flex-start" }}>
          <Text style={{ color: AppColors.primaryDark, fontWeight: "700" }}>戻る</Text>
        </Pressable>

        <View style={{ marginTop: 24 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: AppColors.primaryDark }}>
            利用料金について
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
            現在は無料で利用できます。
          </Text>
          <Text style={{ marginTop: 12, fontSize: 15, lineHeight: 24, color: "#334155" }}>
            今後、バックアップ、印刷用エクスポート、記録件数の拡張など、一部機能を有料プランとして提供する可能性があります。
          </Text>
        </View>

        <View style={{ marginTop: 14, gap: 10 }}>
          <NoticeCard
            title="有料化する場合は事前にお知らせします"
            body="アプリ内または公式サイトで、価格や対象機能をわかりやすく案内します。"
          />
          <NoticeCard
            title="現在のデータを大切に扱います"
            body="記録したミスや写真は、ユーザー自身が確認できるよう配慮します。"
          />
          <NoticeCard
            title="まずは無料で改善を続けます"
            body="使いやすさ、バックアップ、印刷、復習機能をリリース後も磨いていきます。"
          />
        </View>

        <Pressable
          onPress={() => router.replace("/(tabs)" as any)}
          style={{
            marginTop: 22,
            paddingVertical: 15,
            borderRadius: 16,
            backgroundColor: AppColors.primaryDark,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
            アプリに戻る
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
