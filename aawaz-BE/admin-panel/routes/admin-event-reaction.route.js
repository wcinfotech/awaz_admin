import express from "express";
import eventReactionController from "../controllers/admin-event-reaction.controllers.js";
import { adminVerifyToken } from "../../middleware/verifyToken.js";
import validate from "../../middleware/validate.js";
import { verifyRole } from "../../middleware/verifyRole.js";
import enums from "../../config/enum.js";
import adminEventReactionValidation from "../validations/admin-event-reaction.validation.js";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const route = express.Router();

route.post("/add", adminVerifyToken, verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]), upload.single("reactionIcon"), validate(adminEventReactionValidation.createEventReaction), eventReactionController.createEventReaction);

route.get("/list/:id?", adminVerifyToken, verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]), eventReactionController.getEventReactions);

route.put("/update/:eventReactionId", adminVerifyToken, verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]), upload.single("reactionIcon"), validate(adminEventReactionValidation.updateEventReaction), eventReactionController.updateEventReaction);

route.delete("/delete/:eventReactionId", adminVerifyToken, verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]), eventReactionController.deleteEventReaction);

export default route;