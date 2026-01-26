import Joi from "joi";
import enums from "../../config/enum.js";

const createAdminEventPostValidation = Joi.object().keys({
  isDirectAdminPost: Joi.boolean().required().messages({
    "any.required": "isDirectAdminPost is required",
    "boolean.empty": "isDirectAdminPost cannot be empty",
    "boolean.base": "isDirectAdminPost must be a boolean",
  }),
  postType: Joi.string()
    .valid(enums.eventPostTypeEnum.INCIDENT, enums.eventPostTypeEnum.RESCUE)
    .required()
    .messages({
      "any.required": "Post type is required",
      "string.empty": "Post type cannot be empty",
      "any.only": `Post type must be one of ${Object.values(
        enums.eventPostTypeEnum
      ).join(", ")}`,
    }),
  postCategoryId: Joi.string().when("postType", {
    is: enums.eventPostTypeEnum.INCIDENT,
    then: Joi.string().required().messages({
      "any.required": "postCategoryId is required",
      "string.empty": "postCategoryId cannot be empty",
      "string.base": "postCategoryId must be a string",
    }),
    otherwise: Joi.string().optional(),
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
    // "any.required": "Description is required",
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
    // "any.required": "address is required",
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
  isSensitiveContent: Joi.alternatives().try(
    Joi.boolean(),
    Joi.string().valid('true', 'false')
  ).when("postType", {
    is: enums.eventPostTypeEnum.INCIDENT,
      then: Joi.alternatives().try(
        Joi.boolean(),
        Joi.string().valid('true', 'false')
      ).required().messages({
      "any.required": "isSensitiveContent is required",
      "boolean.empty": "isSensitiveContent cannot be empty",
      "boolean.base": "isSensitiveContent must be a boolean",
      "string.base": "isSensitiveContent must be a boolean",
      "any.only": "isSensitiveContent must be true or false"
    }),
    otherwise: Joi.alternatives().try(
      Joi.boolean(),
      Joi.string().valid('true', 'false')
    ).optional(),
  }),
  isShareAnonymously: Joi.alternatives().try(
    Joi.boolean(),
    Joi.string().valid('true', 'false')
  ).when("postType", {
    is: enums.eventPostTypeEnum.INCIDENT,
      then: Joi.alternatives().try(
        Joi.boolean(),
        Joi.string().valid('true', 'false')
      ).required().messages({
      "any.required": "isShareAnonymously is required",
      "boolean.empty": "isShareAnonymously cannot be empty",
      "boolean.base": "isShareAnonymously must be a boolean",
      "string.base": "isShareAnonymously must be a boolean",
      "any.only": "isShareAnonymously must be true or false"
    }),
    otherwise: Joi.alternatives().try(
      Joi.boolean(),
      Joi.string().valid('true', 'false')
    ).optional(),
  }),
  lostItemName: Joi.string().when("postType", {
    is: enums.eventPostTypeEnum.RESCUE,
    then: Joi.string().required().messages({
      "any.required": "lostItemName is required'",
      "string.empty": "lostItemName cannot be empty",
      "string.base": "lostItemName must be a string",
    }),
    otherwise: Joi.string().optional(),
  }),
  countryCode: Joi.string().when("postType", {
    is: enums.eventPostTypeEnum.RESCUE,
    then: Joi.string().required().messages({
      "any.required": "countryCode is required'",
      "string.empty": "countryCode cannot be empty",
      "string.base": "countryCode must be a string",
    }),
    otherwise: Joi.string().optional(),
  }),
  mobileNumber: Joi.string().when("postType", {
    is: enums.eventPostTypeEnum.RESCUE,
    then: Joi.string().required().messages({
      "any.required": "mobileNumber is required'",
      "string.empty": "mobileNumber cannot be empty",
      "string.base": "mobileNumber must be a string",
    }),
    otherwise: Joi.string().optional(),
  }),
  thumbnail: Joi.string().optional().messages({
    // "any.required": "isThumbnail is required",
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
  // postType: Joi.string().valid(enums.eventPostTypeEnum.INCIDENT, enums.eventPostTypeEnum.RESCUE).optional().messages({
  //   "any.only": `Post type must be one of ${Object.values(enums.eventPostTypeEnum).join(', ')}`,
  // }),
  // isSensitiveContent: Joi.boolean().optional().messages({
  //   "boolean.base": "Sensitive content must be a boolean",
  // }),
  // isShareAnonymously: Joi.boolean().optional().messages({
  //   "boolean.base": "Share anonymously must be a boolean",
  // }),
  // lostItemName: Joi.string().optional().messages({
  //   "string.base": "Lost item name must be a string",
  // }),
  // countryCode: Joi.string().optional().messages({
  //   "string.base": "Country code must be a string",
  // }),
  // mobileNumber: Joi.string().optional().messages({
  //   "string.base": "Mobile number must be a string",
  // }),
  // isThumbnail: Joi.boolean().optional().messages({
  //   "boolean.base": "Is thumbnail must be a boolean",
  // }),
});

const addFileAndTimelineToAdminEventPostValidation = Joi.object().keys({
  postType: Joi.string()
    .valid(enums.eventPostTypeEnum.INCIDENT, enums.eventPostTypeEnum.RESCUE)
    .required()
    .messages({
      "any.required": "Post type is required",
      "string.empty": "Post type cannot be empty",
      "any.only": `Post type must be one of ${Object.values(
        enums.eventPostTypeEnum
      ).join(", ")}`,
    }),
  eventPostId: Joi.string().required().messages({
    "any.required": "eventPostId is required",
    "string.empty": "eventPostId cannot be empty",
    "string.base": "eventPostId must be a string",
  }),
  userId: Joi.string().required().messages({
    "any.required": "userId is required",
    "string.empty": "userId cannot be empty",
    "string.base": "userId must be a string",
  }),
  description: Joi.string().required().messages({
    "any.required": "Description is required",
    "string.empty": "Description cannot be empty",
    "string.base": "Description must be a string",
  }),
  eventTime: Joi.string().required().messages({
    "any.required": "eventTime is required",
    "string.empty": "eventTime cannot be empty",
    "string.base": "eventTime must be a string",
  }),
  attachment: Joi.string().optional().messages({
    "string.empty": "Attachment cannot be empty",
    "string.base": "Attachment must be a string",
  }),
  isShareAnonymously: Joi.boolean().when("postType", {
    is: enums.eventPostTypeEnum.INCIDENT,
    then: Joi.boolean().required().messages({
      "any.required": "isShareAnonymously is required'",
      "boolean.base": "isShareAnonymously must be a boolean",
    }),
    otherwise: Joi.boolean().optional(),
  }),
  isSensitiveContent: Joi.boolean().when("postType", {
    is: enums.eventPostTypeEnum.INCIDENT,
    then: Joi.boolean().required().messages({
      "any.required": "isSensitiveContent is required'",
      "boolean.base": "isSensitiveContent must be a boolean",
    }),
    otherwise: Joi.boolean().optional(),
  }),
  userRequestedEventId: Joi.string().when("postType", {
    is: enums.eventPostTypeEnum.INCIDENT,
    then: Joi.string().required().messages({
      "any.required": "userRequestedEventId is required",
      "string.empty": "userRequestedEventId cannot be empty",
      "string.base": "userRequestedEventId must be a string",
    }),
    otherwise: Joi.string().optional(),
  }),
  address: Joi.string().when("postType", {
    is: enums.eventPostTypeEnum.RESCUE,
    then: Joi.string().required().messages({
      "any.required": "address is required'",
      "string.empty": "address cannot be empty",
      "string.base": "address must be a string",
    }),
    otherwise: Joi.string().optional(),
  }),
  countryCode: Joi.string().when("postType", {
    is: enums.eventPostTypeEnum.RESCUE,
    then: Joi.string().required().messages({
      "any.required": "countryCode is required'",
      "string.empty": "countryCode cannot be empty",
      "string.base": "countryCode must be a string",
    }),
    otherwise: Joi.string().optional(),
  }),
  mobileNumber: Joi.string().when("postType", {
    is: enums.eventPostTypeEnum.RESCUE,
    then: Joi.string().required().messages({
      "any.required": "mobileNumber is required'",
      "string.empty": "mobileNumber cannot be empty",
      "string.base": "mobileNumber must be a string",
    }),
    otherwise: Joi.string().optional(),
  }),
  hashTags: Joi.array().optional().messages({
    "any.array": "Hash Tags must be an array",
    "array.base": "Hash Tags must be an array",
  }),
  rescueUpdateId: Joi.string().when("postType", {
    is: enums.eventPostTypeEnum.RESCUE,
    then: Joi.string().required().messages({
      "any.required": "rescueUpdateId is required'",
      "string.empty": "rescueUpdateId cannot be empty",
      "string.base": "rescueUpdateId must be a string",
    }),
    otherwise: Joi.string().optional(),
  }),
});

const updateUserRequestedEventPostStatusValidation = Joi.object().keys({
  eventPostId: Joi.string().required().messages({
    "any.required": "eventPostId is required",
    "string.empty": "eventPostId cannot be empty",
    "string.base": "eventPostId must be a string",
  }),
  status: Joi.string()
    .valid(
      enums.eventPostStatusEnum.PENDING,
      enums.eventPostStatusEnum.APPROVED,
      enums.eventPostStatusEnum.REJECTED
    )
    .required()
    .messages({
      "any.required": "status is required",
      "string.empty": "status cannot be empty",
      "string.base": "status must be a string",
      "any.only": `status must be one of ${enums.eventPostStatusEnum.PENDING}, ${enums.eventPostStatusEnum.APPROVED}, or ${enums.eventPostStatusEnum.REJECTED}`,
    }),
  isSendNotification: Joi.boolean().required().messages({
    "any.required": "isSendNotification is required",
    "boolean.base": "isSendNotification must be a boolean",
  }),
});

const uploadFileToAdminEventPostValidation = Joi.object().keys({
  isSensitiveContent: Joi.boolean().required().messages({
    "any.required": "isSensitiveContent is required",
    "boolean.base": "isSensitiveContent must be a boolean",
  }),
  eventPostId: Joi.string().required().messages({
    "any.required": "eventPostId is required",
    "string.empty": "eventPostId cannot be empty",
    "string.base": "eventPostId must be a string",
  }),
});

const updateTimelineToAdminEventPostValidation = Joi.object().keys({
  postType: Joi.string()
    .valid(enums.eventPostTypeEnum.INCIDENT, enums.eventPostTypeEnum.RESCUE)
    .required()
    .messages({
      "any.required": "Post type is required",
      "string.empty": "Post type cannot be empty",
      "any.only": `Post type must be one of ${Object.values(
        enums.eventPostTypeEnum
      ).join(", ")}`,
    }),
  eventPostId: Joi.string().required().messages({
    "any.required": "eventPostId is required",
    "string.empty": "eventPostId cannot be empty",
    "string.base": "eventPostId must be a string",
  }),
  attachmentId: Joi.string().optional().messages({
    "string.empty": "attachmentId cannot be empty",
    "string.base": "attachmentId must be a string",
  }),
  description: Joi.string().required().messages({
    "any.required": "description is required",
    "string.empty": "description cannot be empty",
    "string.base": "description must be a string",
  }),
  eventTime: Joi.string().required().messages({
    "any.required": "eventTime is required",
    "string.empty": "eventTime cannot be empty",
    "string.base": "eventTime must be a string",
  }),
  address: Joi.string().when("postType", {
    is: enums.eventPostTypeEnum.RESCUE,
    then: Joi.string().required().messages({
      "any.required": "address is required'",
      "string.empty": "address cannot be empty",
      "string.base": "address must be a string",
    }),
    otherwise: Joi.string().optional(),
  }),
  hashTags: Joi.array().optional().messages({
    "any.array": "Hash Tags must be an array",
    "array.base": "Hash Tags must be an array",
  }),
});

const rejectUserRequestedRescueUpdateValidation = Joi.object().keys({
  rescueUpdateStatus: Joi.string()
    .valid(
      enums.eventPostStatusEnum.PENDING,
      enums.eventPostStatusEnum.REJECTED
    )
    .required()
    .messages({
      "any.required": "rescueUpdateStatus is required",
      "string.empty": "rescueUpdateStatus cannot be empty",
      "string.base": "rescueUpdateStatus must be a string",
    }),
  eventPostId: Joi.string().required().messages({
    "any.required": "eventPostId is required",
    "string.empty": "eventPostId cannot be empty",
    "string.base": "eventPostId must be a string",
  }),
  rescueUpdateId: Joi.string().required().messages({
    "any.required": "rescueUpdateId is required",
    "string.empty": "rescueUpdateId cannot be empty",
    "string.base": "rescueUpdateId must be a string",
  }),
});

const updateTimelineFileUpdateAdminEventPostValidation = Joi.object().keys({
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

const updateLostItemFoundStatusValidation = Joi.object().keys({
  eventPostId: Joi.string().required().messages({
    "any.required": "eventPostId is required",
    "string.empty": "eventPostId cannot be empty",
    "string.base": "eventPostId must be a string",
  }),
  status: Joi.string()
    .valid(
      enums.eventPostedCurrentStatusEnum.PENDING,
      enums.eventPostedCurrentStatusEnum.RESOLVED
    )
    .required()
    .messages({
      "any.required": "status is required",
      "string.empty": "status cannot be empty",
      "string.base": "status must be a string",
      "any.only": `status must be either ${enums.eventPostedCurrentStatusEnum.PENDING} or ${enums.eventPostedCurrentStatusEnum.RESOLVED}`,
    }),
});

export default {
  createAdminEventPostValidation,
  addFileAndTimelineToAdminEventPostValidation,
  updateAdminEventPostValidation,
  updateUserRequestedEventPostStatusValidation,
  uploadFileToAdminEventPostValidation,
  updateTimelineToAdminEventPostValidation,
  rejectUserRequestedRescueUpdateValidation,
  updateTimelineFileUpdateAdminEventPostValidation,
  updateLostItemFoundStatusValidation,
};
