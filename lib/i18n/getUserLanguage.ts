import {
  DEFAULT_LANGUAGE,
  isSupportedLanguage,
  type SupportedLanguage,
} from "./config";

type UserLanguageSource = {
  settings?: {
    localization?: {
      language?: string | null;
    } | null;
  } | null;
};

export function getUserLanguageFromDoc(
  userDoc: UserLanguageSource | null | undefined,
): SupportedLanguage {
  const value = userDoc?.settings?.localization?.language;

  if (typeof value === "string" && isSupportedLanguage(value)) {
    return value;
  }

  return DEFAULT_LANGUAGE;
}