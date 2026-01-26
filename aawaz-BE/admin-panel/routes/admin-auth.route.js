import upload from "../../config/multer.config.js";
import validate from "../../middleware/validate.js";
import { adminVerifyToken } from "../../middleware/verifyToken.js";
import authController from "../controllers/admin-auth.controllers.js";
import authValidation from "../validations/admin-auth.validation.js";
import express from "express";

const route = express.Router();

// ----------------
// POST Methods
// ----------------

// verify token
route.post(
  "/verify/token",
  upload.none(),
  adminVerifyToken,
  authController.verifyToken
);

// register
route.post(
  "/register/email",
  upload.none(),
  validate(authValidation.registerByEmail),
  authController.registerByEmail
);

// login
route.post(
  "/login/email",
  upload.none(),
  validate(authValidation.loginByEmail),
  authController.loginByEmail
);

// forgot password
route.post(
  "/forgot-password/email",
  upload.none(),
  validate(authValidation.forgotPasswordEmail),
  authController.forgotPasswordEmail
);

// OTP Verification
route.post(
  "/verify/email/otp",
  upload.none(),
  validate(authValidation.verifyEmailOTP),
  authController.verifyEmailOTP
);

// resend otp verification
route.post(
  "/resend/otp/email",
  upload.none(),
  validate(authValidation.resendEmailOTP),
  authController.resendEmailOTP
);

// ----------------
// PATCH Methods
// ----------------

// change password
route.post(
  "/change-password",
  upload.none(),
  adminVerifyToken,
  validate(authValidation.changePassword),
  authController.changePassword
);

// reset password
route.post(
  "/reset-password",
  upload.none(),
  validate(authValidation.resetPassword),
  authController.resetPassword
);

// delete account
route.delete(
  "/delete-account",
  adminVerifyToken,
  authController.deleteAccount
);  

// login and register by google
route.post(
  "/login-and-register/google",
  upload.none(),
  validate(authValidation.loginAndRegisterByGoogle),
  authController.loginAndRegisterByGoogle
);

export default route;
