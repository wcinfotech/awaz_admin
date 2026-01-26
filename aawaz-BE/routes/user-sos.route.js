import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import userSosController from "../controllers/user-sos.controller.js";

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

/**
 * @route   POST /api/v1/user/sos-contacts
 * @desc    Save SOS emergency contacts
 * @access  Private
 */
router.post("/sos-contacts", userSosController.saveSosContacts);

/**
 * @route   GET /api/v1/user/sos-contacts
 * @desc    Get user's SOS contacts
 * @access  Private
 */
router.get("/sos-contacts", userSosController.getSosContacts);

/**
 * @route   POST /api/v1/user/sos/trigger
 * @desc    Trigger SOS emergency alert
 * @access  Private
 */
router.post("/sos/trigger", userSosController.triggerSos);

/**
 * @route   GET /api/v1/user/sos/history
 * @desc    Get user's SOS history
 * @access  Private
 */
router.get("/sos/history", userSosController.getSosHistory);

/**
 * @route   GET /api/v1/user/sos/:sosId
 * @desc    Get specific SOS event details
 * @access  Private
 */
router.get("/sos/:sosId", userSosController.getSosEventDetails);

export default router;
