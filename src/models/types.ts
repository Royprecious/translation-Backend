// export type TranslationItem = {
//   [languageCode: string]: string;
// };

import { types } from "util";

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



export type ReleaseDataType = {
     content?: any;
     hasUpdated?: boolean;
     releaseDate?: Date;
     version?: string;
     author?: string;
     status?: string;
     title?: string;
     updatedAt?: Date;
     description?: string;
     img?:string;
}
