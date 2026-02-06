// app/_layout.tsx
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initDb } from "../lib/db";

const ONBOARDING_KEY = "onboardingDone";

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState<boolean>(false);

  useEffect(() => {
    initDb();
    console.log("DB init + migrate done");

    (async () => {
      try {
        const v = await AsyncStorage.getItem(ONBOARDING_KEY);
        setOnboardingDone(v === "true");
      } catch (e) {
        console.warn("Failed to read onboarding flag", e);
        setOnboardingDone(false);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // 初回フラグ読み込み前に一瞬(tabs)が出ないようにする
  if (!ready) return null;

  return (
    <Stack
      screenOptions={{
        statusBarStyle: "dark",
        headerStyle: { backgroundColor: "#fff" },
        headerTintColor: "#000",
      }}
    >
      {/* 初回のみオンボーディング */}
      {!onboardingDone ? (
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      ) : (
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      )}

      {/* ミス詳細 */}
      <Stack.Screen
        name="mistake/[id]"
        options={{
          title: "ミス詳細",
          headerBackTitle: "戻る",
        }}
      />
    </Stack>
  );
}
