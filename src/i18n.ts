import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// English translations
const en = {
  translation: {
    profile: {
      settings: "Settings",
      manageAccount: "Manage your account settings and preferences.",
      general: "General",
      security: "Security",
      notifications: "Notifications",
      appearance: "Appearance",
      dataPrivacy: "Data & Privacy",
      language: "Language",
      timezone: "Timezone",
      saveChanges: "Save changes",
      savingChanges: "Saving changes...",
      profileInformation: "Profile Information",
      manageDetails:
        "Manage your personal details and how you appear on the platform.",
      fullName: "Full Name",
      emailAddress: "Email Address",
      uploadPicture: "Upload new picture",
    },
  },
};

// Spanish translations
const es = {
  translation: {
    profile: {
      settings: "Configuración",
      manageAccount: "Administre la configuración y preferencias de su cuenta.",
      general: "General",
      security: "Seguridad",
      notifications: "Notificaciones",
      appearance: "Apariencia",
      dataPrivacy: "Datos y Privacidad",
      language: "Idioma",
      timezone: "Zona horaria",
      saveChanges: "Guardar cambios",
      savingChanges: "Guardando cambios...",
      profileInformation: "Información del Perfil",
      manageDetails:
        "Administra tus detalles personales y cómo apareces en la plataforma.",
      fullName: "Nombre completo",
      emailAddress: "Correo electrónico",
      uploadPicture: "Subir nueva foto",
    },
  },
};

// French translations
const fr = {
  translation: {
    profile: {
      settings: "Paramètres",
      manageAccount: "Gérez les paramètres et préférences de votre compte.",
      general: "Général",
      security: "Sécurité",
      notifications: "Notifications",
      appearance: "Apparence",
      dataPrivacy: "Données et Confidentialité",
      language: "Langue",
      timezone: "Fuseau horaire",
      saveChanges: "Enregistrer",
      savingChanges: "Enregistrement...",
      profileInformation: "Informations sur le Profil",
      manageDetails:
        "Gérez vos informations personnelles et votre apparence sur la plateforme.",
      fullName: "Nom complet",
      emailAddress: "Adresse e-mail",
      uploadPicture: "Télécharger une photo",
    },
  },
};

i18n
  // Detects language from localStorage, navigator, etc.
  .use(LanguageDetector)
  // Passes i18n to react-i18next
  .use(initReactI18next)
  .init({
    resources: {
      en,
      es,
      fr,
    },
    // If language is not found, fallback to English
    fallbackLng: "en",

    // React handles escaping automatically
    interpolation: {
      escapeValue: false,
    },

    // Automatically detect language preferences
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
