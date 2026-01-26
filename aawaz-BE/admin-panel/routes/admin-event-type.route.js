import express from "express";
import eventTypeController from "../controllers/admin-event-type.controllers.js";
import { adminVerifyToken } from "../../middleware/verifyToken.js";
import validate from "../../middleware/validate.js";
import { verifyRole } from "../../middleware/verifyRole.js";
import enums from "../../config/enum.js";
import adminEventTypeValidation from "../validations/admin-event-type.validation.js";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const route = express.Router();

route.post(
  "/add",
  adminVerifyToken,
  verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]),
  upload.single("eventIcon"),
  validate(adminEventTypeValidation.createEventType),
  eventTypeController.createEventType
);

route.post(
  "/add/:eventTypeId/sub-category",
  adminVerifyToken,
  verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]),
  upload.single("eventIcon"),
  eventTypeController.addSingleSubCategory
);

route.get(
  "/list/:id?",
  adminVerifyToken,
  verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]),
  eventTypeController.getEventTypes
);

route.get(
  "/list/:eventTypeId/sub-categories",
  adminVerifyToken,
  verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]),
  eventTypeController.getSubCategoriesByEventType
);

route.put(
  "/update/:eventTypeId",
  adminVerifyToken,
  verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]),
  upload.single("eventIcon"),
  validate(adminEventTypeValidation.updateEventType),
  eventTypeController.updateEventType
);

route.put(
  "/update/:eventTypeId/sub-category/:index",
  adminVerifyToken,
  verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]),
  upload.single("eventIcon"),
  eventTypeController.updateSingleSubCategory
);

route.delete(
  "/delete/:eventTypeId/sub-category/:index",
  adminVerifyToken,
  verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]),
  eventTypeController.deleteSingleSubCategory
);

route.delete(
  "/delete/:eventTypeId",
  adminVerifyToken,
  verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]),
  eventTypeController.deleteEventType
);

export default route;
