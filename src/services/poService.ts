import PO from "pofile";
import db from "../configs/firebase";
import fs from 'fs';
import path from 'path'; 

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

export async function updateCategory(data:any, category:string) {
  
          const dataFromDB = await getByCategory(category);
    
          let temp = dataFromDB.data();
          let accum = [];
         
            for(const incomingFileCategory of Object.keys(data)){

            
             const formattingCategory = incomingFileCategory.slice(0,1).toUpperCase() + incomingFileCategory.slice(1,incomingFileCategory.length).toLowerCase();

              console.log('this incomming cat', formattingCategory);
          
             for(const incomingFileKeys in data[incomingFileCategory]){
                  const more = data[incomingFileKeys];
                  console.log('moreee', incomingFileKeys);

                  for(const keys in temp){
                          if(keys === 'WEATHER'){
                            accum.push(temp[keys]);
                            console.log('keys match', keys);
                          }else{
                            console.log('keys not found', keys);
                          }
                         
                  }      
             }
             

              // const categoryData = await getByCategory(formattingCategory);
              //   const newCategoryData = categoryData.data();
              //   console.log('daasas', newCategoryData);
                
                   
              // for(const incommingKeys in newCategoryData){
              //      console.log('incomming keys', incommingKeys);
                      
              //      for(const keys in temp){
              //       if(keys === incommingKeys){
              //         // accum.push(temp[keys]);
                     
              //       }
              //       console.log('keys', keys);
                        
              //        }
              //       //  console.log('isis', accum);

              // }


             

            }

          return accum;
                  
                 
                  
            

}
