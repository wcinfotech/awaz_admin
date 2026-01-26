import Joi from "joi";
import enums from "../../config/enum.js";

const createDraftAdminEventPostValidation = Joi.object().keys({
  postType: Joi.string()
    .valid(enums.eventPostTypeEnum.GENERAL_CATEGORY)
    .required()
    .messages({
      "any.required": "Post type is required",
      "string.empty": "Post type cannot be empty",
      "any.only": `Post type must be one of general_category`,
    }),
  isDirectAdminPost: Joi.boolean().optional().messages({
    "boolean.empty": "isDirectAdminPost cannot be empty",
    "boolean.base": "isDirectAdminPost must be a boolean",
  }),
  latitude: Joi.number().optional().messages({
    "number.empty": "Latitude cannot be empty",
    "number.base": "Latitude must be a number",
  }),
  longitude: Joi.number().optional().messages({
    "number.empty": "Longitude cannot be empty",
    "number.base": "Longitude must be a number",
  }),
  title: Joi.string().optional().messages({
    "string.empty": "Title cannot be empty",
    "string.base": "Title must be a string",
  }),
  description: Joi.string().optional().messages({
    "string.empty": "Description cannot be empty",
    "string.base": "Description must be a string",
  }),
  address: Joi.string().optional().messages({
    "string.empty": "address cannot be empty",
    "string.base": "address must be a string",
  }),
  hashTags: Joi.array().optional().messages({
    "any.array": "Hash Tags must be an array",
    "array.base": "Hash Tags must be an array",
  }),
  reactionId: Joi.string().optional().messages({
    "string.base": "Post reactionId ID must be a string",
  }),
  eventTime: Joi.string().optional().messages({
    "any.date": "Event Time cannot be empty",
    "string.base": "Event time must be a string",
  }),
  postCategoryId: Joi.string().optional().messages({
    "string.empty": "postCategoryId cannot be empty",
    "string.base": "postCategoryId must be a string",
  }),
  sensitiveContent: Joi.boolean().optional().messages({
    "boolean.empty": "sensitiveContent cannot be empty",
    "boolean.base": "sensitiveContent must be a string",
  }),
  shareAnonymous: Joi.boolean().optional().messages({
    "boolean.empty": "shareAnonymous cannot be empty",
    "boolean.base": "shareAnonymous must be a string",
  }),
  attachment: Joi.string().optional().messages({
    "string.empty": "attachment cannot be empty",
    "string.base": "attachment must be a string",
  }),
  userId: Joi.string().optional().messages({
    "string.empty": "userId cannot be empty",
    "string.base": "userId must be a string",
  }),
  userRequestedEventId: Joi.string().optional().messages({
    "string.empty": "userRequestedEventId cannot be empty",
    "string.base": "userRequestedEventId must be a string",
  }),
  thumbnail: Joi.string().optional().messages({
    "boolean.empty": "thumbnail cannot be empty",
    "boolean.base": "thumbnail must be a boolean",
  }),
});

export default {
  createDraftAdminEventPostValidation,
};
