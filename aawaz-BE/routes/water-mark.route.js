import express from "express";
import multer from "multer";
import waterMarkController from "../controllers/water-mark.controllers.js";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const route = express.Router();

route.post(
  "/update-water-mark",
  upload.single("file"),
  waterMarkController.updateWaterMark
);

export default route;
