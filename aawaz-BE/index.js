import express from "express";
import cors from "cors";
import config from "./config/config.js";
import connectDB from "./config/db.config.js";
import morgan from "morgan";
import http from "http";
import errorHandler from "./middleware/errorHandler.js";
import router from "./router.js";
import { initializeSocketIO } from "./socket/socket.io.js";
import dns from "node:dns/promises";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

import dotenv from "dotenv";
// import connectDB from "./config/db.config.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

app.disable("x-powered-by");

// import dotenv from "dotenv";
// dotenv.config();
// connect database
connectDB();

// middleware
app.use(morgan("dev"));
// app.use(express.json());
app.use(express.json({ limit: "50mb" }));
app.use(cors({ origin: "*" }));

// Root route - health check
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Backend is running successfully",
    status: "ok",
    timestamp: new Date(),
  });
});

// Users Routes
app.use("/api/v1/auth", router.authRoute);
app.use("/api/v1/support", router.supportRoute);
app.use("/api/v1/user", router.userRoute);
app.use("/api/v1/notification", router.notificationRoute);
app.use("/api/v1/event-post", router.eventPostRoute);
app.use("/api/v1/event-post-draft", router.draftEventPostRoute);
app.use("/api/v1/report", router.reportRoute);
app.use("/api/v1/water-mark", router.waterMarkRoute);
app.use("/api/v1/noml", router.uploadNomlProjectFilesRoute);
app.use("/api/v1/json", router.uploadJson);
app.use("/api/v1/general-post", router.generalPostRoute);
app.use("/api/v1/general-post-draft", router.generalPostDraftRoute);
app.use("/api/v1/app", router.appLifecycleRoute);
app.use("/api/v1/user", router.userSosRoute);
app.use("/api/v1/user", router.userNotificationRoute);

// Admin Routes
app.use("/admin/v1/auth", router.adminAuthRoute);
app.use("/admin/v1/user", router.adminUserRoute);
app.use("/admin/v1/event-post", router.adminEventPostRoute);
app.use("/admin/v1/event-post-draft", router.draftAdminEventPostRoute);
app.use("/admin/v1/event-category", router.adminEventTypeRoute);
app.use("/admin/v1/event-reaction", router.adminEventReactionRoute);
app.use("/admin/v1/report", router.adminReportRoute);
app.use("/admin/v1/general-post", router.adminGeneralPostRoute);
app.use("/admin/v1/general-post-draft", router.adminGeneralPostDraftRoute);
app.use("/admin/v1/notification", router.adminNotificationRoute);
app.use("/admin/v1/activity-log", router.adminActivityLogRoute);
app.use("/admin/v1/sos", router.adminSosRoute);
app.use("/admin/v1/global-notification", router.adminGlobalNotificationRoute);

//Google Digital Asset Links
app.get("/.well-known/assetlinks.json", (req, res) => {
  res.removeHeader("X-Powered-By");

  // Set headers manually
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("ETag", 'W/"1fb-VhF8mpwB2gy5o+8llSro2uxY"');
  res.setHeader("Server", "nginx/1.26.0 (Ubuntu)");
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  // Remove restrictive CSP that blocks browser requests
  res.removeHeader("Content-Security-Policy");

  const jsonResponse = Buffer.from(
    JSON.stringify([
      {
        relation: [
          "delegate_permission/common.handle_all_urls",
          "delegate_permission/common.get_login_creds",
        ],
        target: {
          namespace: "android_app",
          package_name: "com.awaazeye.cityalerts",
          sha256_cert_fingerprints: [
            "19:62:37:C1:4F:8E:0D:BA:43:F5:D8:73:03:0C:7D:72:A5:8E:72:40:D9:70:C1:84:0C:01:82:AF:5D:06:3F:7F",
            "FC:5E:2D:7A:C3:8C:5A:6A:C1:9A:15:E4:EF:20:09:10:51:1D:93:D4:3A:FC:66:77:B6:93:D4:4B:30:CB:88:F4",
            "ff:7f:e8:38:1e:4e:88:e1:bf:b0:73:78:ed:88:c6:d1:3c:2d:2b:54:f8:42:75:32:48:ef:2b:94:ae:3f:5c:54",
          ],
        },
      },
    ])
  );

  res.status(200).send(jsonResponse);
});

// error handler
app.use(errorHandler);

// Initialize Socket.IO
initializeSocketIO(server);

// start server
server.listen(config.port, () => {
  console.log(`Server is running on port http://localhost:${config.port}`);
});

// uncaught exceptions and unhandled rejections
process.on("uncaughtException", function (err) {
  console.error("Uncaught Exception:", err);
});
process.on("unhandledRejection", function (err) {
  console.error("Unhandled Rejection:", err);
});
