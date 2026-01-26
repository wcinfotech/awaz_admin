import Joi from "joi";

const reportValidation = Joi.object({
  reportType: Joi.string()
    .valid("user", "post", "comment", "comment-reply")
    .required()
    .messages({
      "any.required": "Report type is required",
      "string.empty": "Report type cannot be empty",
      "string.base": "Report type must be a string",
      "any.only": "Report type must be one of 'user', 'post', 'comment', or 'comment-reply'",
    }),

  reportedUserId: Joi.when("reportType", {
    is: "user",
    then: Joi.string()
      .required()
      .messages({
        "any.required": "Reported user ID is required for user reports",
        "string.empty": "Reported user ID cannot be empty",
        "string.base": "Reported user ID must be a string",
      }),
    otherwise: Joi.string().optional(),
  }),

  postId: Joi.when("reportType", {
    is: Joi.valid("post", "comment", "comment-reply"),
    then: Joi.string()
      .required()
      .messages({
        "any.required": "Post ID is required for post, comment, or comment-reply reports",
        "string.empty": "Post ID cannot be empty",
        "string.base": "Post ID must be a string",
      }),
    otherwise: Joi.string().optional(),
  }),

  commentId: Joi.when("reportType", {
    is: Joi.valid("comment", "comment-reply"),
    then: Joi.string()
      .required()
      .messages({
        "any.required": "Comment ID is required for comment or comment-reply reports",
        "string.empty": "Comment ID cannot be empty",
        "string.base": "Comment ID must be a string",
      }),
    otherwise: Joi.string().optional(),
  }),

  commentReplyId: Joi.when("reportType", {
    is: "comment-reply",
    then: Joi.string()
      .required()
      .messages({
        "any.required": "Comment reply ID is required for comment-reply reports",
        "string.empty": "Comment reply ID cannot be empty",
        "string.base": "Comment reply ID must be a string",
      }),
    otherwise: Joi.string().optional(),
  }),

  reason: Joi.string().required().messages({
    "any.required": "Reason is required for a report",
    "string.empty": "Reason cannot be empty",
    "string.base": "Reason must be a string",
  }),
});

export default {
  reportValidation,
};
