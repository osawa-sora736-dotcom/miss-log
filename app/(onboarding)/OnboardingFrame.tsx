import { type ReactNode, useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppColors } from "../../constants/app-theme";

type Props = {
  children: ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  onBack?: () => void;
};

export function OnboardingFrame({ children, primaryLabel, onPrimary, onBack }: Props) {
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 5200,
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 5200,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [float]);

  const driftA = {
    transform: [
      {
        translateX: float.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -18],
        }),
      },
      {
        translateY: float.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 14],
        }),
      },
    ],
  };

  const driftB = {
    transform: [
      {
        translateX: float.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 16],
        }),
      },
      {
        translateY: float.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -12],
        }),
      },
    ],
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FCFF" }}>
      <View style={{ flex: 1, overflow: "hidden" }}>
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              top: -92,
              right: -118,
              width: 276,
              height: 276,
              borderRadius: 138,
              backgroundColor: "#BAE6FD",
              opacity: 0.58,
            },
            driftA,
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              top: 214,
              left: -112,
              width: 216,
              height: 216,
              borderRadius: 108,
              backgroundColor: "#E0F2FE",
              opacity: 0.95,
            },
            driftB,
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              bottom: -78,
              right: -70,
              width: 190,
              height: 190,
              borderRadius: 95,
              backgroundColor: "#7DD3FC",
              opacity: 0.2,
            },
            driftB,
          ]}
        />

        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 22, paddingBottom: 28 }}>
          <View style={{ flex: 1, justifyContent: "space-between" }}>
            <View style={{ flex: 1, justifyContent: "center" }}>{children}</View>

            <View style={{ marginTop: 24, gap: 10 }}>
              {onBack ? (
                <Pressable
                  onPress={onBack}
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
              ) : null}
              <Pressable
                onPress={onPrimary}
                style={{
                  paddingVertical: 15,
                  borderRadius: 18,
                  backgroundColor: AppColors.primaryDark,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>
                  {primaryLabel}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

export function OnboardingTitle({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        fontSize: 34,
        lineHeight: 43,
        fontWeight: "800",
        color: "#0F172A",
        textAlign: "center",
      }}
    >
      {children}
    </Text>
  );
}

export function OnboardingBody({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        marginTop: 18,
        fontSize: 16,
        lineHeight: 27,
        color: "#0F172A",
        textAlign: "center",
      }}
    >
      {children}
    </Text>
  );
}
