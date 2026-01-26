import Joi from "joi";
import enums from "../../config/enum.js";

const createAdminEventPostValidation = Joi.object().keys({
  postType: Joi.string()
    .valid(enums.eventPostTypeEnum.GENERAL_CATEGORY)
    .required()
    .messages({
      "any.required": "Post type is required",
      "string.empty": "Post type cannot be empty",
      "any.only": `Post type must be one of general_category`,
    }),
  isDirectAdminPost: Joi.boolean().required().messages({
    "any.required": "isDirectAdminPost is required",
    "boolean.empty": "isDirectAdminPost cannot be empty",
    "boolean.base": "isDirectAdminPost must be a boolean",
  }),
  reactionId: Joi.string().optional().messages({
    "string.base": "Post reactionId ID must be a string",
  }),
  title: Joi.string().required().messages({
    "any.required": "Title is required",
    "string.empty": "Title cannot be empty",
    "string.base": "Title must be a string",
  }),
  description: Joi.string().optional().messages({
    "string.empty": "Description cannot be empty",
    "string.base": "Description must be a string",
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
  address: Joi.string().optional().messages({
    "string.empty": "address cannot be empty",
    "string.base": "address must be a string",
  }),
  hashTags: Joi.array().optional().messages({
    "any.array": "Hash Tags must be an array",
    "array.base": "Hash Tags must be an array",
  }),
  eventTime: Joi.string().required().messages({
    "any.required": "Event Time is required",
    "any.date": "Event Time cannot be empty",
    "string.base": "Event time must be a string",
  }),
  userId: Joi.string().when("isDirectAdminPost", {
    is: false,
    then: Joi.string().required().messages({
      "any.required": "userId is required for user requested posts",
      "string.empty": "userId cannot be empty",
      "string.base": "userId must be a string",
    }),
    otherwise: Joi.string().optional().allow(null),
  }),
  userRequestedEventId: Joi.string().when("isDirectAdminPost", {
    is: false,
    then: Joi.string().required().messages({
      "any.required":
        "userRequestedEventId is required for user requested posts",
      "string.empty": "userRequestedEventId cannot be empty",
      "string.base": "userRequestedEventId must be a string",
    }),
    otherwise: Joi.string().optional().allow(null),
  }),
  thumbnail: Joi.string().optional().messages({
    "boolean.empty": "thumbnail cannot be empty",
    "boolean.base": "thumbnail must be a string",
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

const updateAdminEventPostValidation = Joi.object().keys({
  eventPostId: Joi.string().required().messages({
    "any.required": "eventPostId is required",
    "string.empty": "eventPostId cannot be empty",
    "string.base": "eventPostId must be a string",
  }),
  title: Joi.string().optional().messages({
    "string.base": "Title must be a string",
  }),
  description: Joi.string().optional().messages({
    "string.base": "Description must be a string",
  }),
  latitude: Joi.number().optional().messages({
    "number.base": "Latitude must be a number",
  }),
  longitude: Joi.number().optional().messages({
    "number.base": "Longitude must be a number",
  }),
  address: Joi.string().optional().messages({
    "string.base": "Address must be a string",
  }),
  hashTags: Joi.array().optional().messages({
    "array.base": "HashTags must be an array",
  }),
  eventTime: Joi.string().optional().messages({
    "string.base": "Event Time must be a string",
  }),
  reactionId: Joi.string().optional().messages({
    "string.base": "Post reactionId ID must be a string",
  }),
  postCategoryId: Joi.string().optional().messages({
    "string.base": "Post postCategoryId ID must be a string",
  }),
  commentCounts: Joi.number().optional().messages({
    "number.base": "Latitude must be a number",
  }),
  reactionCounts: Joi.number().optional().messages({
    "number.base": "reactionCounts must be a number",
  }),
  sharedCount: Joi.number().optional().messages({
    "number.base": "sharedCount must be a number",
  }),
  viewCounts: Joi.number().optional().messages({
    "number.base": "viewCounts must be a number",
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
  createAdminEventPostValidation,
  updateAdminEventPostValidation,
};
