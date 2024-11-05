import { Request, Response } from "express";
import db from "../configs/firebase";
import { deleteDoc, doc } from "firebase/firestore";
import { ReleaseDataType } from "../models/types";



export async function createRelease(req:Request<{},{},ReleaseDataType>, res:Response) {
       
       const {version,  content, title, description, img } = req.body;
     
           
       if(!img){
          return res.status(400).json({message:'Image is required'});
       }

       
         

       if(!version || !content || !title || !description || !img){
        return res.status(400).json({message: 'fields required'})
       }
    
       const dbRef = db.collection("Punica-Release");
       const userRef = await db.collection("Users").doc("punica-team").get();

       if(typeof version !== 'string'){
        return res.status(400).json({message: 'version format is not valid'});
       }

       if(typeof title !== 'string'){
        return res.status(400).json({message: 'title format is not valid'});
       }

       if(typeof description !== 'string'){
        return res.status(400).json({message: 'description format is not valid'});
       }





       try{

         const userCredential = userRef.data();
         let status = "published"
          const releaseData: ReleaseDataType ={
            version: version,
            content: content,
            releaseDate: new Date(),
            hasUpdated: false,
            status: status,
            author: userCredential?.id,
            title:title,
            description: description,
            img:img,
    
          }

          await dbRef.doc(version).set(releaseData);
          return res.status(201).json({message: 'Release created sucessfully'});
       }catch(error){
        return res.status(500).json({message: 'Failed to create release'});
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

         const versionData = retrieveVersion.data();

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



export async function updateRelease(req:Request<ReleaseDataType,{},ReleaseDataType>, res:Response) {

    const version = req.params.version;
    const {content, title, description, img } = req.body;

    if(!version){
        return res.status(400).json({message: 'version required'})
       }
    

     if(typeof version !== 'string' || typeof title !== 'string'){
         return res.status(400).json({message: 'field types must be string'});
     }
 

     try{
        const docRef = db.collection("Punica-Release").doc(version);
        const docSnap = await docRef.get();

        if(!docSnap.exists){
            return res.status(404).json({message: 'version does not exist'});
        }

        const newData:ReleaseDataType = {
            title: title,
            content: content, 
            hasUpdated: true,
            updatedAt: new Date(),
            description: description,
            img:img
        }

         await docRef.update(newData);
        
           return res.status(404).json({message: 'version updated successfully'});
     }catch (error){
       return res.status(500).json({message: 'There was an error while updating the version'});
     }
    
}


