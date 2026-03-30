//lib/i18n/config.ts
export const SUPPORTED_LANGUAGES = ['en', 'fr'] as const

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en'

export function isSupportedLanguage(value: string): value is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(value as SupportedLanguage)
}