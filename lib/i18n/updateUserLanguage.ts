import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/clients'
import {
  isSupportedLanguage,
  type SupportedLanguage,
} from './config'

export async function updateUserLanguage(
  userId: string,
  language: string
): Promise<void> {
  if (!isSupportedLanguage(language)) {
    throw new Error('Unsupported language')
  }

  const safeLanguage: SupportedLanguage = language

  await updateDoc(doc(db, 'users', userId), {
    'settings.localization.language': safeLanguage,
  })
}