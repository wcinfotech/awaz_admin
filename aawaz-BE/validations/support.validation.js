import Joi from "joi";

const supportRequest = Joi.object().keys({
  email: Joi.string().email().required().messages({
    "any.required": "Email is required",
    "string.empty": "Email cannot be empty",
    "string.base": "Email must be a string",
    "string.email": "Email must be a valid email",
  }),
  subject: Joi.string().required().messages({
    "any.required": "Subject is required",
    "string.empty": "Subject cannot be empty",
    "string.base": "Subject must be a string",
  }),
  description: Joi.string().required().messages({
    "any.required": "Description is required",
    "string.empty": "Description cannot be empty",
    "string.base": "Description must be a string",
  }),
});

export default {
  supportRequest,
};
