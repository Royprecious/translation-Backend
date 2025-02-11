
import { Request, Response } from "express";
import admin from "firebase-admin";


interface bodyType{
    deviceToken: string,
    title: string,
    body: string,


}


export async function createNotification(req:Request<{}, {}, bodyType>, res:Response){

    const {deviceToken, title, body} = req.body;
     
    try{

        if(!deviceToken || !title || !body){
            return res.status(400).json({message: 'input datas required'});
        }

              const message = {
                token: deviceToken,
                notification: {
                  title: title,
                  body: body,
                },
                // data: data, 
              };
          
              const response = await admin.messaging().send(message);
              console.log("Successfully sent message:", response);
            } catch (error) {
              console.error("Error sending message:", error);
          
    }
    
}