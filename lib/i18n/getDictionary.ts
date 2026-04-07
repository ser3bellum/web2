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
    dashboard: string;
    logout: string;
    loggingOut: string;
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
    logout: string;
    loggingOut: string;

    mailModal: {
      title: string;
      empty: string;
      markAllAsRead: string;
      viewAll: string;
    };

    notificationModal: {
      title: string;
      empty: string;
      markAllAsRead: string;
      viewAll: string;
    };
  };

  analytics: {
  title: string;
  subtitle: string;
  emptyState: {
    title: string;
    description: string;
    optional: string;
    exampleInsightLabel: string;
    exampleInsightText: string;
    footer: string;
    googleAnalytics: {
      title: string;
      subtitle: string;
      bullets: {
        sessionsAndUsers: string;
        trafficSources: string;
        keyEngagementSignals: string;
      };
      cta: string;
      hint: string;
    };
    shopify: {
      title: string;
      subtitle: string;
      bullets: {
        ordersAndRevenue: string;
        conversionRate: string;
        checkoutPerformance: string;
      };
      cta: string;
      hint: string;
    };
  };
  activeState: {
    metricCards: {
      sessions: string;
      revenue: string;
      conversionRate: string;
      connectGaToPopulate: string;
      connectShopifyToPopulate: string;
    };
    timeline: {
      title: string;
      description: string;
      connectedLabel: string;
      none: string;
      chartPlaceholder: string;
    };
    insights: {
      title: string;
      description: string;
      revenueDropped: string;
      trafficPeaked: string;
      conversionRateDecreased: string;
    };
  };
};
siteHealth: {
  title: string;
  subtitle: string;
  lastUpdated: string;
  summaryTitle: string;
  summaryDescription: string;
  helper: {
    title: string;
    description: string;
  };
  status: {
    healthy: string;
    attention: string;
    unavailable: string;
  };
  signals: {
    availability: {
      title: string;
      emptyLabel: string;
      detail: string;
      cta: string;
    };
    incidents: {
      title: string;
      emptyLabel: string;
      detail: string;
      cta: string;
    };
    exposure: {
      title: string;
      emptyLabel: string;
      detail: string;
      cta: string;
      unavailable: string;
    };
  };
  infoSection: {
    title: string;
    availability: {
      title: string;
      text: string;
    };
    reliability: {
      title: string;
      text: string;
    };
    exposure: {
      title: string;
      text: string;
    };
    footer: string;
  };
}
  dashboard: {
  title: string;
  subtitle: string;

  cards: {
    analytics: {
      title: string;
      subtitle: string;
    };
    sales: {
      title: string;
      subtitle: string;
    };
    marketing: {
      title: string;
      subtitle: string;
    };
    downtime: {
      title: string;
      subtitle: string;
    };
    cpu: {
      title: string;
      subtitle: string;
    };
    threats: {
      title: string;
      subtitle: string;
    };
    accounting: {
      title: string;
      subtitle: string;
    };
    social: {
      title: string;
      subtitle: string;
    };
    booking: {
      title: string;
      subtitle: string;
    };
    productivity: {
      title: string;
      subtitle: string;
    };
  };

  status: {
    ok: string;
    warn: string;
    error: string;
    disabled: string;
  };

  emptyState: {
    noData: string;
    connectProvider: string;
  };

  kpis: {
    items: {
      "kpi-analytics": {
        title: string;
        subtitle: string;
      };
      "kpi-sales": {
        title: string;
        subtitle: string;
      };
      "kpi-marketing": {
        title: string;
        subtitle: string;
      };
      "kpi-downtime": {
        title: string;
        subtitle: string;
      };
      "kpi-cpu-usage": {
        title: string;
        subtitle: string;
      };
    };
    modal: {
      close: string;
      detailsDescription: string;
      totalForPeriod: string;
      delta: string;
      chartPlaceholder: string;
    };
  };
   onboarding: {
    badge: string;
    titleNoCompany: string;
    titleNoIntegration: string;
    titleReady: string;
    descriptionNoCompany: string;
    descriptionNoIntegration: string;
    descriptionReady: string;
    steps: {
      company: {
        title: string;
        description: string;
      };
      integration: {
        title: string;
        description: string;
      };
      unlock: {
        title: string;
        description: string;
      };
    };
    actions: {
      createCompany: string;
      connectProvider: string;
      browseIntegrations: string;
      completeSetup: string;
      viewIntegrations: string;
    };
    benefits: {
      title: string;
      items: {
        trafficVisibility: string;
        providerHealthChecks: string;
        alertsAndSummaries: string;
        operationalInsights: string;
      };
    };
  };
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