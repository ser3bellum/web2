import { en } from "./dictionaries/en";
import { fr } from "./dictionaries/fr";
import type { SupportedLanguage } from "./config";

export type Dictionary = {
  settings: {
    title: string;
    closeSettings: string;

    profileTitle: string;
    profileSubtitle: string;
    changeAvatar: string;
    removeAvatar: string;
    uploading: string;
    username: string;
    email: string;
    role: string;
    authority: string;
    yourName: string;
    saveProfile: string;
    saving: string;
    saved: string;

    language: string;
    displayLanguage: string;
    save: string;
    languageUpdated: string;
    languageUpdateError: string;

    teamManagement: string;
    teamSubtitle: string;
    memberEmail: string;
    memberEmailPlaceholder: string;
    addMember: string;
    adminOnly: string;

    changePassword: string;
    changePasswordSubtitle: string;
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
    updatePassword: string;
    updating: string;
    updated: string;
    passwordsDoNotMatch: string;
    currentPasswordIncorrect: string;
    newPasswordWeak: string;
    loginAgainToChangePassword: string;
    passwordUpdateFailed: string;
    notAuthenticatedInBrowser: string;

    companyInfos: string;
    companySubtitle: string;
    companyName: string;
    companyWebsite: string;
    numberOfEmployees: string;
    typeOfActivity: string;
    companyNamePlaceholder: string;
    companyWebsitePlaceholder: string;
    companySizePlaceholder: string;
    companyActivityPlaceholder: string;
    saveCompany: string;

    billingInformation: string;
    billingSubtitle: string;
    edit: string;
    billingAddress: string;
    billingAddressPlaceholder: string;
    saveBilling: string;
  };

  navigation: {
    openProfileSettings: string;
    edit: string;
    userFallback: string;
    editProfile: string;
    apps: string;
    noAppsConnected: string;
    refreshData: string;
    analytics: string;
    siteHealth: string;
    settings: string;
    integrations: string;
    customizeDashboard: string;
  };

  topbar: {
    today: string;
    last7Days: string;
    last30Days: string;
    last60Days: string;
    last90Days: string;
    customRange: string;
    selectDates: string;
    searchPlaceholder: string;
    close: string;
    done: string;
    messages: string;
    notifications: string;
    printReport: string;
    help: string;
    returnToDashboard: string;
  };
};

export function getDictionary(language: SupportedLanguage): Dictionary {
  switch (language) {
    case "fr":
      return fr;
    case "en":
    default:
      return en;
  }
}