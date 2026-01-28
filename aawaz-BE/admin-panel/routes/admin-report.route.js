import express from "express";
import reportController from "../controllers/admin-report.controllers.js";
import { adminVerifyToken } from "../../middleware/verifyToken.js";
import { verifyRole } from "../../middleware/verifyRole.js";
import enums from "../../config/enum.js";
import validate from "../../middleware/validate.js";
import adminReportValidation from "../validations/admin-report.validation.js";

const route = express.Router();

route.put("/status/:status/:reportId", adminVerifyToken, verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]), reportController.updateReportStatus);

route.get("/post-list", adminVerifyToken, verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]), reportController.getAllPostReports);

route.get("/user-list", adminVerifyToken, verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]), reportController.getAllUserReports);

route.get("/comment-list", adminVerifyToken, verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]), reportController.getAllCommentReports);

route.get("/:reportId", adminVerifyToken, verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]), reportController.getReportById);

route.delete("/delete-comment", adminVerifyToken, verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]), validate(adminReportValidation.deleteCommentValidation), reportController.deletePostCommentAndCommentReply);

export default route;
