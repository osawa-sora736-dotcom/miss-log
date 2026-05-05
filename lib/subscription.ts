import AsyncStorage from "@react-native-async-storage/async-storage";

export const FREE_MISTAKE_LIMIT = 3;

// App Store Connectでサブスクリプションを作ったら、このIDだけ差し替える。
export const SUBSCRIPTION_PRODUCT_ID = "misslog_pro_monthly_300";

const PRO_UNLOCK_KEY = "misslogProUnlocked";

export async function isProUnlocked() {
  const value = await AsyncStorage.getItem(PRO_UNLOCK_KEY);
  return value === "true";
}

export async function setProUnlockedForTesting(enabled: boolean) {
  await AsyncStorage.setItem(PRO_UNLOCK_KEY, enabled ? "true" : "false");
}
