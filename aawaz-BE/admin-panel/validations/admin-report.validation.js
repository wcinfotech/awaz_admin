import Joi from "joi";

const deleteCommentValidation = Joi.object().keys({
  reportType: Joi.string()
  .valid("comment", "comment-reply")
  .required()
  .messages({
    "any.required": "Report type is required",
    "string.empty": "Report type cannot be empty",
    "string.base": "Report type must be a string",
    "any.only": "Report type must be one of 'comment', or 'comment-reply'",
  }),
  reportId: Joi.string().required().messages({
    "any.required": "reportId is required",
    "string.empty": "reportId cannot be empty",
    "string.base": "reportId must be a string",
  }),
  postId: Joi.string().required().messages({
    "any.required": "postId is required",
    "string.empty": "postId cannot be empty",
    "string.base": "postId must be a string",
  }),
  commentId: Joi.string().required().messages({
    "any.required": "commentId is required",
    "string.empty": "commentId cannot be empty",
    "string.base": "commentId must be a string",
  }),
  commentReplyId: Joi.string()
  .when('reportType', {
    is: 'comment-reply',
    then: Joi.string().required().messages({
      "any.required": "commentReplyId is required when reportType is 'comment-reply'",
      "string.empty": "commentReplyId cannot be empty",
      "string.base": "commentReplyId must be a string",
    }),
    otherwise: Joi.string().optional(),
  }),
});

export default {
  deleteCommentValidation,
};