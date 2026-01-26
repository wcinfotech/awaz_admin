import Joi from "joi";
import enums from '../config/enum.js';

const createDraftPostValidation = Joi.object({
    postType: Joi.string()
      .valid(enums.eventPostTypeEnum.INCIDENT, enums.eventPostTypeEnum.RESCUE)
      .required()
      .messages({
        "any.required": "Post type is required",
        "string.empty": "Post type cannot be empty",
        "any.only": `Post type must be one of ${Object.values(enums.eventPostTypeEnum).join(", ")}`,
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
    lostItemName: Joi.string().optional().messages({
      "string.base": "Lost item name must be a string",
      "string.empty": "Lost item name cannot be empty",
    }),
    countryCode: Joi.string().optional().messages({
      "string.base": "Country code must be a string",
      "string.empty": "Country code cannot be empty",
    }),
    additionMobileNumber: Joi.string().optional().messages({
      "string.base": "Mobile number must be a string",
      "string.empty": "Mobile number cannot be empty",
    }),
    postCategoryId: Joi.string().optional().messages({
      // "any.required": "postCategoryId is required",
      "string.empty": "postCategoryId cannot be empty",
      "string.base": "postCategoryId must be a string",
    })
});

export default {
    createDraftPostValidation
};
  