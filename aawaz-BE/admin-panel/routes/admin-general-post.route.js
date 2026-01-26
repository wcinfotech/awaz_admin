import express from "express";
import multer from "multer";
import adminEventPostController from "../controllers/admin-general-post.controllers.js";
import { adminVerifyToken } from "../../middleware/verifyToken.js";
import validate from "../../middleware/validate.js";
import adminEventPostValidation from "../validations/admin-general-post.validation.js";
import { verifyRole } from "../../middleware/verifyRole.js";
import enums from "../../config/enum.js";

const storage = multer.memoryStorage();

const uploadFiles = multer({ storage: storage }).fields([
  { name: "gallaryAttachment", maxCount: 1 },
  { name: "gallaryThumbnail", maxCount: 1 },
]);

const route = express.Router();

route.post(
  "/add",
  adminVerifyToken,
  verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]),
  uploadFiles,
  validate(adminEventPostValidation.createAdminEventPostValidation),
  adminEventPostController.createAdminEventPost
);

route.put(
  "/update",
  adminVerifyToken,
  verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]),
  uploadFiles,
  validate(adminEventPostValidation.updateAdminEventPostValidation),
  adminEventPostController.updateAdminEventPost
);

export default route;
