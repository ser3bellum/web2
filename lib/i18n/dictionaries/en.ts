import type { Dictionary } from "../getDictionary";

export const en: Dictionary = {
  settings: {
    title: "User Settings",
    closeSettings: "Close settings",

    profileTitle: "Profile",
    profileSubtitle: "This is how others will see you on the site.",
    changeAvatar: "Change",
    removeAvatar: "Remove",
    uploading: "Uploading…",
    username: "Username",
    email: "Email",
    role: "Role",
    authority: "Authority",
    yourName: "Your name",
    saveProfile: "Save profile",
    saving: "Saving…",
    saved: "Saved ✓",

    language: "Language",
    displayLanguage: "Display language",
    save: "Save",
    languageUpdated: "Language updated successfully.",
    languageUpdateError: "Could not update language.",

    teamManagement: "Team Management",
    teamSubtitle: "Invite and manage your team members.",
    memberEmail: "Member's Email",
    memberEmailPlaceholder: "name@example.com",
    addMember: "Add Member",
    adminOnly: "Admin only.",

    changePassword: "Change Password",
    changePasswordSubtitle:
      "Update your password here. Please choose a strong password.",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmNewPassword: "Confirm New Password",
    updatePassword: "Update Password",
    updating: "Updating…",
    updated: "Updated ✓",
    passwordsDoNotMatch: "Passwords do not match.",
    currentPasswordIncorrect: "Current password is incorrect.",
    newPasswordWeak:
      "New password is too weak. Try at least 8 characters.",
    loginAgainToChangePassword:
      "Please log in again, then try changing your password.",
    passwordUpdateFailed: "Password update failed.",
    notAuthenticatedInBrowser: "Not authenticated in browser.",

    companyInfos: "Company Infos",
    companySubtitle: "Manage your company's information.",
    companyName: "Company Name",
    companyWebsite: "Company Website",
    numberOfEmployees: "Number of Employees",
    typeOfActivity: "Type of Activity",
    companyNamePlaceholder: "Company name",
    companyWebsitePlaceholder: "https://example.com",
    companySizePlaceholder: "Select a size",
    companyActivityPlaceholder: "Technology",
    saveCompany: "Save company",

    billingInformation: "Billing Information",
    billingSubtitle: "Manage your billing details and payment methods.",
    edit: "Edit",
    billingAddress: "Billing Address",
    billingAddressPlaceholder: "1234 Main St, Anytown, USA 12345",
    saveBilling: "Save billing",
  },

  navigation: {
    openProfileSettings: "Open profile settings",
    edit: "Edit",
    userFallback: "User",
    editProfile: "Edit profile",
    apps: "Apps",
    noAppsConnected: "No apps connected",
    refreshData: "Refresh Data",
    analytics: "Analytics",
    siteHealth: "Site Health",
    settings: "Settings",
    integrations: "Integrations",
    customizeDashboard: "Customize Dashboard",
    dashboard: "Dashboard",
    logout: "Log out",
    loggingOut: "Logging out...",
  },

  topbar: {
    today: "Today",
    last7Days: "Last 7 days",
    last30Days: "Last 30 days",
    last60Days: "Last 60 days",
    last90Days: "Last 90 days",
    customRange: "Custom range",
    selectDates: "Select dates",
    searchPlaceholder: "Search…",
    close: "Close",
    done: "Done",
    messages: "Messages",
    notifications: "Notifications",
    printReport: "Print report",
    help: "Help",
    returnToDashboard: "Return to dashboard",
    logout: "Log out",
    loggingOut: "Logging out...",

    mailModal: {
      title: "Messages",
      empty: "No messages",
      markAllAsRead: "Mark all as read",
      viewAll: "View all messages",
    },

    notificationModal: {
      title: "Notifications",
      empty: "No notifications",
      markAllAsRead: "Mark all as read",
      viewAll: "View all notifications",
    },
  },

  analytics: {
  title: "Analytics",
  subtitle: "Business performance, correlated with system health",
  emptyState: {
    title: "Connect your business data",
    description:
      "Ser3bellum brings traffic, sales, and system reliability into one place. Connect Google Analytics and/or Shopify to see how incidents, latency, and downtime impact real business outcomes.",
    optional: "Optional",
    exampleInsightLabel: "Example insight",
    exampleInsightText:
      "On Jan 5, a latency increase of +180ms coincided with a 12% drop in checkout conversions.",
    footer:
      "Analytics is optional and only activated when integrations are connected.",
    googleAnalytics: {
      title: "Google Analytics",
      subtitle: "Website traffic & engagement",
      bullets: {
        sessionsAndUsers: "Sessions & users",
        trafficSources: "Traffic sources",
        keyEngagementSignals: "Key engagement signals",
      },
      cta: "Connect Google Analytics",
      hint: "Correlate traffic spikes with latency and errors",
    },
    shopify: {
      title: "Shopify",
      subtitle: "Sales & conversions",
      bullets: {
        ordersAndRevenue: "Orders & revenue",
        conversionRate: "Conversion rate",
        checkoutPerformance: "Checkout performance",
      },
      cta: "Connect Shopify",
      hint: "Understand how incidents affect sales in real time",
    },
  },
  activeState: {
  metricCards: {
    sessions: "Sessions",
    revenue: "Revenue",
    conversionRate: "Conversion rate",
    connectGaToPopulate: "Connect GA to populate",
    connectShopifyToPopulate: "Connect Shopify to populate",
  },
  timeline: {
    title: "Timeline correlation",
    description:
      "Overlay traffic and revenue with incidents, downtime, and latency.",
    connectedLabel: "Connected:",
    none: "None",
    chartPlaceholder:
      "Chart placeholder (v1): Sessions/Revenue line + incident markers + downtime blocks + P95 latency spikes.",
  },
  insights: {
    title: "Automated insights",
    description:
      "Short, rules-based insights that connect business impact to reliability.",
    revenueDropped:
      "Revenue dropped during a recorded incident (example placeholder).",
    trafficPeaked:
      "Traffic peaked while latency increased above threshold (example placeholder).",
    conversionRateDecreased:
      "Conversion rate decreased following downtime (example placeholder).",
  },
},
},
siteHealth: {
  title: "Site Health",
  subtitle: "An overview of your website’s reliability and risk indicators",
  lastUpdated: "Last updated",
  summaryTitle: "Your site’s health, at a glance",
  summaryDescription:
    "As monitoring and checks are enabled, this page will reflect the overall state of your site.",
  helper: {
    title: "What this means",
    description:
      "Site Health summarizes the key signals that affect availability, reliability, and exposure — so you can quickly tell if anything needs attention.",
  },
  status: {
    healthy: "Healthy",
    attention: "Needs attention",
    unavailable: "Status unavailable",
  },
  signals: {
    availability: {
      title: "Availability",
      emptyLabel: "No data yet",
      detail: "Uptime status will appear once monitors are enabled.",
      cta: "View uptime",
    },
    incidents: {
      title: "Incidents",
      emptyLabel: "No incidents",
      detail: "Incident history will appear once monitoring is active.",
      cta: "View incidents",
    },
    exposure: {
      title: "Exposure",
      emptyLabel: "Not enabled",
      detail:
        "Exposure indicators (e.g. configuration or vulnerability signals) will appear when available.",
      cta: "View details",
      unavailable: "Not available yet.",
    },
  },
  infoSection: {
    title: "What you’ll see here",
    availability: {
      title: "Availability",
      text: "Uptime status and recent downtime signals.",
    },
    reliability: {
      title: "Reliability",
      text: "Incident patterns, anomalies, and performance-related signals.",
    },
    exposure: {
      title: "Exposure",
      text: "Configuration or vulnerability indicators when available.",
    },
    footer:
      "This page is designed to be a calm summary — not a setup wizard.",
  },
},

  dashboard: {
    title: "Dashboard",
    subtitle: "Monitor your services and operational health at a glance.",
  cards: {
  analytics: {
    title: "Analytics",
    subtitle: "Website traffic for the selected period",
  },
  sales: {
    title: "Sales",
    subtitle: "Sales overview for the selected period",
  },
  marketing: {
    title: "Marketing",
    subtitle: "Conversions by channel",
  },
  downtime: {
    title: "Downtime",
    subtitle: "Downtime events for the selected period",
  },
  cpu: {
    title: "CPU Usage",
    subtitle: "System load over time",
  },
  threats: {
    title: "Threats",
    subtitle: "Blocked attempts and incidents",
  },
  accounting: {
    title: "Accounting",
    subtitle: "Invoices, payments, reconciliation",
  },
  social: {
    title: "Social networks",
    subtitle: "Instagram, Facebook, engagement signals",
  },
  booking: {
    title: "Booking",
    subtitle: "Reservations & PMS integrations (e.g. Mews)",
  },
  productivity: {
    title: "Productivity",
    subtitle: "Tasks, comms, workflows",
  },
 
},
    status: {
    ok: "OK",
    warn: "Attention",
    error: "Error",
    disabled: "Disabled",
  },
  emptyState: {
    noData: "No data yet. Connect a service to start tracking activity.",
    connectProvider: "Connect provider",
  },
  kpis: {
  items: {
    "kpi-analytics": {
      title: "Analytics",
      subtitle: "Visitors",
    },
    "kpi-sales": {
      title: "Sales",
      subtitle: "This month",
    },
    "kpi-marketing": {
      title: "Marketing",
      subtitle: "Campaign visits",
    },
    "kpi-downtime": {
      title: "Downtime",
      subtitle: "Last 30 days",
    },
    "kpi-cpu-usage": {
      title: "CPU Usage",
      subtitle: "Current average",
    },
  },
  modal: {
    close: "Close",
    detailsDescription: "Detailed activity for the selected period.",
    totalForPeriod: "Total for period",
    delta: "Delta",
    chartPlaceholder: "Chart placeholder (next step)",
  },
},
onboarding: {
  badge: "Welcome to Ser3bellum",
  titleNoCompany: "Set up your company",
  titleNoIntegration: "Connect your first provider",
  titleReady: "Your dashboard is ready",

  descriptionNoCompany:
    "Start by creating your company workspace so Ser3bellum can personalise your dashboard.",
  descriptionNoIntegration:
    "Your company is set up. Connect your first provider to start surfacing traffic, monitoring, and operational insights.",
   descriptionReady:
    "Your workspace is configured. Start exploring your dashboard and integrations.",
  
    steps: {
    company: {
      title: "Create your company",
      description:
        "Set up your workspace with your company name and basic details so Ser3bellum can personalise your dashboard.",
    },
    integration: {
      title: "Connect your first provider",
      description:
        "Plug in a service like Google Analytics to start pulling in website and operational data.",
    },
    unlock: {
      title: "Unlock your dashboard",
      description:
        "Once connected, Ser3bellum will surface analytics, health signals, and actionable insights in one place.",
    },
  },
  actions: {
    createCompany: "Create company",
    connectProvider: "Connect your first provider",
    browseIntegrations: "Browse integrations",
    completeSetup: "Complete setup",
    viewIntegrations: "View integrations",
    
  },
  benefits: {
    title: "What you’ll get after setup",
    items: {
      trafficVisibility: "Traffic visibility",
      providerHealthChecks: "Provider health checks",
      alertsAndSummaries: "Alerts and summaries",
      operationalInsights: "Operational insights",
    },
  },
}
  },
  
  
};