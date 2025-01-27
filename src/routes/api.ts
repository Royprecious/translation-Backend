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
import { get } from "http";

const router = Router();

router.get("/versions/:app", getAllVersions); //done

router.get("/fetch/:app", fetchData);//done

router.post('/fetch-by-category/:category/:app', fetchByCategory); //done

router.post("/save/:app", fileUpload, saveData); //done

router.post("/delete/:version", deleteData);

router.post("/upload/:lng/:app", fileUpload, uploadPOFile);

router.post("/export/:app", exportPOFile); //done

router.get("/fetch-all-Lang/:app", getAllLanguages); //done

router.post('/fetch-translation/:lang', getTranlationData);

router.post('/create-app', createApp); //done

export default router;
