'use client'

import { useState } from 'react'
import { updateUserLanguage } from '@/lib/i18n/updateUserLanguage'
import type { SupportedLanguage } from '@/lib/i18n/config'

type Props = {
  userId: string
  initialLanguage: SupportedLanguage
}

export function LanguageSettingsCard({
  userId,
  initialLanguage,
}: Props) {
  const [language, setLanguage] =
    useState<SupportedLanguage>(initialLanguage)

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSave() {
    try {
      setSaving(true)
      setMessage('')

      await updateUserLanguage(userId, language)

      setMessage('Language updated successfully.')
    } catch {
      setMessage('Could not update language.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Language</h2>
        <p className="text-sm text-muted-foreground">
          Choose the display language for Ser3bellum.
        </p>
      </div>

      <select
        value={language}
        onChange={(e) =>
          setLanguage(e.target.value as SupportedLanguage)
        }
        className="w-full rounded-md border px-3 py-2"
      >
        <option value="en">English</option>
        <option value="fr">Français</option>
      </select>

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-md border px-4 py-2"
      >
        {saving ? 'Saving...' : 'Save'}
      </button>

      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  )
}