import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import {
    logAppInstall,
    logAppUninstall,
    logAppOpen,
    logAppCrash,
    logDailyMetrics
} from "../controllers/app-lifecycle.controllers.js";

const router = Router();

// Apply user authentication to all routes
router.use(verifyToken);

/**
 * POST /api/v1/app/install
 * Log app installation
 */
router.post("/install", logAppInstall);

/**
 * POST /api/v1/app/uninstall
 * Log app uninstallation
 */
router.post("/uninstall", logAppUninstall);

/**
 * POST /api/v1/app/open
 * Log app opening (daily active user)
 */
router.post("/open", logAppOpen);

/**
 * POST /api/v1/app/crash
 * Log app crash
 */
router.post("/crash", logAppCrash);

/**
 * POST /api/v1/app/daily-metrics
 * Log daily metrics (internal/system use only)
 */
router.post("/daily-metrics", logDailyMetrics);

export default router;
