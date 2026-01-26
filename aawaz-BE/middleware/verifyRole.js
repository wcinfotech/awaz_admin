import { apiResponse } from "../helper/apiResponse.js";
import { StatusCodes } from "http-status-codes";

export const verifyRole = (roles) => (req, res, next) => {
    try {
        const userRole = req.user.role;
        if (!roles.includes(userRole)) {
            return apiResponse({
                res,
                statusCode: StatusCodes.FORBIDDEN,
                message: "Access denied. You do not have the required role.",
            });
        }
        next();
    } catch (error) {
        return apiResponse({
            res,
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            message: "Internal server error",
        });
    }
};
