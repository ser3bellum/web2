"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateUserLanguage } from "@/lib/i18n/updateUserLanguage";
import type { SupportedLanguage } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/getDictionary";

type Props = {
  userId: string;
  initialLanguage: SupportedLanguage;
  dictionary: Dictionary;
};

export function LanguageSettingsCard({
  userId,
  initialLanguage,
  dictionary,
}: Props) {
  const router = useRouter();
  const [language, setLanguage] = useState<SupportedLanguage>(initialLanguage);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSave() {
    try {
      setSaving(true);
      setMessage("");

      await updateUserLanguage(userId, language);
      router.refresh();

      setMessage(dictionary.settings.languageUpdated);
    } catch {
      setMessage(dictionary.settings.languageUpdateError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">
          {dictionary.settings.language}
        </h2>
        <p className="text-sm text-muted-foreground">
          {dictionary.settings.displayLanguage}
        </p>
      </div>

      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
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
        {saving ? dictionary.settings.saving : dictionary.settings.save}
      </button>

      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}
    </div>
  );
}