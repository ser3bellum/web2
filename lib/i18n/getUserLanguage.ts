// lib/i18n/getUserLanguage.ts
import type { SupportedLanguage } from "@/lib/i18n/config";

const SUPPORTED_LANGUAGES: SupportedLanguage[] = ["en", "fr"];

function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return typeof value === "string" && SUPPORTED_LANGUAGES.includes(value as SupportedLanguage);
}

type LanguageSourceDoc = {
  initialLanguage?: string | null;
  settings?: {
    localization?: {
      language?: string | null;
    };
  };
};

export function getUserLanguageFromDoc(
  user: LanguageSourceDoc | null | undefined,
): SupportedLanguage {
  const settingsLanguage = user?.settings?.localization?.language;
  if (isSupportedLanguage(settingsLanguage)) {
    return settingsLanguage;
  }

  const initialLanguage = user?.initialLanguage;
  if (isSupportedLanguage(initialLanguage)) {
    return initialLanguage;
  }

  return "en";
}