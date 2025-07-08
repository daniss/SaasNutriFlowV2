// Internationalization (i18n) system for NutriFlow

import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface TranslationKey {
  [key: string]: string | TranslationKey;
}

interface Translations {
  [locale: string]: TranslationKey;
}

// French translations (default)
export const translations: Translations = {
  fr: {
    // Common
    common: {
      loading: 'Chargement...',
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
      edit: 'Modifier',
      add: 'Ajouter',
      search: 'Rechercher',
      filter: 'Filtrer',
      export: 'Exporter',
      import: 'Importer',
      print: 'Imprimer',
      send: 'Envoyer',
      close: 'Fermer',
      yes: 'Oui',
      no: 'Non',
      back: 'Retour',
      next: 'Suivant',
      previous: 'Précédent',
      confirm: 'Confirmer',
      success: 'Succès',
      error: 'Erreur',
      warning: 'Attention',
      info: 'Information'
    },

    // Navigation
    navigation: {
      dashboard: 'Tableau de bord',
      clients: 'Clients',
      mealPlans: 'Plans alimentaires',
      templates: 'Modèles',
      appointments: 'Rendez-vous',
      reminders: 'Rappels',
      invoices: 'Factures',
      messages: 'Messages',
      analytics: 'Analyses',
      calendar: 'Calendrier',
      settings: 'Paramètres',
      logout: 'Déconnexion'
    },

    // Dashboard
    dashboard: {
      title: 'Tableau de bord',
      welcome: 'Bienvenue, {{name}}',
      stats: {
        totalClients: 'Clients totaux',
        activePlans: 'Plans actifs',
        pendingAppointments: 'RDV en attente',
        monthlyRevenue: 'CA mensuel'
      },
      recentActivity: 'Activité récente',
      quickActions: 'Actions rapides',
      upcomingAppointments: 'Prochains rendez-vous',
      recentClients: 'Clients récents'
    },

    // Clients
    clients: {
      title: 'Gestion des clients',
      add: 'Nouveau client',
      search: 'Rechercher un client...',
      filters: {
        all: 'Tous',
        active: 'Actifs',
        inactive: 'Inactifs',
        new: 'Nouveaux'
      },
      form: {
        firstName: 'Prénom',
        lastName: 'Nom',
        email: 'Email',
        phone: 'Téléphone',
        dateOfBirth: 'Date de naissance',
        gender: 'Sexe',
        height: 'Taille (cm)',
        weight: 'Poids (kg)',
        activityLevel: 'Niveau d\'activité',
        goals: 'Objectifs',
        medicalConditions: 'Conditions médicales',
        allergies: 'Allergies',
        dietaryRestrictions: 'Restrictions alimentaires',
        notes: 'Notes privées'
      },
      status: {
        active: 'Actif',
        inactive: 'Inactif',
        new: 'Nouveau'
      },
      actions: {
        viewProfile: 'Voir le profil',
        editProfile: 'Modifier le profil',
        createPlan: 'Créer un plan',
        scheduleAppointment: 'Planifier RDV',
        sendMessage: 'Envoyer message'
      }
    },

    // Meal Plans
    mealPlans: {
      title: 'Plans alimentaires',
      create: 'Nouveau plan',
      generate: 'Générer avec IA',
      search: 'Rechercher un plan...',
      filters: {
        all: 'Tous',
        active: 'Actifs',
        draft: 'Brouillons',
        completed: 'Terminés'
      },
      form: {
        title: 'Titre du plan',
        description: 'Description',
        client: 'Client',
        duration: 'Durée (semaines)',
        targetCalories: 'Objectif calorique',
        mealTypes: 'Types de repas',
        dietaryPreferences: 'Préférences alimentaires'
      },
      status: {
        draft: 'Brouillon',
        active: 'Actif',
        completed: 'Terminé',
        paused: 'En pause'
      },
      actions: {
        view: 'Voir le plan',
        edit: 'Modifier',
        duplicate: 'Dupliquer',
        export: 'Exporter PDF',
        share: 'Partager',
        archive: 'Archiver'
      }
    },

    // Appointments
    appointments: {
      title: 'Rendez-vous',
      schedule: 'Planifier',
      search: 'Rechercher un RDV...',
      calendar: 'Vue calendrier',
      list: 'Vue liste',
      form: {
        client: 'Client',
        date: 'Date',
        time: 'Heure',
        duration: 'Durée',
        type: 'Type de consultation',
        location: 'Lieu',
        notes: 'Notes',
        videoLink: 'Lien vidéo'
      },
      types: {
        consultation: 'Consultation',
        followUp: 'Suivi',
        assessment: 'Bilan',
        emergency: 'Urgence'
      },
      status: {
        scheduled: 'Programmé',
        confirmed: 'Confirmé',
        completed: 'Terminé',
        cancelled: 'Annulé',
        noShow: 'Absent'
      }
    },

    // Messages
    messages: {
      title: 'Messages',
      newMessage: 'Nouveau message',
      search: 'Rechercher conversations...',
      filters: {
        all: 'Tous',
        unread: 'Non lus',
        starred: 'Favoris',
        archived: 'Archivés'
      },
      compose: {
        to: 'À',
        subject: 'Sujet',
        message: 'Message',
        attachment: 'Pièce jointe'
      },
      templates: {
        title: 'Modèles rapides',
        greeting: 'Salutation',
        appointment: 'Rendez-vous',
        followUp: 'Suivi',
        mealPlan: 'Plan alimentaire'
      }
    },

    // Analytics
    analytics: {
      title: 'Analyses et rapports',
      overview: 'Vue d\'ensemble',
      clients: 'Analyses clients',
      revenue: 'Revenus',
      appointments: 'Rendez-vous',
      dateRange: 'Période',
      export: 'Exporter rapport',
      metrics: {
        newClients: 'Nouveaux clients',
        activeClients: 'Clients actifs',
        completedPlans: 'Plans terminés',
        revenue: 'Revenus',
        appointments: 'Rendez-vous',
        satisfaction: 'Satisfaction'
      }
    },

    // Settings
    settings: {
      title: 'Paramètres',
      profile: 'Profil',
      practice: 'Cabinet',
      notifications: 'Notifications',
      security: 'Sécurité',
      billing: 'Facturation',
      integrations: 'Intégrations',
      form: {
        firstName: 'Prénom',
        lastName: 'Nom',
        email: 'Email',
        phone: 'Téléphone',
        businessName: 'Nom du cabinet',
        address: 'Adresse',
        specializations: 'Spécialisations',
        languages: 'Langues parlées',
        timezone: 'Fuseau horaire',
        currency: 'Devise'
      }
    },

    // Notifications
    notifications: {
      success: {
        clientCreated: 'Client créé avec succès',
        clientUpdated: 'Client mis à jour',
        planCreated: 'Plan alimentaire créé',
        appointmentScheduled: 'Rendez-vous programmé',
        messageSent: 'Message envoyé',
        settingsUpdated: 'Paramètres mis à jour'
      },
      error: {
        clientNotFound: 'Client introuvable',
        planNotFound: 'Plan introuvable',
        appointmentConflict: 'Conflit de rendez-vous',
        messageFailed: 'Échec d\'envoi du message',
        networkError: 'Erreur de connexion'
      }
    },

    // Validation
    validation: {
      required: 'Ce champ est obligatoire',
      email: 'Adresse email invalide',
      phone: 'Numéro de téléphone invalide',
      minLength: 'Minimum {{count}} caractères',
      maxLength: 'Maximum {{count}} caractères',
      minValue: 'Valeur minimum {{value}}',
      maxValue: 'Valeur maximum {{value}}',
      dateInvalid: 'Date invalide',
      passwordWeak: 'Mot de passe trop faible'
    }
  },

  // English translations
  en: {
    common: {
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      search: 'Search',
      filter: 'Filter',
      export: 'Export',
      import: 'Import',
      print: 'Print',
      send: 'Send',
      close: 'Close',
      yes: 'Yes',
      no: 'No',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      confirm: 'Confirm',
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Information'
    },

    navigation: {
      dashboard: 'Dashboard',
      clients: 'Clients',
      mealPlans: 'Meal Plans',
      templates: 'Templates',
      appointments: 'Appointments',
      reminders: 'Reminders',
      invoices: 'Invoices',
      messages: 'Messages',
      analytics: 'Analytics',
      calendar: 'Calendar',
      settings: 'Settings',
      logout: 'Logout'
    },

    dashboard: {
      title: 'Dashboard',
      welcome: 'Welcome, {{name}}',
      stats: {
        totalClients: 'Total Clients',
        activePlans: 'Active Plans',
        pendingAppointments: 'Pending Appointments',
        monthlyRevenue: 'Monthly Revenue'
      },
      recentActivity: 'Recent Activity',
      quickActions: 'Quick Actions',
      upcomingAppointments: 'Upcoming Appointments',
      recentClients: 'Recent Clients'
    },

    clients: {
      title: 'Client Management',
      add: 'New Client',
      search: 'Search clients...',
      filters: {
        all: 'All',
        active: 'Active',
        inactive: 'Inactive',
        new: 'New'
      },
      form: {
        firstName: 'First Name',
        lastName: 'Last Name',
        email: 'Email',
        phone: 'Phone',
        dateOfBirth: 'Date of Birth',
        gender: 'Gender',
        height: 'Height (cm)',
        weight: 'Weight (kg)',
        activityLevel: 'Activity Level',
        goals: 'Goals',
        medicalConditions: 'Medical Conditions',
        allergies: 'Allergies',
        dietaryRestrictions: 'Dietary Restrictions',
        notes: 'Private Notes'
      },
      status: {
        active: 'Active',
        inactive: 'Inactive',
        new: 'New'
      }
    },

    // Add more English translations as needed...
  },

  // Spanish translations
  es: {
    common: {
      loading: 'Cargando...',
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      add: 'Añadir',
      search: 'Buscar',
      filter: 'Filtrar',
      export: 'Exportar',
      import: 'Importar',
      print: 'Imprimir',
      send: 'Enviar',
      close: 'Cerrar',
      yes: 'Sí',
      no: 'No',
      back: 'Atrás',
      next: 'Siguiente',
      previous: 'Anterior',
      confirm: 'Confirmar',
      success: 'Éxito',
      error: 'Error',
      warning: 'Advertencia',
      info: 'Información'
    },

    navigation: {
      dashboard: 'Panel',
      clients: 'Clientes',
      mealPlans: 'Planes de Comida',
      templates: 'Plantillas',
      appointments: 'Citas',
      reminders: 'Recordatorios',
      invoices: 'Facturas',
      messages: 'Mensajes',
      analytics: 'Análisis',
      calendar: 'Calendario',
      settings: 'Configuración',
      logout: 'Cerrar Sesión'
    }

    // Add more Spanish translations as needed...
  }
};

// Default locale
export const DEFAULT_LOCALE = 'fr';

// Supported locales
export const SUPPORTED_LOCALES = ['fr', 'en', 'es'];

// I18n context

interface I18nContextType {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatDate: (date: Date, format?: 'short' | 'medium' | 'long') => string;
  formatNumber: (number: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (amount: number, currency?: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

interface I18nProviderProps {
  children: ReactNode;
  defaultLocale?: string;
}

export function I18nProvider({ children, defaultLocale = DEFAULT_LOCALE }: I18nProviderProps) {
  const [locale, setLocaleState] = useState(defaultLocale);

  useEffect(() => {
    // Load locale from localStorage or browser preference
    const savedLocale = localStorage.getItem('nutriflow-locale');
    if (savedLocale && SUPPORTED_LOCALES.includes(savedLocale)) {
      setLocaleState(savedLocale);
    } else {
      // Detect browser language
      const browserLang = navigator.language.split('-')[0];
      if (SUPPORTED_LOCALES.includes(browserLang)) {
        setLocaleState(browserLang);
      }
    }
  }, []);

  const setLocale = (newLocale: string) => {
    if (SUPPORTED_LOCALES.includes(newLocale)) {
      setLocaleState(newLocale);
      localStorage.setItem('nutriflow-locale', newLocale);
    }
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = translations[locale];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to default locale
        value = translations[DEFAULT_LOCALE];
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key; // Return key if translation not found
          }
        }
        break;
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    // Replace parameters
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return params[paramKey]?.toString() || match;
      });
    }

    return value;
  };

  const formatDate = (date: Date, format: 'short' | 'medium' | 'long' = 'medium'): string => {
    const formatOptions: Record<string, Intl.DateTimeFormatOptions> = {
      short: { month: 'numeric', day: 'numeric', year: '2-digit' },
      medium: { month: 'short', day: 'numeric', year: 'numeric' },
      long: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
    };

    return new Intl.DateTimeFormat(locale, formatOptions[format]).format(date);
  };

  const formatNumber = (number: number, options?: Intl.NumberFormatOptions): string => {
    return new Intl.NumberFormat(locale, options).format(number);
  };

  const formatCurrency = (amount: number, currency: string = 'EUR'): string => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency
    }).format(amount);
  };

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        t,
        formatDate,
        formatNumber,
        formatCurrency
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

// Utility functions
export function getAvailableLocales() {
  return SUPPORTED_LOCALES.map(locale => ({
    code: locale,
    name: getLocaleName(locale),
    flag: getLocaleFlag(locale)
  }));
}

export function getLocaleName(locale: string): string {
  const names: Record<string, string> = {
    fr: 'Français',
    en: 'English',
    es: 'Español'
  };
  return names[locale] || locale;
}

export function getLocaleFlag(locale: string): string {
  const flags: Record<string, string> = {
    fr: '🇫🇷',
    en: '🇺🇸',
    es: '🇪🇸'
  };
  return flags[locale] || '🌐';
}

// HOC for translated components
export function withTranslation<P extends object>(
  Component: React.ComponentType<P & { t: (key: string, params?: Record<string, string | number>) => string }>
) {
  return function TranslatedComponent(props: P) {
    const { t } = useI18n();
    return <Component {...props} t={t} />;
  };
}

// Date/time utilities with i18n
export function formatRelativeTime(date: Date, locale: string = DEFAULT_LOCALE): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const diff = date.getTime() - Date.now();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (Math.abs(days) > 0) return rtf.format(days, 'day');
  if (Math.abs(hours) > 0) return rtf.format(hours, 'hour');
  if (Math.abs(minutes) > 0) return rtf.format(minutes, 'minute');
  return rtf.format(seconds, 'second');
}

export function formatDuration(minutes: number, locale: string = DEFAULT_LOCALE): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0) {
    if (locale === 'fr') {
      return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}min` : ''}`;
    } else {
      return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}m` : ''}`;
    }
  } else {
    return locale === 'fr' ? `${minutes}min` : `${minutes}m`;
  }
}
