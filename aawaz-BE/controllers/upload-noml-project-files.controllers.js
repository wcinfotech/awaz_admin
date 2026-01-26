import { StatusCodes } from "http-status-codes";
import { apiResponse } from "../helper/apiResponse.js";
import helper from "../helper/common.js";

const uploadFile = async (req, res) => {
  const { uploadFileType } = req.body;
  const file = req.file;

  try {

    if(!file){
        return apiResponse({
            res,
            status: false,
            message: "File is required.",
            statusCode: StatusCodes.BAD_REQUEST,
        });
    }

    const fileUrl = await helper.uploadNomlFileMediaInS3Bucket(file, uploadFileType);
    
    return apiResponse({
        res,
        status: true,
        message: "File uploaded successfully.",
        statusCode: StatusCodes.CREATED,
        data: fileUrl,
    });
  } catch (error) {
    return apiResponse({
      res,
      status: false,
      message: "Failed to create event type.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

export default {
    uploadFile
};