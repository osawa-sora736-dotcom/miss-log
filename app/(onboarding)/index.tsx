// app/(onboarding)/index.tsx
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
          top: 90,
          left: -40,
          width: 220,
          height: 220,
          borderRadius: 110,
          backgroundColor: "#ff8a3d",
          opacity: 0.08,
          transform: [{ translateY: t1 }],
        }}
      />
      <Animated.View
        style={{
          position: "absolute",
          bottom: 140,
          right: -60,
          width: 260,
          height: 260,
          borderRadius: 130,
          backgroundColor: "#111",
          opacity: 0.05,
          transform: [{ translateY: t2 }],
        }}
      />
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
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
        <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export default function Onboarding1() {
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter]);

  const fade = enter;
  const rise = enter.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <FloatingOrbs />

      <View style={{ flex: 1, padding: 22, justifyContent: "space-between" }}>
        <Animated.View style={{ opacity: fade, transform: [{ translateY: rise }] }}>
          <Text
            style={{
              fontSize: 30,
              fontWeight: "900",
              color: "#111",
              letterSpacing: 0.2,
            }}
          >
            二度と同じミスをしない
          </Text>

          <Text
            style={{
              marginTop: 18,
              fontSize: 16,
              color: "#333",
              lineHeight: 28,
            }}
          >
            このアプリは{"\n"}
            <Text style={{ fontWeight: "900", color: "#111" }}>
              「間違えたこと」だけ
            </Text>
            を記録する学習ノートです
            {"\n\n"}
            もう紙のノートは、要らない{"\n"}
            いつでも、どこでも、隙間時間でも{"\n"}
            <Text style={{ fontWeight: "900", color: "#111" }}>
              自分のミスと向き合おう
            </Text>
            
          </Text>
        </Animated.View>

        <PrimaryButton
          label="次へ"
          onPress={() => router.push("/(onboarding)/step2")}
        />
      </View>
    </View>
  );
}
