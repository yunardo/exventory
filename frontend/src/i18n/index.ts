import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import esCommon from "./locales/es/common.json";
import enCommon from "./locales/en/common.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "es",
    supportedLngs: ["es", "en"],
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
    },
  });

export default i18n;
