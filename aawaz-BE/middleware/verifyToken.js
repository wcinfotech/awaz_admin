import { apiResponse } from "../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";
import helper from "../helper/common.js";
import userService from "../services/user.services.js";
import AdminUser from "../admin-panel/models/admin-user.model.js";

// verify token
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    // check bearer token
    if (!token) {
      return apiResponse({
        res,
        statusCode: StatusCodes.UNAUTHORIZED,
        message: "Authorization token is required",
      });
    }

    // verify token
    const { userId } = await helper.verifyToken(token);

    if (!userId) {
      return apiResponse({
        res,
        statusCode: StatusCodes.UNAUTHORIZED,
        error: "Authorization token is expired or invalid",
      });
    }

    // get user
    const user = await userService.findById(userId);

    // check user is verified or not
    if (!user?.isVerified) {
      return apiResponse({
        res,
        statusCode: StatusCodes.UNAUTHORIZED,
        message: "Please verify your email",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return apiResponse({
      res,
      statusCode: StatusCodes.UNAUTHORIZED,
      message: "Authorization token is expired or invalid",
    });
  }
};

export const adminVerifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    // check bearer token
    if (!token) {
      return apiResponse({
        res,
        statusCode: StatusCodes.UNAUTHORIZED,
        message: "Authorization token is required",
      });
    }

    // verify token
    const { userId } = await helper.verifyToken(token);

    if (!userId) {
      return apiResponse({
        res,
        statusCode: StatusCodes.UNAUTHORIZED,
        error: "Authorization token is expired or invalid",
      });
    }

    // get user
    const user = await AdminUser.findById({ _id: userId });

    // check user is verified or not
    if (!user?.isVerified) {
      return apiResponse({
        res,
        statusCode: StatusCodes.UNAUTHORIZED,
        message: "Please verify your email",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return apiResponse({
      res,
      statusCode: StatusCodes.UNAUTHORIZED,
      message: "Authorization token is expired or invalid",
    });
  }
};
