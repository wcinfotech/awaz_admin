import express from "express";
import reportController from "../controllers/report.controllers.js";
import { verifyToken } from "../middleware/verifyToken.js";
import validate from "../middleware/validate.js";
import reportValidation from "../validations/report.controllers.js";

const route = express.Router();

route.post("/create", verifyToken, validate(reportValidation.reportValidation), reportController.createReport);

export default route;
