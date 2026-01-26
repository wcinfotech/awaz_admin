//user panel routes
import authRoute from "./routes/auth.route.js";
import supportRoute from "./routes/support.route.js";
import userRoute from "./routes/user.route.js";
import notificationRoute from "./routes/notification.route.js";
import eventPostRoute from "./routes/event-post.route.js";
import waterMarkRoute from "./routes/water-mark.route.js";
import reportRoute from "./routes/report.route.js";
import uploadNomlProjectFilesRoute from "./routes/upload-noml-project-files.route.js";
import draftEventPostRoute from "./routes/event-post-draft.route.js";
import generalPostRoute from "./routes/general-post.route.js";
import generalPostDraftRoute from "./routes/general-post-draft.route.js";
import appLifecycleRoute from "./routes/app-lifecycle.route.js";
import userSosRoute from "./routes/user-sos.route.js";
import userNotificationRoute from "./routes/user-notification.route.js";
//admin panel routes
import adminAuthRoute from "./admin-panel/routes/admin-auth.route.js";
import adminUserRoute from "./admin-panel/routes/admin-user.route.js";
import adminEventPostRoute from "./admin-panel/routes/admin-event-post.route.js";
import draftAdminEventPostRoute from "./admin-panel/routes/admin-event-post-draft.route.js";
import adminEventTypeRoute from "./admin-panel/routes/admin-event-type.route.js";
import adminEventReactionRoute from "./admin-panel/routes/admin-event-reaction.route.js";
import adminReportRoute from "./admin-panel/routes/admin-report.route.js";
import uploadJson from "./routes/upload-json.route.js";
import adminGeneralPostRoute from "./admin-panel/routes/admin-general-post.route.js";
import adminGeneralPostDraftRoute from "./admin-panel/routes/admin-general-post-draft.route.js";
import adminNotificationRoute from "./admin-panel/routes/admin-notification.route.js";
import adminActivityLogRoute from "./admin-panel/routes/admin-activity-log.route.js";
import adminSosRoute from "./admin-panel/routes/admin-sos.route.js";
import adminGlobalNotificationRoute from "./admin-panel/routes/admin-global-notification.route.js";

export default {
  //user panel routes
  authRoute,
  supportRoute,
  userRoute,
  notificationRoute,
  eventPostRoute,
  waterMarkRoute,
  draftEventPostRoute,
  reportRoute,
  uploadNomlProjectFilesRoute,
  uploadJson,
  generalPostRoute,
  generalPostDraftRoute,
  appLifecycleRoute,
  userSosRoute,
  userNotificationRoute,
  //admin panel routes
  adminAuthRoute,
  adminUserRoute,
  adminEventPostRoute,
  draftAdminEventPostRoute,
  adminEventTypeRoute,
  adminEventReactionRoute,
  adminReportRoute,
  adminGeneralPostRoute,
  adminGeneralPostDraftRoute,
  adminNotificationRoute,
  adminActivityLogRoute,
  adminSosRoute,
  adminGlobalNotificationRoute
};
