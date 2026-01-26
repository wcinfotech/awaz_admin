import Joi from "joi";
import enums from "../../config/enum.js";

const updateUserProfile = Joi.object().keys({
  name: Joi.string().required().messages({
    "any.required": "name is required",
    "string.empty": "name cannot be empty",
    "string.base": "name must be a string",
  }),
  mobileNumber: Joi.string().optional().messages({
    "string.empty": "mobileNumber cannot be empty",
    "string.base": "mobileNumber must be a string",
  }),
  countryCode: Joi.string().optional().messages({
    "string.empty": "countryCode cannot be empty",
    "string.base": "countryCode must be a string",
  }),
});

const approveAndRejectValidation = Joi.object().keys({
  registerAdminId: Joi.string().required().messages({
    "any.required": "registerAdminId is required",
    "string.empty": "registerAdminId cannot be empty",
    "string.base": "registerAdminId must be a string",
  }),
  status: Joi.string().valid(enums.ownerApproveStatusEnum.APPROVED, enums.ownerApproveStatusEnum.REJECTED, enums.ownerApproveStatusEnum.PENDING).required().messages({
    "any.required": "status is required",
    "string.empty": "status cannot be empty",
    "any.only": `status must be either '${enums.ownerApproveStatusEnum.PENDING}', '${enums.ownerApproveStatusEnum.APPROVED}' or '${enums.ownerApproveStatusEnum.REJECTED}'`,
  }),
});

const fcmtokenUpdateValidation = Joi.object().keys({
  fcmToken: Joi.string().required().messages({
    "any.required": "fcmToken is required",
    "string.empty": "fcmToken cannot be empty",
    "string.base": "fcmToken must be a string",
  })
});

const adminRadiusValidation = Joi.object().keys({
  radius: Joi.number().min(0).max(12).required().messages({
    "any.required": "radius is required",
    "number.base": "radius must be a number",
    "number.min": "radius cannot be less than 0",
    "number.max": "radius cannot be greater than 12"
  })
});

export default {
    updateUserProfile,
    approveAndRejectValidation,
    fcmtokenUpdateValidation,
    adminRadiusValidation
};