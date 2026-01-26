import express from "express";
import { adminVerifyToken } from "../../middleware/verifyToken.js";
import multer from "multer";
import validate from "../../middleware/validate.js";
import draftAdminEventPostValidation from "../validations/admin-event-post-draft.validation.js";
import draftAdminEventPostController from "../controllers/admin-event-post-draft.controllers.js";
import { verifyRole } from "../../middleware/verifyRole.js";
import enums from "../../config/enum.js";

const storage = multer.memoryStorage();
const route = express.Router();

const adminDraftUploads = multer({ storage: storage }).fields([
    { name: "gallaryAttachment", maxCount: 1 },
    { name: "gallaryThumbnail", maxCount: 1 },
]);

route.post("/add", adminVerifyToken, verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]), adminDraftUploads, validate(draftAdminEventPostValidation.createDraftAdminEventPostValidation), draftAdminEventPostController.createAdminDraftEventPost);

route.delete("/delete/:draftId", adminVerifyToken, verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]), draftAdminEventPostController.deleteDraftAdminEventPost);

route.get("/admin-drafts", adminVerifyToken, verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]), draftAdminEventPostController.getDraftAdminEventPost);

export default route;
