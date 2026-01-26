import express from "express";
import multer from "multer";
import adminEventPostController from "../controllers/admin-event-post.controllers.js";
import { adminVerifyToken } from "../../middleware/verifyToken.js";
import validate from "../../middleware/validate.js";
import adminEventPostValidation from "../validations/admin-event-post.validation.js";
import { verifyRole } from "../../middleware/verifyRole.js";
import enums from "../../config/enum.js";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const route = express.Router();

route.put(
  "/update-user-post-status",
  adminVerifyToken,
  verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]),
  validate(adminEventPostValidation.updateUserRequestedEventPostStatusValidation),
  adminEventPostController.updateUserRequestedEventPostStatus
);

route.put(
  "/update-rescue-update-status",
  adminVerifyToken,
  verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]),
  validate(adminEventPostValidation.rejectUserRequestedRescueUpdateValidation),
  adminEventPostController.rejectAndPendingUserRequestedRescueUpdate
);

const addEventPostUploads = multer({ storage: storage }).fields([
  { name: "gallaryAttachment", maxCount: 1 },
  { name: "gallaryThumbnail", maxCount: 1 },
]);

route.post(
  "/add",
  adminVerifyToken,
  verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]),
  addEventPostUploads,
  validate(adminEventPostValidation.createAdminEventPostValidation),
  adminEventPostController.createAdminEventPost
);

route.delete(
  "/:eventPostId",
  adminVerifyToken,
  verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]),
  adminEventPostController.deleteAdminEventPost
);

const uploadFileAndTimelineToAdminEventPostUploads = multer({ storage: storage }).fields([
  { name: "gallaryAttachment", maxCount: 1 },
  { name: "thumbnailAttachment", maxCount: 1 },
]);

route.post(
  "/file-and-timeline",
  adminVerifyToken,
  verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]),
  uploadFileAndTimelineToAdminEventPostUploads,
  validate(adminEventPostValidation.addFileAndTimelineToAdminEventPostValidation),
  adminEventPostController.addFileAndTimelineToAdminEventPost
);

const uploadFileToAdminEventPostUploads = multer({ storage: storage }).fields([
  { name: "gallaryAttachment", maxCount: 1 },
  { name: "thumbnailAttachment", maxCount: 1 },
]);

route.post(
  "/upload-file",
  adminVerifyToken,
  verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]),
  uploadFileToAdminEventPostUploads,
  validate(adminEventPostValidation.uploadFileToAdminEventPostValidation),
  adminEventPostController.uploadFileToAdminEventPost
);

route.post(
  "/timeline",
  adminVerifyToken,
  verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]),
  validate(adminEventPostValidation.updateTimelineToAdminEventPostValidation),
  adminEventPostController.updateTimelineToAdminEventPost
);

route.get(
  "/:eventPostId/upload-files",
  adminVerifyToken,
  verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]),
  adminEventPostController.getOnlyUploadedFilesToAdminPost
);

route.get(
  "/:postType/list",
  adminVerifyToken,
  verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]),
  adminEventPostController.getAdminEventPosts
);

route.get(
  "/:postType/:eventPostId",
  adminVerifyToken,
  verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]),
  adminEventPostController.getSingleAdminEventPost
);

route.get(
  "/rescue-update/:status/:eventPostId",
  adminVerifyToken,
  verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]),
  adminEventPostController.getRescueUpdateListToAdminEventPost
);

route.get(
  "/filter/:postType/:filterType",
  adminVerifyToken,
  verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]),
  adminEventPostController.getFilteredAdminEventPosts
);

const updateEventPostUploads = multer({ storage: storage }).fields([
  { name: "gallaryAttachment", maxCount: 1 },
  { name: "gallaryThumbnail", maxCount: 1 },
]);

route.put(
  "/update",
  adminVerifyToken,
  verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]),
  updateEventPostUploads,
  validate(adminEventPostValidation.updateAdminEventPostValidation),
  adminEventPostController.updateAdminEventPost
);

const updateTimelineFileEventPostUploads = multer({ storage: storage }).fields([
  { name: "gallaryAttachment", maxCount: 1 },
  { name: "gallaryThumbnail", maxCount: 1 },
]);

route.put(
  "/update-timeline-file",
  adminVerifyToken,
  updateTimelineFileEventPostUploads,
  verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]),
  validate(adminEventPostValidation.updateTimelineFileUpdateAdminEventPostValidation),
  adminEventPostController.updateTimelineFileUpdateAdminEventPost
);

route.delete(
  "/:eventPostId/timeline-or-attachment/:timelineAndAttachmentId",
  adminVerifyToken,
  verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]),
  adminEventPostController.deleteAttachmentFromAdminEventPost
);

route.put(
  "/update-event-post-status",
  adminVerifyToken,
  verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]),
  validate(adminEventPostValidation.updateLostItemFoundStatusValidation),
  adminEventPostController.updateLostItemFoundStatus
)

route.get(
  "/pending-rescue-update-count",
  adminVerifyToken,
  verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]),
  adminEventPostController.getRescuePendingUpdateCount
)

// route.post(
//   "/bulk-create",
//   adminVerifyToken,
//   verifyRole([enums.userRoleEnum.ADMIN, enums.userRoleEnum.OWNER]),
//   addEventPostUploads,
//   adminEventPostController.bulkCreatePostByAdmin
// );

route.delete(
  "/:postId/permanent-delete",
  adminVerifyToken,
  verifyRole([ enums.userRoleEnum.ADMIN,enums.userRoleEnum.OWNER ]),
  adminEventPostController.permanentDeletePost
);

export default route;
