// export type TranslationItem = {
//   [languageCode: string]: string;
// };

// export type TranslationData = {
//   [key: string]: TranslationItem;
// };

export type TranslationItem = {
  en: string;          // The original text (msgid)
  category: string;    // The context (msgctxt)
  [key: string]: string; // Language-specific translations
};
export type Items ={
   [key: string]: TranslationItem;
}
export type TranslationData = {
  [key: string]: Items 
};

export type POexport ={
   category: string,
   language: string,
}



export type ProductionTranslation = {
  lang: string;
  [key: string]: string;  
};

export type TranslationsByLang = {
  [lang: string]: { [key: string]: string };
};
