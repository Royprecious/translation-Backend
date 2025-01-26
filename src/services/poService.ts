import PO from "pofile";
import db from "../configs/firebase";
import fs from 'fs';
import path from 'path';
import { ProductionTranslation, TranslationData, TranslationsByLang } from "../models/types";

export async function GetAllCategory() {
  const collectionSnapshot = await db.collection("").get();
  return collectionSnapshot.docs.map(doc => doc.id);


}

export async function GetAndFormatAllData(app: string) {
  const Ref = db.collection("translation").doc('translation-dev');
  const data = await Ref.collection(app);

  const versionSnapshot = await data.get();
  if (versionSnapshot.empty) {
    const message = " no data found";
    return message
  }

  const document: any = [];
  versionSnapshot.forEach(doc => {
    document.push({ [doc.id]: { ...doc.data() } });
  })

  return document;

}

export async function GetAllAvailableLanguages(app:string) {
  const categories = await GetAllCategory();

  const accumlateSubKeys = [];
  for (const cat of categories) {
    const newData = await getByCategory(cat, app);
    const categorizeData = newData.data();

    for (const subKeys in categorizeData) {
      accumlateSubKeys.push(categorizeData[subKeys]);

    }
  }


  const accumSub = [];
  for (const subs of accumlateSubKeys) {
    accumSub.push(Object.keys(subs))

  }
  const mixedOutput = `{${accumSub.join(', ')} }`;

  const keysArray = mixedOutput.replace(/[{}]/g, '').split(',').map(key => key.trim());

  const uniqueKeys: Record<string, any> = {};

  keysArray.forEach(key => {
    if (key.length === 2) {
      uniqueKeys[key] = key;
    }
  });

  return uniqueKeys;
}


export async function GetLatestCategory() {
  const versions = (await GetAllCategory()).map((version) => (version));

  return versions
}


// export async function saveCollectionData(category: string, categoryData: any) {
//   const data = await db.collection('translation-dev').doc(category).set(categoryData);

//   return data;
// }


export async function saveCollectionData(category: string, categoryData: any, app:string) {
  try {
    const translationDocRef = db.collection('translation').doc('translation-dev');
    await translationDocRef.collection(app).doc(category).set(categoryData);
    console.log("Data saved successfully");
  } catch (error) {
    console.error("Error saving data:", error);
    throw error;
  }
  }


  export async function getAllApps() {
    const apps = await db.collection('apps').get();
    return apps;
  }



  export async function doesAppExist(appName: string, allApps: any[]): Promise<number> {
    for (const doc of allApps) {
      if (doc.appName === appName) {
        return 1;
      }
    }
    return 0;
  }


export async function getByCategory(category: string, app: string) {
  const Ref =  db.collection('translation').doc('translation-dev');
  const data = await Ref.collection(app).doc(category).get();
     

  return data;
}




export async function formatCategoryString(category: string): Promise<string> {
  const finalCategoryFormat = category.slice(0, 1).toUpperCase() + category.slice(1).toLowerCase();

  return finalCategoryFormat;
}



function sortByLanguage(langData: ProductionTranslation[]): TranslationsByLang {
  return langData.reduce((accumulator: TranslationsByLang, objData: ProductionTranslation) => {
    const { lang, ...rest } = objData;
    accumulator[lang] = { ...accumulator[lang], ...rest };
    return accumulator;
  }, {});
}


export async function poToJson(poFile: any, language: string) {
  try {
    const data = poFile.buffer.toString('utf-8');
    const po = PO.parse(data);

    if (!po) {
      console.error("Invalid PO file content");
      return null;
    }

    const translationJson: Record<string, any> = {};

    po.items.forEach((value) => {
      const translationItem = {
        en: value.msgid,
        category: value.msgctxt!,
        [language]: value.msgstr[0] ?? "",
      };

      if (translationJson[value.msgctxt!]) {
        translationJson[value.msgctxt!] = {
          ...translationJson[value.msgctxt!],
          [value.comments?.[0] || ""]: translationItem,
        };
      } else {
        translationJson[value.msgctxt!] = {
          [value.comments?.[0] || ""]: translationItem,
        };
      }
    });

    console.log('Final JSON:', translationJson);
    return translationJson;
  } catch (error) {
    console.error("Error parsing PO file:", error);
    return null;
  }
}




export async function exportPo(category: string, selectedLanguage: string, app: string) {
  try {
    const data = await getByCategory(category , app);
    const newData = data.data();
    let finalData = [];

    for (const key in newData) {
      if (newData[key]) {
        delete newData[key].path;
        finalData.push(newData[key]);
      }
    }

    if (finalData.length > 0) {
      const po = new PO();

      po.headers = {
        "Content-Type": "text/plain; charset=UTF-8",
        "Content-Transfer-Encoding": "8bit",
        "Plural-Forms": "nplurals=2; plural=(n != 1);",
        "MIME-Version": "1.0",
        Language: selectedLanguage,
        "X-Source-Language": "en",
      };

      finalData.forEach((translationItem) => {
        const item = new PO.Item();
        item.comments = [translationItem.category];


        if (selectedLanguage === "en") {
          item.msgctxt = translationItem.category;
          item.msgid = translationItem.en;
        } else {
          item.msgctxt = translationItem.category;
          item.msgid = translationItem[selectedLanguage] || "";
        }

        item.msgstr = [translationItem[selectedLanguage] || ""];
        po.items.push(item);
      });


      const poString = po.toString();

      const filePath = path.join(__dirname, `${app}_${category}_${selectedLanguage}.po`);

      fs.writeFileSync(filePath, poString, 'utf8');
      console.log(`PO file saved at ${filePath}`);

      return filePath;
    }
  } catch (error) {
    console.error("Error generating PO file:", error);
    return null;
  }
}




export async function updateCollectionCategory(data: any, category: string, app:string) {

  const categoryFormat: string = await formatCategoryString(category);

  try {
    // const ref = db.collection('translation-new').doc(categoryFormat);
      const ref = db.collection('translation').doc('translation-dev').collection(app).doc(categoryFormat);
    const updates: Record<string, string> = {};

    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        for (const field in data[key]) {
          if (data[key].hasOwnProperty(field)) {
            updates[`${key}.${field}`] = data[key][field];
          }
        }
      }
    }


    if (Object.keys(updates).length > 0) {
      await ref.update(updates);
      const dataSaved = await formatProductionData(app);
      console.log("Document successfully updated!");
      return dataSaved;

    } else {
      console.log("No updates to apply");
    }

  } catch (error) {
    console.error('Error updating the document:', error);
  }


}

async function formatProductionData(app:string) {
  const collectionRef = db.collection('translation').doc('translation-dev').collection(app);
  const datas = await collectionRef.get();
  const languages = await GetAllAvailableLanguages(app);

  let accum: any[] = [];

  for (const doc of datas.docs) {
    const documentId = doc.id;

    await collectionRef.doc(documentId).get();

    const documentData = doc.data();
    for (const keys in documentData) {
      Object.keys(languages).forEach(lang => {
        const enData = {
          lang,
          [keys]: documentData[keys][lang],

        }

        accum.push(enData);
      })
    }
  }

  const sortedData: TranslationsByLang = await sortByLanguage(accum);
  const leo = await saveToProduction(sortedData, app);

  return sortedData;
}


async function saveToProduction(sortedData: TranslationsByLang, app: string) {
  const prodRef = db.collection('translation').doc('translation-production');
  const prodReference = prodRef.collection(app);

  function cleanIncomingData(obj: any) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, value === undefined ? '' : value])
    );
  }

  try {
    for (const lang of Object.keys(sortedData)) {
      const cleanedData = cleanIncomingData(sortedData[lang]);
      console.log(cleanedData);
      await prodReference.doc(lang).set(cleanedData, { merge: true });
    }
    console.log("Translations saved successfully");
  } catch (error) {
    console.error("Error saving translations: ", error);
  }
}




