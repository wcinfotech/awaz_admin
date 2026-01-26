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
});

const registerByMobile = Joi.object().keys({
  mobileNumber: Joi.string().required().messages({
    "any.required": "Mobile Number is required",
    "string.empty": "Mobile Number cannot be empty",
    "string.base": "Mobile Number must be a string",
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

const loginByMobile = Joi.object().keys({
  mobileNumber: Joi.string().required().messages({
    "any.required": "Mobile Number is required",
    "string.empty": "Mobile Number cannot be empty",
    "string.base": "Mobile Number must be a string",
  }),
});

const loginByGoogle = Joi.object().keys({
  email: Joi.string().email().required().messages({
    "any.required": "Email is required",
    "string.empty": "Email cannot be empty",
    "string.base": "Email must be a string",
    "string.email": "Email must be a valid email",
  }),
  name: Joi.string().required().messages({
    "any.required": "Name is required",
    "string.empty": "Name cannot be empty",
    "string.base": "Name must be a string",
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

const forgotPasswordMobile = Joi.object().keys({
  mobileNumber: Joi.string().required().messages({
    "any.required": "Mobile Number is required",
    "string.empty": "Mobile Number cannot be empty",
    "string.base": "Mobile Number must be a string",
  }),
});

const verifyEmailOTP = Joi.object().keys({
  otp: Joi.number().required().messages({
    "any.required": "OTP is required",
    "number.empty": "OTP cannot be empty",
    "number.base": "OTP must be a number",
  }),
  email: Joi.string().email().required().messages({
    "any.required": "Email is required",
    "string.empty": "Email cannot be empty",
    "string.base": "Email must be a string",
    "string.email": "Email must be a valid email",
  }),
});

const verifyMobileOTP = Joi.object().keys({
  otp: Joi.number().integer().required().messages({
    "any.required": "OTP is required",
    "number.empty": "OTP cannot be empty",
    "number.base": "OTP must be a number",
  }),
  mobileNumber: Joi.string().required().messages({
    "any.required": "Mobile Number is required",
    "string.empty": "Mobile Number cannot be empty",
    "string.base": "Mobile Number must be a string",
  }),
});

const resendEmailOTP = Joi.object().keys({
  email: Joi.string().email().required().messages({
    'any.required': 'Email is required',
    'string.empty': 'Email is required',
    'string.base': 'Email must be a string',
    'string.email': 'Invalid email address',
  }),
});

const resendMobileOTP = Joi.object().keys({
  mobileNumber: Joi.string().required().messages({
    "any.required": "Mobile number is required",
    "string.empty": "Mobile number cannot be empty",
    "string.base": "Mobile number must be a string",
  }),
});

const changePassword = Joi.object().keys({
  oldPassword: Joi.string().required().messages({
    "any.required": "Old password is required",
    "string.empty": "Old password cannot be empty",
    "string.base": "Old password must be a string",
  }),
  newPassword: Joi.string().required().messages({
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
})

const loginByApple = Joi.object().keys({
  idToken: Joi.string().required().label("Id token").messages({
    "any.required": "Id token is required",
    "string.empty": "Id token cannot be empty",
    "string.base": "Id token must be a string",
  }),
})

const loginOrRegisterByMobile = Joi.object().keys({
  mobileNumber: Joi.string().required().messages({
    "any.required": "Mobile number is required",
    "string.empty": "Mobile number cannot be empty",
    "string.base": "Mobile number must be a string",
  }),
})

const setPassword = Joi.object().keys({
  password: Joi.string().required().messages({
    "any.required": "Password is required",
    "string.empty": "Password cannot be empty",
    "string.base": "Password must be a string",
  }),
})

const guestLogin = Joi.object().keys({
  deviceId: Joi.string().required().messages({
    "any.required": "DeviceId is required",
    "string.empty": "DeviceId cannot be empty",
    "string.base": "DeviceId must be a string",
  })
})

export default {
  verifyToken,
  registerByEmail,
  registerByMobile,
  loginByEmail,
  loginByMobile,
  loginByGoogle,
  forgotPasswordEmail,
  forgotPasswordMobile,
  verifyEmailOTP,
  verifyMobileOTP,
  resendEmailOTP,
  resendMobileOTP,
  changePassword,
  resetPassword,
  loginByApple,
  loginOrRegisterByMobile,
  setPassword,
  guestLogin
};
