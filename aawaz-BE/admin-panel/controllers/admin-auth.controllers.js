import bcrypt from "bcrypt";
import { apiResponse } from "../../helper/apiResponse.js";
import moment from "moment";
import helper from "../../helper/common.js";
import { StatusCodes } from "http-status-codes";
import adminUserService from "../services/user.services.js";
import enums from "../../config/enum.js";
import emailService from "../services/email.services.js";
import ActivityLogger from "../../utils/activity-logger.js";

const sanitizeAdminUser = (user) => {
  if (!user) return null;
  return {
    _id: user._id,
    role: user.role,
    email: user.email,
    name: user.name,
    profilePicture: user?.profilePicture || null,
    ownerApproveStatus: user?.ownerApproveStatus,
    isVerified: user?.isVerified,
  };
};

const verifyToken = async (req, res) => {
  try {
    return apiResponse({
      res,
      statusCode: StatusCodes.OK,
      message: "Token is verify successfully.",
      status: true,
      data: sanitizeAdminUser(req.user),
    });
  } catch (error) {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
      status: false,
    });
  }
};

const registerByEmail = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // find user by email
    const user = await adminUserService.findOne({ email: email });

    if (user) {
      return apiResponse({
        res,
        status: false,
        message: "Email id already in use",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }
    // Hash password
    const hashPassword = await bcrypt.hash(password, 10);

    // Create user
    const doc = {
      email,
      password: hashPassword,
      name,
    };

    await adminUserService.create(doc);

    return apiResponse({
      res,
      statusCode: StatusCodes.CREATED,
      status: true,
      message:
        "Please wait for approval. You will receive an email once approved.",
    });
  } catch (error) {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

const loginByEmail = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await adminUserService.findOne({ email });

    // check user exist with email
    if (!user) {
      // Log failed login attempt - user not found
      ActivityLogger.logAdmin('ADMIN_LOGIN_FAILED', 'Admin login failed - user not found', null, null, {
        email,
        reason: 'User not found',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return apiResponse({
        res,
        statusCode: StatusCodes.NOT_FOUND,
        status: false,
        message: "No account found",
      });
    }

    if (
      !user.isVerified &&
      user?.ownerApproveStatus === enums.ownerApproveStatusEnum.REJECTED
    ) {
      // Log failed login attempt - rejected account
      ActivityLogger.logAdmin('ADMIN_LOGIN_FAILED', 'Admin login failed - account rejected', user._id, null, {
        email,
        reason: 'Account rejected by owner',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return apiResponse({
        res,
        statusCode: StatusCodes.FORBIDDEN,
        status: false,
        message:
          "Login failed! Because your acount has been rejected by owner.",
      });
    }

    // check user is verified or not
    if (!user.isVerified && user.role !== enums.userRoleEnum.OWNER) {
      // Log failed login attempt - not verified
      ActivityLogger.logAdmin('ADMIN_LOGIN_FAILED', 'Admin login failed - account not verified', user._id, null, {
        email,
        reason: 'Account not verified',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return apiResponse({
        res,
        status: false,
        statusCode: StatusCodes.FORBIDDEN,
        message:
          "Please wait for approval. You will receive an email once approved.",
      });
    }

    // compare user password
    const userPassword = user?.password || "";
    const isMatch = await bcrypt.compare(password, userPassword);

    // check for user password is match or not
    if (!isMatch) {
      // Log failed login attempt - invalid password
      ActivityLogger.logAdmin('ADMIN_LOGIN_FAILED', 'Admin login failed - invalid password', user._id, null, {
        email,
        reason: 'Invalid password',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return apiResponse({
        res,
        status: false,
        statusCode: StatusCodes.UNAUTHORIZED,
        message: "Invalid credentials",
      });
    }

    // generate new token
    const token = await helper.generateToken({ userId: user._id }, "24h");

    if (user.role === enums.userRoleEnum.OWNER) {
      user.isVerified = true;
      await user.save();
    }

    const response = {
      token,
      user: {
        _id: user._id,
        role: user.role,
        email: user.email,
        name: user.name,
        profilePicture: user?.profilePicture || null,
        ownerApproveStatus: user?.ownerApproveStatus,
        isVerified: user?.isVerified,
      },
    };

    // Log successful login
    ActivityLogger.logAdmin('ADMIN_LOGIN_SUCCESS', 'Admin logged in successfully', user._id, null, {
      email,
      role: user.role,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    return apiResponse({
      res,
      statusCode: StatusCodes.OK,
      status: true,
      message: "Login successful",
      data: response,
    });
  } catch (error) {
    // Log system error
    ActivityLogger.logError('ADMIN_LOGIN_ERROR', 'Admin login system error', error, {
      email: req.body?.email,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

const forgotPasswordEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await adminUserService.findOne({ email: email });

    if (!user) {
      return apiResponse({
        res,
        statusCode: StatusCodes.NOT_FOUND,
        status: false,
        message: `User does not exist with email ${email}`,
      });
    }

    const { otp, otpExpiresAt } = helper.generateOTP();

    // save otp and otp expiresAt to database
    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    // send otp to email
    const result = await emailService.sendOTPEmail({
      email,
      otp,
      otpExpiresAt,
    });

    if (result.success) {
      return apiResponse({
        res,
        statusCode: StatusCodes.OK,
        status: true,
        message: `OTP send to your email address please check. ${otp}`,
      });
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

const verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await adminUserService.findOne({ email });

    // check if the user exist
    if (!user) {
      return apiResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: "User not found",
        status: false,
      });
    }

    // check otp is valid
    if (otp !== user.otp) {
      return apiResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: "Invalid OTP",
        status: false,
      });
    }

    if (!user.otpExpiresAt || moment().isSameOrAfter(user.otpExpiresAt)) {
      return apiResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: "OTP has expired",
        status: false,
      });
    }

    const token = await helper.generateToken({ userId: user._id }, "24h");

    user.otp = null;
    user.otpExpiresAt = null;

    await user.save();

    return apiResponse({
      res,
      status: true,
      data: { token },
      message: "OTP verified successfully",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

const resendEmailOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await adminUserService.findOne({ email });

    if (!user) {
      return apiResponse({
        res,
        statusCode: StatusCodes.NOT_FOUND,
        message: "User not found",
        status: false,
      });
    }

    const { otp, otpExpiresAt } = helper.generateOTP();

    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    if (email) {
      const result = await emailService.sendOTPEmail({
        email: user.email,
        otp,
        otpExpiresAt,
      });

      if (result.success) {
        return apiResponse({
          res,
          statusCode: StatusCodes.OK,
          status: true,
          message: `OTP sent successfully. ${otp}`,
        });
      } else {
        return res.status(400).json(result);
      }
    }
  } catch (error) {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = req.user;

    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return apiResponse({
        res,
        message: "Old password is incorrect",
        statusCode: StatusCodes.BAD_REQUEST,
        status: false,
      });
    }

    const hashPassword = await bcrypt.hash(newPassword, 10);

    await adminUserService.findByIdAndUpdate(user._id, {
      password: hashPassword,
    });

    return apiResponse({
      res,
      statusCode: StatusCodes.OK,
      message: "Password changed successfully",
      status: true,
    });
  } catch (error) {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await adminUserService.findOne({ email });

    if (!user) {
      return apiResponse({
        res,
        statusCode: StatusCodes.NOT_FOUND,
        status: false,
        message: "User not found",
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    await adminUserService.findByIdAndUpdate(user._id, {
      password: hashPassword,
    });

    return apiResponse({
      res,
      statusCode: StatusCodes.OK,
      message: "Password reset successfully",
      status: true,
    });
  } catch (error) {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await adminUserService.findById({ _id: userId });
    if (!user) {
      return apiResponse({
        res,
        status: false,
        message: "User not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    // Delete the user account
    await adminUserService.findByIdAndDelete(userId);

    return apiResponse({
      res,
      status: true,
      message: "Account deleted successfully",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

const loginAndRegisterByGoogle = async (req, res) => {
  try {
    const { email } = req.body;
    let user = await adminUserService.findOne({ email: email });

    if (user) {
      if (
        user.isVerified &&
        (user.provider === enums.authProviderEnum.GOOGLE ||
          user.provider === enums.authProviderEnum.EMAIL)
      ) {
        const generatedToken = await helper.generateToken(
          { userId: user._id },
          "24h"
        );
        return apiResponse({
          res,
          statusCode: StatusCodes.OK,
          status: true,
          message: "Login successful",
          data: {
            token: generatedToken,
            user: {
              _id: user._id,
              email: user.email,
              role: user.role,
              ownerApproveStatus: user?.ownerApproveStatus,
              isVerified: user?.isVerified,
            },
          },
        });
      } else {
        if (
          user?.ownerApproveStatus === enums.ownerApproveStatusEnum.REJECTED
        ) {
          return apiResponse({
            res,
            statusCode: StatusCodes.FORBIDDEN,
            status: false,
            message:
              "Login failed! Because your acount has been rejected by owner.",
          });
        } else {
          return apiResponse({
            res,
            statusCode: StatusCodes.OK,
            status: true,
            message: "Please wait for approval.",
          });
        }
      }
    } else {
      const doc = {
        email: email,
        provider: enums.authProviderEnum.GOOGLE,
        isVerified: false,
      };
      await adminUserService.create(doc);
      return apiResponse({
        res,
        statusCode: StatusCodes.OK,
        status: true,
        message:
          "Please wait for approval. You will receive an email once approved.",
      });
    }
  } catch (error) {
    return apiResponse({
      error,
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

export default {
  registerByEmail,
  loginByEmail,
  forgotPasswordEmail,
  verifyEmailOTP,
  resendEmailOTP,
  changePassword,
  resetPassword,
  verifyToken,
  deleteAccount,
  loginAndRegisterByGoogle,
};
