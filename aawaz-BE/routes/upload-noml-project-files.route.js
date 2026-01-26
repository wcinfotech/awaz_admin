import express from "express";
import uploadFileNomlProjectController from "../controllers/upload-noml-project-files.controllers.js";
import multer from "multer";
import validate from "../middleware/validate.js";
import nomlUploadFileValidation from "../validations/upload-noml-project-files.validation.js";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const route = express.Router();

route.post("/upload-file", upload.single("file"), validate(nomlUploadFileValidation.uploadFileValidation), uploadFileNomlProjectController.uploadFile);

export default route;
