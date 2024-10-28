import PO from "pofile";
import db from "../configs/firebase";
import fs from 'fs';
import path from 'path'; 
import { TranslationData } from "../models/types";
import { fetchData } from "../controllers/poController";

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




export async function updateCollectionCategory(data:any, category:string) {
            
  const categoryFormat:string = await formatCategoryString(category);
    
  try {
    const ref = db.collection('translation-new').doc(categoryFormat);
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
        console.log("Document successfully updated!");
         const dataSaved =  await saveToProduction();
        return dataSaved;
        
    } else {
        console.log("No updates to apply");
    }

} catch (error) {
    console.error('Error updating the document:', error);
}

   
}

export async function saveToProduction() {
  const collectionRef = db.collection("translation-new");
  const datas = await collectionRef.get();

  let accum: any[] = [];

  for (const doc of datas.docs) { 
      const documentId = doc.id;
      console.log("Document ID:", documentId);
      

      const data = await collectionRef.doc(documentId).get();
 
      const documentData = doc.data();
      for (const keys in documentData){
             console.log('dsdsdnsnskds', keys);
               const enData = {
                [keys]:documentData[keys]['en'],
               }

              const  turkData ={
                [keys]: documentData[keys]['tr']
              }
              
             accum.push(enData);
      }
  }

  const data = [{'en':accum},]

  return data;
}
