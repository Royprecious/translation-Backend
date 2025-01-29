import { Request, Response } from "express";
import db from "../configs/firebase";
import { exportPo, formatProductionData, GetAllAvailableLanguages, GetAllCategory, GetAndFormatAllData, getByCategory, isAppAvailable, isCategoryAvailable, isLanguageAvailable, poToJson, saveCollectionData, updateCollectionCategory } from "../services/poService";




const handleError = (res: Response, error: unknown, message: string) => {
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  return res.status(500).json({ message, error: errorMessage });
};


export async function getAllVersions(req: Request, res: Response) {
  const app = req.params.app;


  if (!app) {
    return res.status(400).json({ message: 'App is required' });
  }

  if (!(await isAppAvailable(app))) {
    return res.status(400).json({ message: 'Sorry app name does not exist' });
  }


  try {
    return res.status(200).json(await GetAllCategory(app));
  } catch (error) {
    return handleError(res, error, "Failed to get versions");
  }
}



export async function fetchData(req: Request, res: Response) {
  try {
    const category = req.query.category as string;
    const app: string = req.params.app;

    if (!app) {
      return res.status(400).json({ message: 'App is required' });
    }


    if (!(await isAppAvailable(app))) {
      return res.status(400).json({ message: 'Sorry app name does not exist' });
    }


    if (category !== undefined) {

      if(!(await isCategoryAvailable(category, app))){
        return res.status(404).json({message: 'sorry could not find this category'});
    }
  
      const data = await getByCategory(category, app);
      return res.status(200).json(data.data());
    }

    const results = await GetAndFormatAllData(app);


    return res.status(200).json(results);
  } catch (error) {
    return handleError(res, error, "Failed to get version from database");
  }
}



export async function fetchByCategory(req: Request, res: Response) {

  try {
    const category: string = req.params.category;
    const app: string = req.params.app;

    if (!app) {
      return res.status(400).json({ message: 'App is required' });
    }

    if (!(await isAppAvailable(app))) {
      return res.status(400).json({ message: 'Sorry app name does not exist' });
    }


    if (!category) {
      res.status(422).json({ message: 'category is required' });
      return;
    }

    if(!(await isCategoryAvailable(category, app))){
      return res.status(404).json({message: 'sorry could not find this category'});
  }


    const data = await getByCategory(category, app);

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
    const language: string = req.params.lng;
    const app: string = req.params.app;

    if (!app) {
      return res.status(400).json({ message: 'App is required' });
    }
    if (!(await isAppAvailable(app))) {
      return res.status(400).json({ message: 'Sorry app name does not exist' });
    }

    if (!file) {
      return res.status(422).json({ message: 'file required' });
    }

    if (!language) {
      return res.status(422).json({ message: 'language required' });
    }

    if (!(await isLanguageAvailable(language, app))) {
      return res.status(404).json({ message: 'sorry this language is not available' });

    }

    try {
      const newJsonFile = await poToJson(file, language);
      if (!newJsonFile) {
        return res.status(422).json({ message: 'failed to convert poFile to Json' });
      }

      let category: string | undefined;
      for (const key in newJsonFile) {
        category = key;
        break;
      }


      if (category !== undefined) {
        
        if(!(await isCategoryAvailable(category, app))){
          return res.status(404).json({message: 'sorry could not find this category'});
      }
    
        const finalUpdate = await updateCollectionCategory(newJsonFile, category, app);

        return res.status(200).json(finalUpdate);
      } else {
        return res.status(400).json({ message: 'category cannot be undefined' });
      }
    } catch (error) {
      return res.status(400).json({ message: 'invalid file' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'There was an error while uploading file' });
  }
}

export async function exportPOFile(req: Request, res: Response) {

  const { category, language } = req.body;
  const app: string = req.params.app;

  if (!app) {
    return res.status(400).json({ message: 'App is required' });
  }

  if (!(await isAppAvailable(app))) {
    return res.status(400).json({ message: 'Sorry app name does not exist' });
  }


  if (!category) {
    return res.status(400).json({ message: 'category  required' });
  }

  if (!(await isCategoryAvailable(category, app))) {
    return res.status(404).json({ message: 'sorry could not find this category' });
  }

  if (!language) {
    return res.status(400).json({ message: 'language  required' });
  }

  if (!(await isLanguageAvailable(language, app))) {
    return res.status(404).json({ message: 'sorry this language is not available' });

  }


  if (!(await isAppAvailable(app))) {
    return res.status(400).json({ message: 'Sorry app name does not exist' });
  }



  const data = await exportPo(category, language, app);

  return res.status(200).json(data);
}




export async function createApp(req: Request, res: Response) {
  const { appName } = req.body;
  if (!appName) {
    return res.status(400).json({ message: 'App is required' });
  }
  try {
    const appRef = db.collection('apps').doc(appName);
    if (!(await isAppAvailable(appName))) {
      return res.status(400).json({ message: 'Sorry app name does not exist' });
    }


    await appRef.set({ "appName": appName });
    return res.status(200).json({ message: 'App created successfully' });
  } catch (error) {
    return handleError(res, error, "Failed to create app");
  }
}


export async function saveData(req: Request, res: Response) {
  try {

    let bufferPofile;
    const app: string = req.params.app;

    if (!app) {
      return res.status(400).json({ message: 'App is required' });
    }

    if (!(await isAppAvailable(app))) {
      return res.status(400).json({ message: 'Sorry app name does not exist' });
    }


    if (req.file) {
      bufferPofile = req.file
    } else {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const convertedJson = JSON.parse(bufferPofile.buffer.toString());
    await Object.keys(convertedJson).forEach(async (category) => {

      const categoryData = convertedJson[category];

      await saveCollectionData(category, categoryData, app);
      await formatProductionData(app);


    })
    return res.status(200).json({ message: "uploaded to db" });
  } catch (error) {
    return handleError(res, error, "Failed to save data");
  }
}



export async function getAllLanguages(req: Request, res: Response) {

  const app: string = req.params.app;


  if (!app) {
    return res.status(400).json({ message: 'App is required' });
  }

  if (!(await isAppAvailable(app))) {
    return res.status(400).json({ message: 'Sorry app name does not exist' });
  }

  const lang = await GetAllAvailableLanguages(app);
  res.status(200).json(lang);
  return;
}


export async function getTranlationData(req: Request, res: Response) {

  const lang: string = req.params.lang;

  if (!lang) {
    res.status(400).json({ message: 'language is required' });
    return;
  }

  const ref = db.collection('translations-production').doc(lang);

  try {
    const docSnapshot = await ref.get();

    if (docSnapshot.exists) {
      const data: any = docSnapshot.data();
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


