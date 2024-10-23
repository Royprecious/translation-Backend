import PO from "pofile";
import db from "../configs/firebase";
import fs from 'fs';
import path from 'path'; 
import { TranslationData } from "../models/types";

export async function GetAllCategory() {
  const collectionSnapshot = await db.collection("translation-new").get();
  return collectionSnapshot.docs.map(doc => doc.id);


}

export async function GetLatestCategory() {
  const versions = (await GetAllCategory()).map((version) => (version));

  return versions
}


export async function saveCollectionData(category: string, categoryData: any) {
  const data = await db.collection('translation-new').doc(category).set(categoryData);

  return data;
}


export async function getByCategory(category: string) {
  const data = await db.collection('translation-new').doc(category).get();

  return data;
}


export async function formatCategoryString(category:string): Promise<string> {
  const finalCategoryFormat = category.slice(0, 1).toUpperCase() + category.slice(1).toLowerCase();

  return finalCategoryFormat;
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




export async function exportPo(category: string, selectedLanguage: string) {
  try {
    const data = await getByCategory(category);
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

      const filePath = path.join(__dirname, `${category}_${selectedLanguage}.po`);

      fs.writeFileSync(filePath, poString, 'utf8');
      console.log(`PO file saved at ${filePath}`);

      return filePath; 
    }
  } catch (error) {
    console.error("Error generating PO file:", error);
    return null; 
  }
}


export async function compareAndUpdateCategory(data: any, category: string): Promise<TranslationData> {
            const categoryFormat:string = await formatCategoryString(category);
            
  const dataFromDB = await getByCategory(categoryFormat);

  let latestDataFromDB = dataFromDB?.data();
  if (!latestDataFromDB) {
      console.error('Error: temp is undefined or null. Ensure that getByCategory is returning data.');
      latestDataFromDB = {};
  }

  for (const incomingFileCategory of Object.keys(data)) {
      const formattingCategory = (incomingFileCategory);
      console.log('this incoming category:', formattingCategory);

      for (const incomingFileKey in data[incomingFileCategory]) {

          const incomingData = data[incomingFileCategory][incomingFileKey];
          console.log('Processing key:', incomingFileKey, 'with value:', incomingData);

          if (latestDataFromDB.hasOwnProperty(incomingFileKey)) {
              if (latestDataFromDB[incomingFileKey] !== incomingData) {
                  latestDataFromDB[incomingFileKey].en = incomingData.en;
                  latestDataFromDB[incomingFileKey].tr = incomingData.tr;
                  latestDataFromDB[incomingFileKey].category = incomingData.category;
                  
              } 
          } else {
              latestDataFromDB[incomingFileKey] = {
                 en: incomingData.en,
                 category: incomingData.category,
                 tr: incomingData.tr,
              };
              console.log('Key does not exist in temp. Creating new key:', incomingFileKey, 'with value:', latestDataFromDB[incomingFileKey].en);
          }
      }

  }

  return latestDataFromDB;
}



export async function updateCollectionCategory(data:any, category:string) {
            
         const categoryFormat:string = await formatCategoryString(category);
           await db.collection('translation-new').doc(categoryFormat).set(data);
          const latestData = await getByCategory(categoryFormat);
                      const latestFetchedData = latestData?.data();
          console.log('this is the update', latestFetchedData);

          return latestFetchedData;
}