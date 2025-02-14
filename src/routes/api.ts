import { Router } from "express";
import {
  getAllVersions,
  fetchData,
  saveData,
  deleteData,
  fetchByCategory,
  uploadPOFile,
  exportPOFile,
  getAllLanguages,
  getTranlationData,
  createApp,
} from "../controllers/poController";
import fileUpload from "../middleware/upload";

const router = Router();

router.get("/versions/:app", getAllVersions); 

router.get("/fetch/:app", fetchData);

router.post('/fetch-by-category/:category/:app', fetchByCategory); 

router.post("/save/:app", fileUpload, saveData); 

router.post("/delete/:version", deleteData);

router.post("/upload/:lng/:app", fileUpload, uploadPOFile); 

router.post("/export/:app", exportPOFile); 

router.get("/fetch-all-Lang/:app", getAllLanguages); 

router.post('/fetch-translation/:lang', getTranlationData);

router.post('/create-app', createApp); 

export default router;
