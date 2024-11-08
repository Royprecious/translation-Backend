import { Request, Response } from "express";
import db from "../configs/firebase";
import {ReleaseDataType } from "../models/types";
import {  generateRandomId, processRichTextContent, saveCoverImage, verifyDate } from "../services/blogServices";



export async function createRelease(req: Request<{}, {}, ReleaseDataType>, res: Response) {
    const { version, content, title, description, img, scheduledReleaseDate } = req.body;
  
  
    if (!content || !title || !description || !img) {
      return res.status(400).json({ message: 'Content, title, description, and image are required.' });
    }
  
    if (typeof title !== 'string') {
      return res.status(400).json({ message: 'Title format is not valid.' });
    }
    if (typeof description !== 'string') {
      return res.status(400).json({ message: 'Description format is not valid.' });
    }
    if (typeof img !== 'string') {
      return res.status(400).json({ message: 'Image format is not valid.' });
    }
    if (version && typeof version !== 'string') {
      return res.status(400).json({ message: 'Version format is not valid.' });
    }
  
  
    let parsedReleaseDate = null;                                                                       
    if (scheduledReleaseDate) {
      parsedReleaseDate = new Date(scheduledReleaseDate);  
  
      if (isNaN(parsedReleaseDate.getTime())) {
        return res.status(400).json({ message: 'Invalid releaseDate format. It should be a valid Date string.' });
      }
    }
  
    const userRef = await db.collection('Users').doc('punica-team').get();
    const userCredential = userRef.data();
    
    if (!userCredential || !userCredential.id) {
      return res.status(500).json({ message: 'Failed to fetch user credentials.' });
    }
  
    const releaseData: ReleaseDataType = {
      hasUpdated: false,
      status: 'published', 
      author: userCredential.id,
      title,
      description,
      version: version || undefined, 
    };


    

      const newContent = await processRichTextContent(content);
      
      const newCoverImage = await saveCoverImage(img);


      if(newContent || newCoverImage){
        releaseData.content = newContent;
        releaseData.img = newCoverImage;
      }
      
    try {
      const dbRef = db.collection('Punica-Release');
      const draftsRef = db.collection('Punica-Release');
  
      if (parsedReleaseDate) {
        const isDateValid = await verifyDate(parsedReleaseDate);
  
        if (isDateValid === 0) {
          return res.status(400).json({ message: 'Scheduled release date cannot be in the past. Please provide a present or future date.' });
        }
  
        
        const currentDate = new Date();
        if (parsedReleaseDate.getTime() <= currentDate.getTime()) {
    
          releaseData.status = 'published';
          releaseData.releaseDate = currentDate;
          const docId = version || await generateRandomId();
          await dbRef.doc(docId).set(releaseData);
          return res.status(201).json({ message: 'Release created and published immediately.' });
        }
  
       
        releaseData.status = 'draft';
        releaseData.releaseDate = parsedReleaseDate;
        const draftDocId = version || await generateRandomId();
        await draftsRef.doc(draftDocId).set(releaseData);
  
  
        return res.status(201).json({ message: 'Release saved as draft and will be published when the scheduled date arrives.' });
  
      } else {

        const docId = version || await generateRandomId();
        await dbRef.doc(docId).set(releaseData);
        return res.status(201).json({ message: 'Release created and published immediately.' });
      }
  
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Failed to create release.' });
    }
  }
  

  

export async function fetchVersionRelease(req:Request, res:Response) {

     const version:string = req.params.version;
          
     if(!version){
        res.status(400).json({message: 'version required'});
        return;
     }

     if(typeof version !== 'string'){
         return res.status(400).json({message: 'version must be of type string'});
     }
 
     try{
        const dbRef = db.collection("Punica-Release");

         const retrieveVersion = await dbRef.doc(version).get();

         if(!retrieveVersion.exists){
            return res.status(404).json({message: 'version does not exist'});
         }

         let versionData = retrieveVersion.data();
           
      
           if(versionData){

              return res.status(200).json(versionData);
           }

           return res.status(404).json({message: 'data not found. please make sure the version is correct'});
     }catch (error){
       return res.status(500).json({message: 'There was an error while fetching the version data'});
     }
    
}



export async function fetchAllVersions(req: Request, res: Response) {
    try {
        const dbRef = db.collection("Punica-Release");
        const data = await dbRef.get();

        if (data.empty) {
            return res.status(404).json({ message: 'No version data found' });
        }

        const versions = data.docs.map(doc => ({
            id: doc.id, 
            ...doc.data()
        }));

        

        return res.status(200).json(versions);
    } catch (error) {
        console.error('Error fetching data:', error);
        return res.status(500).json({ message: 'Internal Server error' });
    }
}



export async function updateRelease(req: Request<{ version: string }, {}, Partial<ReleaseDataType>>, res: Response) {
  const { version } = req.params;
  const { content, title, description, img } = req.body;

  if (!version) {
      return res.status(400).json({ message: 'Version is required' });
  }

  try {
      const docRef = db.collection("Punica-Release").doc(version);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
          return res.status(404).json({ message: 'Version does not exist' });
      }

      const updateData: Partial<ReleaseDataType> = {};
      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;
      if (description !== undefined) updateData.description = description;
      if (img !== undefined) updateData.img = img;

      if (Object.keys(updateData).length === 0) {
          return res.status(400).json({ message: 'No valid fields provided for update' });
      }

      updateData.hasUpdated = true;
      updateData.updatedAt = new Date();

      await docRef.update(updateData);

      return res.status(200).json({ message: 'Version updated successfully' });
  } catch (error) {
      console.error('Error updating version:', error);
      return res.status(500).json({ message: 'There was an error while updating the version' });
  }
}
