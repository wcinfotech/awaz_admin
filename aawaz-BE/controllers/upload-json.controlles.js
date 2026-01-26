import { StatusCodes } from "http-status-codes";
import { apiResponse } from "../helper/apiResponse.js";
import JsonModel from "../models/upload-json.model.js";


const createJsonTask = async (req, res) => {
    try {
        const { appName, jsonName, jsonData } = req.body;
        if (!appName || !jsonName || !jsonData) {
            return apiResponse({
                res,
                status: false,
                message: "App name, JSON name, and JSON data are required!",
                statusCode: StatusCodes.BAD_REQUEST,
            });
        }

        const existingJson = await JsonModel.findOne({ appName, jsonName });
        if (existingJson) {
            return apiResponse({
                res,
                status: false,
                message: "JSON with this name already exists for the app!",
                statusCode: StatusCodes.CONFLICT,
            });
        }

        // Save JSON to DB
        const newJson = new JsonModel({ appName, jsonName, jsonData });
        await newJson.save();

        return apiResponse({
            res,
            status: true,
            message: "JSON uploaded successfully!",
            statusCode: StatusCodes.CREATED,
        });
    } catch (error) {
        console.log("errrorr", error)
        return apiResponse({
            res,
            status: false,
            message: "Failed to upload JSON.",
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        });
    }
};

const getSingleJsonData = async (req, res) => {
    try {
        const { id } = req.params;
        const jsonData = await JsonModel.findById({ _id: id }).lean();

        if (!jsonData) {
            return apiResponse({
                res,
                status: false,
                message: "JSON not found!",
                statusCode: StatusCodes.NOT_FOUND,
            });
        }

        return apiResponse({
            res,
            status: true,
            message: "JSON details fetched successfully!",
            data: jsonData,
            statusCode: StatusCodes.OK,
        });
    } catch (error) {
        return apiResponse({
            res,
            status: false,
            message: "Failed to fetch JSON details.",
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        });
    }
};

const getJsonData = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const jsonData = await JsonModel.find()
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        return apiResponse({
            res,
            status: true,
            message: "All JSON data fetched successfully!",
            data: jsonData,
            statusCode: StatusCodes.OK,
        });
    } catch (error) {
        return apiResponse({
            res,
            status: false,
            message: "Failed to fetch JSON data.",
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        });
    }
};

export default { createJsonTask, getSingleJsonData, getJsonData };
