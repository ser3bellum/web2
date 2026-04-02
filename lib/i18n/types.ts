export type AppLanguage = 'en' | 'fr';

export type SettingsDictionary = {
  settingsPage: {
    title: string;
    sections: {
      profile: string;
      language: string;
      teamManagement: string;
    };
    profileCard: {
      usernameLabel: string;
      authorityLabel: string;
      saveButton: string;
    };
    languageCard: {
      title: string;
      description: string;
      label: string;
      saveButton: string;
      options: {
        en: string;
        fr: string;
      };
    };
    teamCard: {
      title: string;
      description: string;
      emailLabel: string;
      emailPlaceholder: string;
      roleLabel: string;
      inviteButton: string;
    };
  };
};