import Joi from "joi";
import enums from "../config/enum.js";

const createUserGeneralPost = Joi.object({
  postType: Joi.string()
    .valid(enums.eventPostTypeEnum.GENERAL_CATEGORY)
    .required()
    .messages({
      "any.required": "Post type is required",
      "string.empty": "Post type cannot be empty",
      "any.only": `Post type must be one of general_category`,
    }),
  longitude: Joi.number().required().messages({
    "any.required": "Longitude is required",
    "number.empty": "Longitude cannot be empty",
    "number.base": "Longitude must be a number",
  }),
  latitude: Joi.number().required().messages({
    "any.required": "Latitude is required",
    "number.empty": "Latitude cannot be empty",
    "number.base": "Latitude must be a number",
  }),
  shareAnonymous: Joi.boolean().required().messages({
    "any.required": "shareAnonymous is required",
    "boolean.empty": "shareAnonymous cannot be empty",
    "boolean.base": "shareAnonymous must be a boolean",
  }),
  additionalDetails: Joi.string().optional().messages({
    "string.base": "Additional details must be a string",
    "string.empty": "Additional details cannot be empty",
  }),
  eventTime: Joi.string().required().messages({
    "any.required": "Event time is required",
    "string.empty": "Event time cannot be empty",
    "string.base": "Event time must be a string",
  }),
  title: Joi.string().optional().messages({
    "string.empty": "title cannot be empty",
    "string.base": "title must be a string",
  }),
  address: Joi.string().optional().messages({
    "string.empty": "address cannot be empty",
    "string.base": "address must be a string",
  }),
  mainCategoryId: Joi.string().optional().messages({
    "string.base": "Main category must be a string",
    "string.empty": "Main category cannot be empty",
  }),
  subCategoryId: Joi.string().optional().messages({
    "string.base": "Sub category must be a string",
    "string.empty": "Sub category cannot be empty",
  }),
});

export default {
  createUserGeneralPost,
};
