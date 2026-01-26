import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import multer from "multer";
import validate from "../middleware/validate.js";
import eventPostValidation from "../validations/event-post.validation.js";
import eventPostController from "../controllers/event-post.controllers.js";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const route = express.Router();

route.get(
  "/event-category-list/:id?",
  verifyToken,
  eventPostController.getEventCategoryList
);

route.get(
  "/list",
  verifyToken,  
  eventPostController.getAllAdminEventPosts
);

const addEventPostUploades = multer({ storage: storage }).fields([
  { name: "attachment", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 },
]);

route.post(
  "/add",
  verifyToken,
  addEventPostUploades,
  validate(eventPostValidation.createUserEventPostValidation),
  eventPostController.createUserEventPost
);

route.post(
  "/add",
  verifyToken,
  addEventPostUploades,
  validate(eventPostValidation.createUserEventPostValidation),
  eventPostController.createUserEventPost
);


route.post(
  "/add-view",
  verifyToken,
  validate(eventPostValidation.eventPostIdValidation),
  eventPostController.addViewToEventPost
);

route.post(
  "/add-view-attachment",
  verifyToken,
  validate(eventPostValidation.eventPostIdAndAttachmentIdValidation),
  eventPostController.addViewToAttachmentFileEventPost
);

route.post(
  "/add-reaction",
  verifyToken,
  validate(eventPostValidation.eventPostIdValidation),
  eventPostController.addReactionToEventPost
);

route.post(
  "/add-shared-count",
  validate(eventPostValidation.eventPostIdValidation),
  eventPostController.addSharedEventPostCount
);

route.post(
  "/save-post",
  verifyToken,
  validate(eventPostValidation.eventPostIdValidation),
  eventPostController.saveEventPost
);

route.post(
  "/on-off-notication",
  verifyToken,
  validate(eventPostValidation.eventPostIdValidation),
  eventPostController.onOffEventPostNotification
);

route.get(
  "/save-posts",
  verifyToken,
  eventPostController.getSavedEventPost
);

route.get(
  "/:eventPostId/check-saved",
  verifyToken,
  eventPostController.checkEventPostSaved
);

route.post(
  "/map/in-this-area-events",
  verifyToken,
  validate(eventPostValidation.mapEventPostValidation),
  eventPostController.getInThisAreaEvents
);

route.get(
  "/in-this-area-events/:eventPostId",
  verifyToken,
  eventPostController.getNearbyEventsForEventPost
);

const rescueUpdatesUploads = multer({ storage: storage }).fields([
  { name: "attachment", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 },
]);

route.post(
  "/rescue-update",
  verifyToken,
  rescueUpdatesUploads,
  validate(eventPostValidation.eventPostRescueUpdateValidation),
  eventPostController.eventPostRescueUpdate
);

route.get(
  "/event-post-news",
  verifyToken,
  eventPostController.getAllEventPostNews
);

route.get(
  "/:eventPostId/comments",
  verifyToken,
  eventPostController.getEventPostComments
);

route.post(
  "/search",
  verifyToken,
  validate(eventPostValidation.searchEventPostValidation),
  eventPostController.searchEventsByHashTag
);

route.get(
  "/:eventPostId",
  verifyToken,  
  eventPostController.getSingleEventPost
);

route.get("/event/:eventPostId", eventPostController.getPublicEventPosts)

route.get("/other-nearby-events/:eventPostId", eventPostController.getNearbyEventsForPublicEventPost);

export default route;
