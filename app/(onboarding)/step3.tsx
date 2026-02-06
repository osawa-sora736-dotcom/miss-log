import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Alert,
  Animated,
  Easing,
  Pressable,
  Text,
  View,
} from "react-native";

const ONBOARDING_KEY = "onboardingDone";

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
          top: 60,
          left: -50,
          width: 260,
          height: 260,
          borderRadius: 130,
          backgroundColor: "#ff8a3d",
          opacity: 0.09,
          transform: [{ translateY: t1 }],
        }}
      />
      <Animated.View
        style={{
          position: "absolute",
          bottom: 140,
          right: -80,
          width: 320,
          height: 320,
          borderRadius: 160,
          backgroundColor: "#111",
          opacity: 0.05,
          transform: [{ translateY: t2 }],
        }}
      />
    </View>
  );
}

function Box({ title, lines, delayMs }: { title: string; lines: string[]; delayMs: number }) {
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
      <Text style={{ fontSize: 13, fontWeight: "900", color: "#111" }}>{title}</Text>
      <View style={{ marginTop: 10, gap: 6 }}>
        {lines.map((t, i) => (
          <Text key={i} style={{ fontSize: 14, color: "#333", lineHeight: 22 }}>
            {t}
          </Text>
        ))}
      </View>
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
          shadowOpacity: 0.14,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 10 },
          elevation: 4,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function Onboarding3() {
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

  const onStartTemp = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
      router.replace("/(tabs)");
    } catch (e) {
      console.warn(e);
      Alert.alert("エラー", "保存に失敗しました。もう一度お試しください。");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <FloatingOrbs />

      <View style={{ flex: 1, padding: 22, justifyContent: "space-between" }}>
        <Animated.View style={{ opacity, transform: [{ translateY: rise }] }}>
          <Text style={{ fontSize: 24, fontWeight: "900", color: "#111" }}>
            月1回のカフェ代よりも、安い。
          </Text>
          <Text style={{ marginTop: 8, fontSize: 13, color: "#666" }}>
            ミスを潰せたら、元は取れる。
          </Text>

          <Box
            title="サブスクリプション"
            lines={[
              "・月額 330円（税込）",
              "・無料プランはありません",
              "・Apple IDで決済されます",
              "・いつでもiPhoneの設定から解約できます",
            ]}
            delayMs={80}
          />

          <Box
            title="データについて"
            lines={[
              "・学習データは端末内にのみ保存されます",
              "・同期、引継ぎはZIPファイルを用います。クラウド同期をつかわないので、こちらがデータを抜き取ることはありません。"        
              
            ]}
            delayMs={160}
          />

          <Text style={{ marginTop: 16, fontSize: 16, fontWeight: "900", color: "#111" }}>
            自分のミスと向き合う準備は、いいですか？
          </Text>
        </Animated.View>

        <View style={{ gap: 10 }}>
          <GhostButton label="戻る" onPress={() => router.back()} />
          <PrimaryButton label="はじめる" onPress={onStartTemp} />
        </View>
      </View>
    </View>
  );
}
