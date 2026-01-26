import express from "express";
import multer from "multer";
import { verifyToken } from "../middleware/verifyToken.js";
import validate from "../middleware/validate.js";
import validation from "../validations/general-post.validation.js";
import controller from "../controllers/general-post.controllers.js";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const route = express.Router();

const generalCatPostUploads = upload.fields([
  { name: "attachment", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 },
]);

route.post(
  "/add",
  verifyToken,
  generalCatPostUploads,
  validate(validation.createUserGeneralPost),
  controller.createUserGeneralPost
);

export default route;
