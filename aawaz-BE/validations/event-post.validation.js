import Joi from "joi";
import enums from "../config/enum.js";

const createUserEventPostValidation = Joi.object({
  postType: Joi.string()
    .valid(
      enums.eventPostTypeEnum.INCIDENT,
      enums.eventPostTypeEnum.RESCUE,
      enums.eventPostTypeEnum.GENERAL_CATEGORY
    )
    .required()
    .messages({
      "any.required": "Post type is required",
      "string.empty": "Post type cannot be empty",
      "any.only": `Post type must be one of ${Object.values(
        enums.eventPostTypeEnum
      ).join(", ")}`,
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
  shareAnonymous: Joi.when("postType", {
    is: enums.eventPostTypeEnum.INCIDENT,
    then: Joi.boolean().required().messages({
      "any.required": "shareAnonymous is required",
      "boolean.empty": "shareAnonymous cannot be empty",
      "boolean.base": "shareAnonymous must be a boolean",
    }),
    otherwise: Joi.boolean().optional(),
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
  lostItemName: Joi.when("postType", {
    is: enums.eventPostTypeEnum.RESCUE,
    then: Joi.string().required().messages({
      "any.required": "Lost item name is required",
      "string.empty": "Lost item name cannot be empty",
      "string.base": "Lost item name must be a string",
    }),
    otherwise: Joi.string().optional(),
  }),
  additionMobileNumber: Joi.when("postType", {
    is: enums.eventPostTypeEnum.RESCUE,
    then: Joi.string().required().messages({
      "any.required": "Mobile number is required",
      "string.empty": "Mobile number cannot be empty",
      "string.base": "Mobile number must be a string",
    }),
    otherwise: Joi.string().optional(),
  }),
  countryCode: Joi.when("postType", {
    is: enums.eventPostTypeEnum.RESCUE,
    then: Joi.string().required().messages({
      "any.required": "countryCode is required",
      "string.empty": "countryCode cannot be empty",
      "string.base": "countryCode must be a string",
    }),
    otherwise: Joi.string().optional(),
  }),
  title: Joi.string().optional().messages({
    // "any.required": "title is required",
    "string.empty": "title cannot be empty",
    "string.base": "title must be a string",
  }),
  address: Joi.string().optional().messages({
    // "any.required": "address is required",
    "string.empty": "address cannot be empty",
    "string.base": "address must be a string",
  }),
  postCategoryId: Joi.string().optional().messages({
    // "any.required": "postCategoryId is required",
    "string.empty": "postCategoryId cannot be empty",
    "string.base": "postCategoryId must be a string",
  }),
});

const eventPostIdValidation = Joi.object({
  eventPostId: Joi.string().required().messages({
    "any.required": "eventPostId is required",
    "string.empty": "eventPostId cannot be empty",
    "string.base": "eventPostId must be a string",
  }),
});

const eventPostIdAndAttachmentIdValidation = Joi.object({
  eventPostId: Joi.string().required().messages({
    "any.required": "eventPostId is required",
    "string.empty": "eventPostId cannot be empty",
    "string.base": "eventPostId must be a string",
  }),
  attachmentId: Joi.string().required().messages({
    "any.required": "attachmentId is required",
    "string.empty": "attachmentId cannot be empty",
    "string.base": "attachmentId must be a string",
  }),
});

const eventPostRescueUpdateValidation = Joi.object({
  eventPostId: Joi.string().required().messages({
    "any.required": "eventPostId is required",
    "string.empty": "eventPostId cannot be empty",
    "string.base": "eventPostId must be a string",
  }),
  description: Joi.string().required().messages({
    "any.required": "description is required",
    "string.empty": "description cannot be empty",
    "string.base": "description must be a string",
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
  countryCode: Joi.string().required().messages({
    "any.required": "countryCode is required",
    "string.empty": "countryCode cannot be empty",
    "string.base": "countryCode must be a string",
  }),
  mobileNumber: Joi.string().required().messages({
    "any.required": "mobileNumber is required",
    "string.empty": "mobileNumber cannot be empty",
    "string.base": "mobileNumber must be a string",
  }),
  eventTime: Joi.string().required().messages({
    "any.required": "Event time is required",
    "string.empty": "Event time cannot be empty",
    "string.base": "Event time must be a string",
  }),
});

const mapEventPostValidation = Joi.object({
  postType: Joi.string()
    .valid(
      enums.eventPostTypeEnum.INCIDENT,
      enums.eventPostTypeEnum.RESCUE,
      enums.eventPostTypeEnum.GENERAL_CATEGORY
    )
    .required()
    .messages({
      "any.required": "Post type is required",
      "string.empty": "Post type cannot be empty",
      "any.only": `Post type must be one of ${Object.values(
        enums.eventPostTypeEnum
      ).join(", ")}`,
    }),
  polygonCoords: Joi.array()
    .items(Joi.array().length(2).items(Joi.number().required()).required())
    .min(3)
    .required()
    .messages({
      "any.required": "Polygon coordinates are required",
      "array.min": "A valid polygon requires at least 3 coordinate points",
      "array.base": "Polygon coordinates must be an array",
      "array.includesRequiredUnknowns":
        "Each coordinate must be a pair of latitude and longitude",
    }),
});

const searchEventPostValidation = Joi.object({
  postType: Joi.string()
    .valid(
      enums.eventPostTypeEnum.INCIDENT,
      enums.eventPostTypeEnum.RESCUE,
      enums.eventPostTypeEnum.GENERAL_CATEGORY
    )
    .required()
    .messages({
      "any.required": "Post type is required",
      "string.empty": "Post type cannot be empty",
      "any.only": `Post type must be one of ${Object.values(
        enums.eventPostTypeEnum
      ).join(", ")}`,
    }),
  hashTag: Joi.string().required().messages({
    "any.required": "hashTag is required",
    "string.empty": "hashTag cannot be empty",
    "string.base": "hashTag must be a string",
  }),
});

export default {
  createUserEventPostValidation,
  eventPostIdValidation,
  eventPostIdAndAttachmentIdValidation,
  eventPostRescueUpdateValidation,
  mapEventPostValidation,
  searchEventPostValidation,
};
