import { Router } from "express";
import { createNotification } from "../controllers/pushNotificationController";

 const notifyRouter = Router();


 notifyRouter.post('/send-notification', createNotification);

 

 export default notifyRouter;