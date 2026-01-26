import Joi from "joi";

const verifyToken = Joi.object({
  token: Joi.string().required().messages({
    "any.required": "Token is required",
    "string.empty": "Token cannot be empty",
    "string.base": "Token must be a string",
  }),
});

const registerByEmail = Joi.object().keys({
  email: Joi.string().email().required().messages({
    "any.required": "Email is required",
    "string.empty": "Email cannot be empty",
    "string.base": "Email must be a string",
    "string.email": "Email must be a valid email",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
    "string.empty": "Password cannot be empty",
    "string.base": "Password must be a string",
  }),
  name: Joi.string().required().messages({
    "any.required": "Name is required",
    "string.empty": "Name cannot be empty",
    "string.base": "Name must be a string",
  }),
});

const loginByEmail = Joi.object().keys({
  email: Joi.string().email().required().messages({
    "any.required": "Email is required",
    "string.empty": "Email cannot be empty",
    "string.base": "Email must be a string",
    "string.email": "Email must be a valid email",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
    "string.empty": "Password cannot be empty",
    "string.base": "Password must be a string",
  }),
});

const forgotPasswordEmail = Joi.object().keys({
  email: Joi.string().email().lowercase().required().messages({
    "any.required": "Email is required",
    "string.empty": "Email cannot be empty",
    "string.base": "Email must be a string",
    "string.email": "Email must be a valid email",
  }),
});

const verifyEmailOTP = Joi.object().keys({
  otp: Joi.number().required().messages({
    "any.required": "OTP is required",
    "number.empty": "OTP must be a number",
    "number.base": "OTP must be a number",
  }),
  email: Joi.string().email().required().messages({
    "any.required": "Email is required",
    "string.empty": "Email cannot be empty",
    "string.base": "Email must be a string",
    "string.email": "Email must be a valid email",
  }),
});

const resendEmailOTP = Joi.object().keys({
  email: Joi.string().email().required().messages({
    "any.required": "Email is required",
    "string.empty": "Email cannot be empty",
    "string.base": "Email must be a string",
    "string.email": "Email must be a valid email",
  }),
});

const changePassword = Joi.object().keys({
  oldPassword: Joi.string().label("Old password").required().messages({
    "any.required": "Old password is required",
    "string.empty": "Old password cannot be empty",
    "string.base": "Old password must be a string",
  }),
  newPassword: Joi.string().label("New password").required().messages({
    "any.required": "New password is required",
    "string.empty": "New password cannot be empty",
    "string.base": "New password must be a string",
  }),
  confirmNewPassword: Joi.string().valid(Joi.ref("newPassword")).required().messages({
    "any.required": "Confirm new password is required",
    "string.empty": "Confirm new password cannot be empty",
    "string.base": "Confirm new password must be a string",
    "any.only": "New password and confirm new password must be same",
  }),
});

const resetPassword = Joi.object().keys({
  email: Joi.string().email().required().messages({
    "any.required": "Email is required",
    "string.empty": "Email cannot be empty",
    "string.base": "Email must be a string",
    "string.email": "Email must be a valid email",
  }),
  password: Joi.string().required().label("password").messages({
    "any.required": "Password is required",
    "string.empty": "Password cannot be empty",
    "string.base": "Password must be a string",
  }),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.required": "Confirm password is required",
    "string.empty": "Confirm password cannot be empty",
    "string.base": "Confirm password must be a string",
    "any.only": "Password and confirm password must be same",
  }),
});

const loginAndRegisterByGoogle = Joi.object().keys({
  email: Joi.string().email().required().messages({
    "any.required": "Email is required",
    "string.empty": "Email cannot be empty",
    "string.base": "Email must be a string",
    "string.email": "Email must be a valid email",
  }),
});

export default {
  verifyToken,
  registerByEmail,
  loginByEmail,
  forgotPasswordEmail,
  verifyEmailOTP,
  resendEmailOTP,
  changePassword,
  resetPassword,
  loginAndRegisterByGoogle
};
