import { StatusCodes } from "http-status-codes";
import { apiResponse } from "../helper/apiResponse.js";
import nodemailer from "nodemailer";
import config from "../config/config.js";
import SupportRequest from "../models/support.model.js";
import enums from "../config/enum.js";
import helper from "../helper/common.js";

const sendRequestToSupport = async (req, res) => {
    const { email, subject, description } = req.body;
    const userId = req.user.id;
    const files = req.files || [];

    // const attachments = req.files.map(file => ({
    //     filename: file.originalname,
    //     content: file.buffer,
    //     contentType: file.mimetype
    // }));

    let uploadedFiles = [];
    if (files.length > 0) {
        uploadedFiles = await Promise.all(
            files.map(file => helper.uploadMediaInS3Bucket(file, config.mediaFolderEnum.SUPPORT_REQUEST))
        );
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: config.nodemailer.supportEmail,
            pass: config.nodemailer.supportPassword,
        },
    });

    const mailOptions = {
        from: config.nodemailer.supportEmail,
        replyTo: email,
        to: config.nodemailer.supportEmail,
        subject: subject,
        text: `${description}
Attachments: ${uploadedFiles.join('\n')}
`,
    };

    try {
        await transporter.sendMail(mailOptions);

        const supportRequest = new SupportRequest({ email, subject, description, userId, attachments: uploadedFiles });
        await supportRequest.save();

        return apiResponse({
            res,
            status: true,
            message: "Support request sent successfully!",
            statusCode: StatusCodes.OK,
        });
    } catch (error) {
        return apiResponse({
            res,
            status: false,
            message: "Failed to send support request.",
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        });
    }
};

const updateRequestStatus = async (req, res) => {
    const { requestId } = req.params;
    const { status } = req.body;

    if (![enums.statusEnum.OPEN, enums.statusEnum.CLOSE].includes(status)) {
      return apiResponse({
        res,
        status: false,
        message: "Invalid status value. Allowed values are 'open' or 'close'.",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    try {
      const supportRequest = await SupportRequest.findById({_id: requestId});

      if (!supportRequest) {
        return apiResponse({
          res,
          status: false,
          message: "Request not found.",
          statusCode: StatusCodes.NOT_FOUND,
        });
      }

      supportRequest.status = status;
      await supportRequest.save();

      return apiResponse({
        res,
        status: true,
        message: "Request status updated successfully.",
        statusCode: StatusCodes.OK,
      });
    } catch (error) {
      return apiResponse({
        res,
        status: false,
        message: "Failed to update request status.",
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
};

const getSupportRequestList = async (req, res) => {
    try {
        const { status, search } = req.query;
        const userId = req.user.id;
        const filter = {
            userId: userId
        };
        if (status) {
            filter.status = status;
        }
        if (search) {
            filter.$or = [
                { subject: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        const supportRequests = await SupportRequest.find(filter);
        return apiResponse({
            res,
            status: true,
            message: "Support requests fetched successfully.",
            data: supportRequests,
            statusCode: StatusCodes.OK,
        });
        } catch (error) {
        console.error(error);
        return apiResponse({
            res,
            status: false,
            message: "Failed to fetch support requests.",
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        });
    }
};

export default {
    sendRequestToSupport,
    updateRequestStatus,
    getSupportRequestList
};
