import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";

function FloatingOrbs() {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(a, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(a, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [a]);

  const t1 = a.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const t2 = a.interpolate({ inputRange: [0, 1], outputRange: [0, 12] });

  return (
    <View style={{ position: "absolute", inset: 0 }}>
      <Animated.View
        style={{
          position: "absolute",
          top: 80,
          right: -50,
          width: 240,
          height: 240,
          borderRadius: 120,
          backgroundColor: "#ff8a3d",
          opacity: 0.08,
          transform: [{ translateY: t1 }],
        }}
      />
      <Animated.View
        style={{
          position: "absolute",
          bottom: 160,
          left: -70,
          width: 280,
          height: 280,
          borderRadius: 140,
          backgroundColor: "#111",
          opacity: 0.05,
          transform: [{ translateY: t2 }],
        }}
      />
    </View>
  );
}

function Card({
  title,
  body,
  delayMs,
}: {
  title: string;
  body: string;
  delayMs: number;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: 520,
      delay: delayMs,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [v, delayMs]);

  const opacity = v;
  const rise = v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY: rise }],
        marginTop: 12,
        padding: 16,
        borderRadius: 20,
        backgroundColor: "#f6f6f6",
        borderWidth: 1,
        borderColor: "#eee",
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        elevation: 2,
      }}
    >
      <Text style={{ fontSize: 14, fontWeight: "900", color: "#111" }}>{title}</Text>
      <Text style={{ marginTop: 8, fontSize: 14, color: "#333", lineHeight: 22 }}>{body}</Text>
    </Animated.View>
  );
}

function GhostButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 14,
        borderRadius: 18,
        backgroundColor: "#e9e9e9",
        alignItems: "center",
      }}
    >
      <Text style={{ color: "#111", fontWeight: "900", fontSize: 16 }}>{label}</Text>
    </Pressable>
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  const s = useRef(new Animated.Value(1)).current;
  const onPressIn = () =>
    Animated.timing(s, { toValue: 0.98, duration: 80, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.timing(s, { toValue: 1, duration: 120, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ transform: [{ scale: s }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={{
          paddingVertical: 14,
          borderRadius: 18,
          backgroundColor: "#111",
          alignItems: "center",
          shadowColor: "#000",
          shadowOpacity: 0.12,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 8 },
          elevation: 3,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function Onboarding2() {
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter]);

  const opacity = enter;
  const rise = enter.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <FloatingOrbs />

      <View style={{ flex: 1, padding: 22, justifyContent: "space-between" }}>
        <Animated.View style={{ opacity, transform: [{ translateY: rise }] }}>
          <Text style={{ fontSize: 24, fontWeight: "900", color: "#111" }}>
            使い方は、これだけ
          </Text>
          <Text style={{ marginTop: 8, fontSize: 13, color: "#666" }}>
            1分でミスの記録ができる
          </Text>

          <Card title="① 追加タブ" body="解けなかった問題、間違えた理由を記録" delayMs={80} />
          <Card title="② カレンダータブ、復習タブ" body="定期的にミスを思い出そう" delayMs={160} />
          <Card title="③ 一覧タブ" body="自分のしたミスを、一覧で学習" delayMs={240} />

          <Text style={{ marginTop: 16, fontSize: 15, fontWeight: "900", color: "#111" }}>
            ミスを記録、蓄積して武器にしよう。
          </Text>
        </Animated.View>

        <View style={{ gap: 10 }}>
          <GhostButton label="戻る" onPress={() => router.back()} />
          <PrimaryButton label="次へ" onPress={() => router.push("/(onboarding)/step3")} />
        </View>
      </View>
    </View>
  );
}
