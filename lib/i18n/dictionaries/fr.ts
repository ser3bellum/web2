import type { Dictionary } from "../getDictionary";

export const fr: Dictionary = {
  settings: {
    title: "Paramètres utilisateur",
    closeSettings: "Fermer les paramètres",

    profileTitle: "Profil",
    profileSubtitle: "Voici comment les autres vous verront sur le site.",
    changeAvatar: "Changer",
    removeAvatar: "Supprimer",
    uploading: "Téléversement…",
    username: "Nom d’utilisateur",
    email: "E-mail",
    role: "Rôle",
    authority: "Autorité",
    yourName: "Votre nom",
    saveProfile: "Enregistrer le profil",
    saving: "Enregistrement…",
    saved: "Enregistré ✓",

    language: "Langue",
    displayLanguage: "Langue d’affichage",
    save: "Enregistrer",
    languageUpdated: "Langue mise à jour avec succès.",
    languageUpdateError: "Impossible de mettre à jour la langue.",

    teamManagement: "Gestion d’équipe",
    teamSubtitle: "Invitez et gérez les membres de votre équipe.",
    memberEmail: "E-mail du membre",
    memberEmailPlaceholder: "nom@exemple.com",
    addMember: "Ajouter un membre",
    adminOnly: "Administrateur uniquement.",

    changePassword: "Changer le mot de passe",
    changePasswordSubtitle:
      "Mettez votre mot de passe à jour ici. Veuillez choisir un mot de passe fort.",
    currentPassword: "Mot de passe actuel",
    newPassword: "Nouveau mot de passe",
    confirmNewPassword: "Confirmer le nouveau mot de passe",
    updatePassword: "Mettre à jour le mot de passe",
    updating: "Mise à jour…",
    updated: "Mis à jour ✓",
    passwordsDoNotMatch: "Les mots de passe ne correspondent pas.",
    currentPasswordIncorrect: "Le mot de passe actuel est incorrect.",
    newPasswordWeak:
      "Le nouveau mot de passe est trop faible. Essayez au moins 8 caractères.",
    loginAgainToChangePassword:
      "Veuillez vous reconnecter, puis réessayer de changer votre mot de passe.",
    passwordUpdateFailed: "Échec de la mise à jour du mot de passe.",
    notAuthenticatedInBrowser: "Non authentifié dans le navigateur.",

    companyInfos: "Informations sur l’entreprise",
    companySubtitle: "Gérez les informations de votre entreprise.",
    companyName: "Nom de l’entreprise",
    companyWebsite: "Site web de l’entreprise",
    numberOfEmployees: "Nombre d’employés",
    typeOfActivity: "Type d’activité",
    companyNamePlaceholder: "Nom de l’entreprise",
    companyWebsitePlaceholder: "https://exemple.com",
    companySizePlaceholder: "Sélectionnez une taille",
    companyActivityPlaceholder: "Technologie",
    saveCompany: "Enregistrer l’entreprise",

    billingInformation: "Informations de facturation",
    billingSubtitle: "Gérez vos informations de facturation et vos moyens de paiement.",
    edit: "Modifier",
    billingAddress: "Adresse de facturation",
    billingAddressPlaceholder: "1234 rue Principale, Ville, Pays",
    saveBilling: "Enregistrer la facturation",
  },

  navigation: {
    openProfileSettings: "Ouvrir les paramètres du profil",
    edit: "Modifier",
    userFallback: "Utilisateur",
    editProfile: "Modifier le profil",
    apps: "Applications",
    noAppsConnected: "Aucune application connectée",
    refreshData: "Rafraîchir les données",
    analytics: "Analytiques",
    siteHealth: "État du site",
    settings: "Paramètres",
    integrations: "Intégrations",
    customizeDashboard: "Personnalisation",
    dashboard: "Tableau de bord",
    logout: "Se déconnecter",
    loggingOut: "Déconnexion...",
  },

  topbar: {
    today: "Aujourd’hui",
    last7Days: "7 derniers jours",
    last30Days: "30 derniers jours",
    last60Days: "60 derniers jours",
    last90Days: "90 derniers jours",
    customRange: "Plage personnalisée",
    selectDates: "Sélectionner les dates",
    searchPlaceholder: "Rechercher…",
    close: "Fermer",
    done: "Terminé",
    messages: "Messages",
    notifications: "Notifications",
    printReport: "Imprimer le rapport",
    help: "Aide",
    returnToDashboard: "Retour au tableau de bord",
    logout: "Se déconnecter",
    loggingOut: "Déconnexion...",

    mailModal: {
      title: "Messages",
      empty: "Aucun message",
      markAllAsRead: "Tout marquer comme lu",
      viewAll: "Voir tous les messages",
    },

    notificationModal: {
      title: "Notifications",
      empty: "Aucune notification",
      markAllAsRead: "Tout marquer comme lu",
      viewAll: "Voir toutes les notifications",
    },
  },

  dashboard: {
    title: "Tableau de bord",
    subtitle: "Surveillez vos services et l’état opérationnel en un coup d’œil.",
   cards: {
  analytics: {
    title: "Analytique",
    subtitle: "Trafic du site pour la période sélectionnée",
  },
  sales: {
    title: "Ventes",
    subtitle: "Vue d’ensemble des ventes pour la période sélectionnée",
  },
  marketing: {
    title: "Marketing",
    subtitle: "Conversions par canal",
  },
  downtime: {
    title: "Temps d’arrêt",
    subtitle: "Événements de panne pour la période sélectionnée",
  },
  cpu: {
    title: "Utilisation CPU",
    subtitle: "Charge système dans le temps",
  },
  threats: {
    title: "Menaces",
    subtitle: "Tentatives bloquées et incidents",
  },
  accounting: {
    title: "Comptabilité",
    subtitle: "Factures, paiements, rapprochement",
  },
  social: {
    title: "Réseaux sociaux",
    subtitle: "Instagram, Facebook, signaux d’engagement",
  },
  booking: {
    title: "Réservations",
    subtitle: "Réservations et intégrations PMS (ex. Mews)",
  },
  productivity: {
    title: "Productivité",
    subtitle: "Tâches, communications, workflows",
  },
  
},
    status: {
    ok: "OK",
    warn: "Attention",
    error: "Erreur",
    disabled: "Désactivé",
  },
  emptyState: {
    noData: "Pas encore de données. Connectez un service pour commencer à suivre l’activité.",
    connectProvider: "Connecter un fournisseur",
  },
  kpis: {
  items: {
    "kpi-analytics": {
      title: "Analytiques",
      subtitle: "Visiteurs",
    },
    "kpi-sales": {
      title: "Ventes",
      subtitle: "Ce mois-ci",
    },
    "kpi-marketing": {
      title: "Marketing",
      subtitle: " Trafic campagne",
    },
    "kpi-downtime": {
      title: "Temps d’arrêt",
      subtitle: "30 derniers jours",
    },
    "kpi-cpu-usage": {
      title: "Utilisation CPU",
      subtitle: "Moyenne actuelle",
    },
  },
  modal: {
    close: "Fermer",
    detailsDescription: "Activité détaillée pour la période sélectionnée.",
    totalForPeriod: "Total sur la période",
    delta: "Variation",
    chartPlaceholder: "Emplacement du graphique (prochaine étape)",
  },
},
onboarding: {
  badge: "Bienvenue sur Ser3bellum",
  titleNoCompany: "Configurons votre espace de travail",
  titleNoIntegration: "Connectez votre premier fournisseur",
  titleReady: "Votre tableau de bord est prêt",

  descriptionNoCompany:
    "Commencez par créer l’espace de travail de votre entreprise afin que Ser3bellum puisse personnaliser votre tableau de bord.",
  
    descriptionNoIntegration:
    "Votre entreprise est configurée. Connectez votre premier fournisseur pour faire remonter le trafic, la supervision et les insights opérationnels.",
  
    descriptionReady:
    "Votre espace de travail est configuré. Commencez à explorer votre tableau de bord et vos intégrations.",
    
    steps: {
    company: {
      title: "Créez votre entreprise",
      description:
        "Configurez votre espace de travail avec le nom de votre entreprise et quelques informations de base afin que Ser3bellum puisse personnaliser votre tableau de bord.",
    },
    integration: {
      title: "Connectez votre premier fournisseur",
      description:
        "Branchez un service comme Google Analytics pour commencer à remonter les données web et opérationnelles.",
    },
    unlock: {
      title: "Débloquez votre tableau de bord",
      description:
        "Une fois connecté, Ser3bellum affichera les analyses, les signaux de santé et des insights exploitables au même endroit.",
    },
  },
  actions: {
    createCompany: "Créer l’entreprise",
    connectProvider: "Connecter votre premier fournisseur",
    browseIntegrations: "Parcourir les intégrations",
    completeSetup: "Terminer la configuration",
    viewIntegrations: "Voir les intégrations",
  },
  benefits: {
    title: "Ce que vous obtiendrez après la configuration",
    items: {
      trafficVisibility: "Visibilité du trafic",
      providerHealthChecks: "Contrôles de santé des fournisseurs",
      alertsAndSummaries: "Alertes et résumés",
      operationalInsights: "Insights opérationnels",
    },
  },
}
  },
  

};