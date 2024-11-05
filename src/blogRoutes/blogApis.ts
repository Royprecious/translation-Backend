import { Router } from "express";
import { createRelease, fetchAllVersions, fetchVersionRelease, updateRelease } from "../controllers/blogController";
import fileUpload from "../middleware/upload";

 const router = Router();


 router.post('/create-release',fileUpload, createRelease);
 router.post('/releases/:version', fetchVersionRelease);
 router.patch('/updates/:version', updateRelease);
 router.get('/fetch-all-versions', fetchAllVersions);
 

 export default router;