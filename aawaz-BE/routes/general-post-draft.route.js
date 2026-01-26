import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import multer from "multer";
import validate from "../middleware/validate.js";
import draftEventPostValidation from "../validations/general-post-draft.validation.js";
import draftEventPostController from "../controllers/general-post-draft.controllers.js";

const storage = multer.memoryStorage();
const route = express.Router();

const draftUpload = multer({ storage: storage }).fields([
  { name: "attachment", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 },
]);

route.post(
  "/add",
  verifyToken,
  draftUpload,
  validate(draftEventPostValidation.createDraftPostValidation),
  draftEventPostController.createUserDraftEventPost
);

export default route;
