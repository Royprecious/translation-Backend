import { Router } from "express";
import {
  getAllVersions,
  fetchData,
  saveData,
  deleteData,
  fetchByCategory,
  uploadPOFile,
  exportPOFile,
} from "../controllers/poController";
import fileUpload from "../middleware/upload";

const router = Router();

router.get("/versions", getAllVersions);

router.get("/fetch", fetchData);

router.post('/fetch-by-category/:category', fetchByCategory)

router.post("/save", fileUpload, saveData);

router.post("/delete/:version", deleteData);

router.post("/upload/:lng", fileUpload, uploadPOFile);

router.post("/export", exportPOFile);

// router.delete("/versions/:version", deleteTranslation);

// router.post("/poToJson", poTojson);

// router.get("/export/:version?", exportTranslations);

// router.post("/test", test);

export default router;
