import express from "express";
import userController from "../controllers/user.controllers.js";
import { verifyToken } from "../middleware/verifyToken.js";
import validate from "../middleware/validate.js";
import userValidation from "../validations/user.validation.js";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const route = express.Router();

route.get("/profile", verifyToken, userController.getUserProfile);

route.put("/profile", verifyToken, upload.single("profilePicture"), userController.updateUserProfile);

route.post("/update/location", verifyToken, validate(userValidation.updateUserLocation), userController.updateUserLocation);

route.put("/update-push-token", verifyToken, validate(userValidation.pushtokenUpdateValidation), userController.updateUserPushToken);

route.get("/user-profile/:otherUserId", verifyToken, userController.getOtherUserProfile);

route.put("/update-radius", verifyToken, validate(userValidation.userRadiusValidation), userController.updateUserRadius);

route.delete("/delete-account", verifyToken, userController.deleteAccount);

route.post("/block-unblock-user", verifyToken, validate(userValidation.userIdIdValidation), userController.blockUnblobkUserToOtherUser);

route.get("/block-users", verifyToken, userController.getBlockedUsers);

route.post("/count-users-in-radius", verifyToken, validate(userValidation.countUserInRadiusValidation), userController.countUserInRadius);

route.post("/check/username", upload.none(), validate(userValidation.checkUsernameAvailability), userController.checkUsernameAvailability);

route.get("/search-by-users-username", userController.searchUsersByUsername);
  
export default route;
