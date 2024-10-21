import { Request, Response } from "express";
import { POexport, TranslationData } from "../models/types";
import db from "../configs/firebase";
import { exportPo, GetAllCategory, getByCategory, GetLatestCategory, poToJson, saveCollectionData, updateCategory } from "../services/poService";


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

    const versionData = db.collection("translation-new");

    const versionSnapshot = await versionData.get();
    if (versionSnapshot.empty) {
      return res.status(404).json({ message: " no data found" });
    }

    const document: any = [];

    versionSnapshot.forEach(doc => {
      console.log(doc.data());
      document.push({ id: doc.id, ...doc.data() });
    })


    return res.status(200).json(document);
  } catch (error) {
    return handleError(res, error, "Failed to get version from database");
  }
}



export async function fetchByCategory(req: Request, res: Response) {

  try {
    const category: string = req.params.category;

    if (!category) {
      res.status(400).json({ message: 'category is required' });
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
      return res.status(400).json({ message: 'file required' });
    }

    if(!language){
       return res.status(400).json({message: 'language required'});
    }

    let pOfile;

    try {
      pOfile = await poToJson(file, language);
      //  let key;
      //     for(const keys in pOfile){
      //          key = pOfile[keys];
               
      //     }

      const results = await updateCategory(pOfile, 'Dashboard');
      console.log('this is the poFile', pOfile );
      return res.status(200).json(results);
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


    const dataKeys = await Object.keys(convertedJson).forEach(async (category) => {
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


