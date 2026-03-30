import { en } from './dictionaries/en'
import { fr } from './dictionaries/fr'
import type { SupportedLanguage } from './config'

export function getDictionary(language: SupportedLanguage) {
  switch (language) {
    case 'fr':
      return fr
    case 'en':
    default:
      return en
  }
}