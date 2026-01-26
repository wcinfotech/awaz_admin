import express from "express";
import jsonController from "../controllers/upload-json.controlles.js";

const route = express.Router();

route.post("/create", jsonController.createJsonTask);
route.get("/list", jsonController.getJsonData);
route.get("/list/:appName/:jsonName", jsonController.getSingleJsonData);


export default route;
