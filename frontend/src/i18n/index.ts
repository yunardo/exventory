import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import esCommon from "./locales/es/common.json";
import enCommon from "./locales/en/common.json";
import quBoCommon from "./locales/qu-BO/common.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "es",
    supportedLngs: ["es", "en", "qu-BO"],
    defaultNS: "common",
    interpolation: {
      escapeValue: false,
    },
    resources: {
      es: {
        common: esCommon,
      },
      en: {
        common: enCommon,
      },
      "qu-BO": {
        common: quBoCommon,
      },
    },
  });

export default i18n;
