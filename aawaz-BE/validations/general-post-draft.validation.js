import Joi from "joi";
import enums from "../config/enum.js";

const createDraftPostValidation = Joi.object({
  postType: Joi.string()
    .valid(enums.eventPostTypeEnum.GENERAL_CATEGORY)
    .required()
    .messages({
      "any.required": "Post type is required",
      "string.empty": "Post type cannot be empty",
      "any.only": `Post type must be one of general_category`,
    }),
  latitude: Joi.number().required().messages({
    "any.required": "Latitude is required",
    "number.empty": "Latitude cannot be empty",
    "number.base": "Latitude must be a number",
  }),
  longitude: Joi.number().required().messages({
    "any.required": "Longitude is required",
    "number.empty": "Longitude cannot be empty",
    "number.base": "Longitude must be a number",
  }),
  shareAnonymous: Joi.boolean().required().messages({
    "any.required": "shareAnonymous is required",
    "boolean.empty": "shareAnonymous cannot be empty",
    "boolean.base": "shareAnonymous must be a boolean",
  }),
  eventTime: Joi.string().optional().messages({
    "string.empty": "Event time cannot be empty",
    "string.base": "Event time must be a string",
  }),
  additionalDetails: Joi.string().optional().messages({
    "string.base": "Additional details must be a string",
    "string.empty": "Additional details cannot be empty",
  }),
  title: Joi.string().optional().messages({
    "string.base": "Title must be a string",
    "string.empty": "Title cannot be empty",
  }),
  address: Joi.string().optional().messages({
    "string.base": "Address must be a string",
    "string.empty": "Address cannot be empty",
  }),
  mainCategoryId: Joi.string().optional().messages({
    "string.base": "Main category must be a string",
    "string.empty": "Main category cannot be empty",
  }),
  subCategoryId: Joi.string().optional().messages({
    "string.base": "Sub category must be a string",
    "string.empty": "Sub category cannot be empty",
  }),
  countryCode: Joi.string().optional().messages({
    "string.base": "Country code must be a string",
    "string.empty": "Country code cannot be empty",
  }),
  additionMobileNumber: Joi.string().optional().messages({
    "string.base": "Addition mobile number must be a string",
    "string.empty": "Addition mobile number cannot be empty",
  }),
});

export default {
  createDraftPostValidation,
};
