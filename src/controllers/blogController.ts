import { Request, Response } from "express";
import db from "../configs/firebase";


export async function createRelease(req:Request<{version:string, description:any}>, res:Response) {
       
       const {version,  description } = req.body;

       if(!version || !description){
        return res.status(400).json({message: 'fields required'})
       }
    
       const dbRef = db.collection("Punica-Release");

       if(typeof version !== 'string'){
        return res.status(400).json({message: 'version format is not valid'});
       }

       try{
          const releaseData ={
            description: description,
            releaseDate: new Date(),
            hasUpdated: false,
          }

          await dbRef.doc(version).set(releaseData);
          return res.status(201).json({message: 'Release created sucessfully'});
       }catch(error){
        return res.status(500).json({message: 'Failed to create release'});
       }
         

        
}