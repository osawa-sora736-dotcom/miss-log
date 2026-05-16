import AsyncStorage from "@react-native-async-storage/async-storage";
import { openBrowserAsync } from "expo-web-browser";

export const TERMS_URL = "https://miss-log.vercel.app/terms";
export const PRIVACY_URL = "https://miss-log.vercel.app/privacy";

const LEGAL_ACCEPTED_KEY = "misslog:legalAccepted:v1";

export async function hasAcceptedLegal() {
  return (await AsyncStorage.getItem(LEGAL_ACCEPTED_KEY)) === "true";
}

export async function acceptLegal() {
  await AsyncStorage.setItem(LEGAL_ACCEPTED_KEY, "true");
}

export async function openTerms() {
  await openBrowserAsync(TERMS_URL);
}

export async function openPrivacy() {
  await openBrowserAsync(PRIVACY_URL);
}
