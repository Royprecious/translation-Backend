import { Request, response, Response } from "express";
import { POexport, TranslationData, TranslationsByLang } from "../models/types";
import db from "../configs/firebase";
import { exportPo, GetAllAvailableLanguages, GetAllCategory, GetAndFormatAllData, getByCategory, GetLatestCategory, poToJson, saveCollectionData, updateCollectionCategory } from "../services/poService";
import { someData } from "../constant/constant";


const handleError = (res: Response, error: unknown, message: string) => {
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  return res.status(500).json({ message, error: errorMessage });
};

export async function getAllVersions(_req: Request, res: Response) {
  try {
    return res.status(200).json(await GetAllCategory());
  } catch (error) {
    return handleError(res, error, "Failed to get versions");
  }
}

export async function fetchData(req: Request, res: Response) {
  try {
     const category = req.query.category as string;
      
     if(category !== undefined){
        const data = await getByCategory(category);
        return res.status(200).json(data.data());
     }

     const results = await GetAndFormatAllData();


    return res.status(200).json(results);
  } catch (error) {
    return handleError(res, error, "Failed to get version from database");
  }
}



export async function fetchByCategory(req: Request, res: Response) {

  try {
    const category: string = req.params.category;

    if (!category) {
      res.status(422).json({ message: 'category is required' });
      return;
    }

    const data = await getByCategory(category);

    if (!data) {
      res.status(404).json({ message: 'category does not exist' });
      return;
    }

    const categoryData = data.data();
    return res.status(200).json(categoryData);


  } catch (error) {
    return res.status(500).json({ message: 'internal server error' });
  }

}

export async function uploadPOFile(req: Request, res: Response) {
  try {
    const file = req.file;
    const language:string = req.params.lng;
            
    if (!file) {
      return res.status(422).json({ message: 'file required' });
    }
   

    if(!language){
       return res.status(422).json({message: 'language required'});
    }

    let pOfile;

    try {
      pOfile = await poToJson(file, language);
       
      let category: string | undefined;
      for (const keys in pOfile) {
          category = keys;
      }
       
    
      if (category !== undefined) {
        const data = Object.fromEntries(Object.entries(pOfile?.DASHBOARD));
        console.log('another', data);
          const finalUpdate = await updateCollectionCategory(data, category);
           
          return res.status(200).json(finalUpdate);      
          
      } else {
          res.status(400).json({message: 'category  cannot be undefined'});
      }
      
    } catch {
      return res.status(400).json({ message: 'invalid file' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'There was an error while uploading file' });
  }
}

export async function exportPOFile(req:Request<{}, {}, POexport>, res:Response){

  const {category, language} = req.body; 

      if(!category || !language){
         return res.status(400).json({message: 'Input parameters required'});
      }


    const data = await exportPo(category, language);
    console.log('this is ', data);

    return res.status(200).json(data);
}




export async function saveData(req: Request, res: Response) {
  try {

    const uploadFile = req.file;

    if (!uploadFile) {
      return res.status(400).json({ message: 'file is required' })
    }

    let convertedJson;
    try {
      convertedJson = JSON.parse(uploadFile.buffer.toString());
    } catch {
      return res.status(400).json({ error: 'Invalid Json file' });
    }


       await Object.keys(convertedJson).forEach(async (category) => {
      console.log('this is the key', category);

      const categoryData = convertedJson[category];

      try {
        const creatingCategories = await saveCollectionData(category, categoryData);
        console.log('document created sucessfully');
        return res.status(200).json(creatingCategories);
      } catch (error) {
        console.error('error writing document', error);
      }

    })
  } catch (error) {
    return handleError(res, error, "Failed to save data");
  }
}


export async function getAllLanguages(req:Request,res:Response) {
           
        const lang = await GetAllAvailableLanguages();
 
          res.status(200).json(lang);
        return ;
}


export async function getTranlationData(req:Request, res:Response) {

  const lang:string = req.params.lang;

  if(!lang){
      res.status(400).json({message: 'language is required'});
      return;
  }

  const ref = db.collection('translations-production').doc(lang);

  try {
    const docSnapshot = await ref.get();

    if (docSnapshot.exists) {
             const data:any = docSnapshot.data();
             return res.status(200).json([data]);
          
    } else {
      console.log(`Document with lang "${lang}" does not exist.`);
    }
  } catch (error) {
    console.error('There was an error while fetching data', error);
  }
  
}



export async function deleteData(req: Request, res: Response) {
  try {
    const version = req.params.version;
    if (!version) {
      return res.status(400).json({ message: "Version is required" });
    }

    const translationRef = db.collection("translations").doc(version);
    const doc = await translationRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: "Version not found" });
    }

    await translationRef.delete();
    return res
      .status(200)
      .json({ message: "Translation deleted successfully" });
  } catch (error) {
    return handleError(res, error, "Failed to delete data");
  }
}


