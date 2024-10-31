import { Router } from "express";
import { createRelease } from "../controllers/blogController";

 const router = Router();


 router.post('/create-release', createRelease);

 export default router;