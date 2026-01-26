import express from "express";
import userController from "../controllers/admin-user.controllers.js";
import userValidation from "../validations/admin-user.validation.js"
import { adminVerifyToken } from "../../middleware/verifyToken.js";
import { verifyRole } from "../../middleware/verifyRole.js";
import enums from "../../config/enum.js";
import multer from "multer";
import validate from "../../middleware/validate.js";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const route = express.Router();

route.get("/profile", adminVerifyToken, verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]), userController.getAdminUserProfile);

route.put("/profile", adminVerifyToken, upload.single("profilePicture"), verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]), validate(userValidation.updateUserProfile), userController.updateAdminUserProfile);

route.get("/all-admin-users/:id?", adminVerifyToken, verifyRole([enums.userRoleEnum.OWNER]), userController.getAllAdminUsers);

route.put("/block-app-user/:userId", adminVerifyToken, verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]), userController.blockAndUnblockUser);

route.patch("/update-status-approved-or-rejected", adminVerifyToken, verifyRole([enums.userRoleEnum.OWNER]), validate(userValidation.approveAndRejectValidation), userController.approveAndRejectAdminUser);

route.get("/app-users/:type/:id?", adminVerifyToken, verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]), userController.getAllAppUsers);

route.put("/update-fcm-token", adminVerifyToken, verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]), validate(userValidation.fcmtokenUpdateValidation), userController.updateAdminFcmToken);

route.put("/update-radius", adminVerifyToken, verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]), validate(userValidation.adminRadiusValidation), userController.updateAdminUserRadius);

route.get("/user-profile/:otherUserId", userController.getOtherUserProfile);

export default route;