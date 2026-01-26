import bcrypt from "bcrypt";
import config from "../config/config.js";
import { OAuth2Client } from "google-auth-library";
import { apiResponse } from "../helper/apiResponse.js";
import enums from "../config/enum.js";
import moment from "moment";
import helper from "../helper/common.js";
import { StatusCodes } from "http-status-codes";
import userService from "../services/user.services.js";
import emailService from "../services/email.services.js";
import jwt from "jsonwebtoken";
import smsServices from "../services/sms.services.js";
import ActivityLogger from "../utils/activity-logger.js";

const verifyToken = async (req, res) => {
  try {
    return apiResponse({
      res,
      statusCode: StatusCodes.OK,
      message: "Token is verify successfully.",
      status: true,
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

const loginOrRegisterByMobile = async (req, res) => {
  try {
    const { mobileNumber } = req.body;

    // Find user by mobile number
    let user = await userService.findOne({ mobileNumber });

    // If user does not exist, register the user
    if (!user) {
      // Generate OTP
      const { otp, otpExpiresAt } = helper.generateOTP();

      // Send OTP to mobile number
      // await smsServices.sendOTPSMS({
      //   mobileNumber,
      //   otp,
      //   otpExpiresAt,
      // });

      // Create user
      const doc = {
        mobileNumber,
        provider: enums.authProviderEnum.MOBILE,
        otp: otp,
        otpExpiresAt: otpExpiresAt,
      };

      user = await userService.create(doc);

      return apiResponse({
        res,
        statusCode: StatusCodes.CREATED,
        status: true,
        data: {
          isNewUser: true,
        },
        message: `Registration complete! OTP sent to your mobile number, please check. ${otp}`,
      });
    }

    if (user && user.isBlocked) {
      return apiResponse({
        res,
        statusCode: StatusCodes.FORBIDDEN,
        status: false,
        message: "Your account has been blocked. Please contact support.",
      });
    }

    // If user exists, proceed with login
    // if (!user.isVerified && ) {
    //   return apiResponse({
    //     res,
    //     statusCode: StatusCodes.FORBIDDEN,
    //     status: false,
    //     message: "Please verify your account",
    //   });
    // }
    // Generate OTP
    const { otp, otpExpiresAt } = helper.generateOTP();

    // Send OTP to mobile number
    // await smsServices.sendOTPSMS({
    //   mobileNumber,
    //   otp,
    //   otpExpiresAt,
    // });

    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    return apiResponse({
      res,
      statusCode: StatusCodes.OK,
      status: true,
      data: {
        isNewUser: false,
      },
      message: `OTP sent to your mobile number, please check. ${otp}`,
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

const registerByEmail = async (req, res) => {
  try {
    const { email, password } = req.body;

    // find user by email
    const user = await userService.findOne({ email: email, isDeleted: false });

    if (user && user.isVerified) {
      ActivityLogger.logUser('USER_REGISTER_FAILED', 'Registration attempt with existing email', user._id, {
        email,
        reason: 'email_already_exists',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      return apiResponse({
        res,
        status: false,
        message: "Email id already in use",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    // Hash password
    const hashPassword = await bcrypt.hash(password, 10);

    // generate otp
    const { otp, otpExpiresAt } = helper.generateOTP();

    // send otp to email
    const result = await emailService.sendOTPEmail({
      email,
      otp,
      otpExpiresAt,
    });

    let newUser;
    if (user) {
      user.password = hashPassword;
      user.otp = otp;
      user.otpExpiresAt = otpExpiresAt;
      await user.save();
      newUser = user;
    } else {
      const doc = {
        email,
        password: hashPassword,
        provider: enums.authProviderEnum.EMAIL,
        otp: otp,
        otpExpiresAt: otpExpiresAt,
      };

      newUser = await userService.create(doc);
      
      // Log new user registration
      ActivityLogger.logUser('USER_REGISTERED', 'New user registered via email', newUser._id, {
        email,
        registrationMethod: 'email',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }

    if (result.success) {
      return apiResponse({
        res,
        statusCode: StatusCodes.CREATED,
        status: true,
        message: `Registration complete! Check your email for verification OTP`,
      });
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    ActivityLogger.logError('USER_REGISTER_ERROR', 'Error during user registration', error, {
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

const registerByMobile = async (req, res) => {
  try {
    const { mobileNumber } = req.body;

    // find user by mobile number
    const user = await userService.findOne({ mobileNumber });

    if (user && user.isVerified) {
      return apiResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        status: false,
        message: "Mobile number already in use",
      });
    }

    // generate otp
    const { otp, otpExpiresAt } = helper.generateOTP();

    // // send otp to mobile number
    // await smsServices.sendOTPSMS({
    //   mobileNumber,
    //   otp,
    //   otpExpiresAt,
    // });

    // Create user
    const doc = {
      mobileNumber,
      provider: enums.authProviderEnum.MOBILE,
      otp: otp,
      otpExpiresAt: otpExpiresAt,
    };

    await userService.create(doc);

    return apiResponse({
      res,
      statusCode: StatusCodes.CREATED,
      status: true,
      message: `Registration complete! OTP send to your mobile number please check. ${otp}`,
      // data: { otp },
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
    const user = await userService.findOne({ email, isDeleted: false });

    // check user exist with email
    if (!user || user.isDeleted) {
      ActivityLogger.logUser('USER_LOGIN_FAILED', 'Login attempt with non-existent email', null, {
        email,
        reason: 'user_not_found',
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

    if (user && user.isBlocked) {
      ActivityLogger.logUser('USER_LOGIN_FAILED', 'Login attempt by blocked user', user._id, {
        email,
        reason: 'user_blocked',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      return apiResponse({
        res,
        statusCode: StatusCodes.FORBIDDEN,
        status: false,
        message: "Your account has been blocked. Please contact support.",
      });
    }

    // check user is verified or not
    if (!user.isVerified) {
      ActivityLogger.logUser('USER_LOGIN_FAILED', 'Login attempt by unverified user', user._id, {
        email,
        reason: 'user_not_verified',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      return apiResponse({
        res,
        status: false,
        statusCode: StatusCodes.FORBIDDEN,
        message: "Please verify your account",
      });
    }

    // compare user password
    const userPassword = user?.password || "";
    const isMatch = await bcrypt.compare(password, userPassword);

    // check for user password is match or not
    if (!isMatch) {
      ActivityLogger.logUser('USER_LOGIN_FAILED', 'Login attempt with invalid password', user._id, {
        email,
        reason: 'invalid_password',
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
    const token = await helper.generateToken({ userId: user._id });

    // Log successful login
    ActivityLogger.logUser('USER_LOGIN', 'User logged in successfully', user._id, {
      email,
      loginMethod: 'email',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    const users = {
      token: token,
      user: {
        _id: user?._id,
        email: user?.email,
        name: user?.name,
        mobileNumber: user?.mobileNumber,
        provider: user?.provider,
        role: user?.role,
        isVerified: user?.isVerified,
        country: user?.country,
        state: user?.state,
        city: user?.city,
        dateOfBirth: user?.dateOfBirth,
        profilePicture: user?.profilePicture,
        username: user?.username,
        notificationPreferences: user?.notificationPreferences
          ? user?.notificationPreferences
          : null,
        userRadius: user?.radius,
      },
    };

    return apiResponse({
      res,
      statusCode: StatusCodes.OK,
      status: true,
      message: "Login successful",
      data: users,
    });
  } catch (error) {
    ActivityLogger.logError('USER_LOGIN_ERROR', 'Error during user login', error, {
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

const loginByMobile = async (req, res) => {
  try {
    const { mobileNumber } = req.body;
    const user = await userService.findOne({ mobileNumber });

    //check user exist with mobile number
    if (!user) {
      return apiResponse({
        res,
        statusCode: StatusCodes.NOT_FOUND,
        status: false,
        message: "User not found",
      });
    }

    // check user is verified or not
    if (!user.isVerified) {
      return apiResponse({
        res,
        statusCode: StatusCodes.FORBIDDEN,
        status: false,
        message: "Please verify your account",
      });
    }

    // generate otp
    const { otp, otpExpiresAt } = helper.generateOTP();

    // // send otp to mobile number
    // await smsServices.sendOTPSMS({
    //   mobileNumber,
    //   otp,
    //   otpExpiresAt,
    // });

    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    return apiResponse({
      res,
      statusCode: StatusCodes.CREATED,
      status: true,
      message: `OTP send to your mobile number please check. ${otp}`,
      // data: { otp },
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

const loginByGoogle = async (req, res) => {
  try {
    const { email, name, profilePicture } = req.body;
    let isNewUser = false;

    // new OAuth2Client({
    //   clientId: config.google.clientId,
    //   clientSecret: config.google.clientSecret,
    // });

    if (!email) {
      return apiResponse({
        res,
        statusCode: StatusCodes.UNAUTHORIZED,
        status: false,
        message: "Invalid authentication",
      });
    }

    let user = await userService.findOne({ email: email, isDeleted: false });

    if (user && user.isBlocked) {
      return apiResponse({
        res,
        statusCode: StatusCodes.FORBIDDEN,
        status: false,
        message: "Your account has been blocked. Please contact support.",
      });
    }

    if (!user) {
      user = await userService.create({
        email: email,
        name: name,
        // providerId: null,
        provider: enums.authProviderEnum.GOOGLE,
        isVerified: true,
        profilePicture: profilePicture ? profilePicture : null,
      });
      isNewUser = true;
    } else {
      user.isVerified = true;
      user.providerId = null;
      user.provider = enums.authProviderEnum.GOOGLE;
      user.password = user.password;
      user.otp = null;
      user.otpExpiresAt = null;
      // Save changes
      user = await user.save();
    }

    const generatedToken = await helper.generateToken({ userId: user._id });

    const result = {
      token: generatedToken,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        mobileNumber: user.mobileNumber,
        provider: user?.provider,
        role: user.role,
        isVerified: user?.isVerified,
        country: user?.country,
        state: user?.state,
        city: user?.city,
        dateOfBirth: user?.dateOfBirth,
        profilePicture: user?.profilePicture,
        username: user?.username,
        userRadius: user?.radius,
        notificationPreferences: user?.notificationPreferences
          ? user?.notificationPreferences
          : null,
        isNewUser,
      },
    };

    return apiResponse({
      res,
      statusCode: StatusCodes.OK,
      status: true,
      data: result,
      message: "User logged in successfully",
    });
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

const loginByApple = async (req, res) => {
  try {
    const { idToken } = req.body;

    // Decode the Apple token
    const decodedToken = jwt.decode(idToken, { complete: true });
    let isNewUser = false;

    if (!decodedToken) {
      return apiResponse({
        res,
        statusCode: StatusCodes.UNAUTHORIZED,
        status: false,
        message: "Invalid authentication",
      });
    }

    const { email, sub: appleId } = decodedToken.payload;

    let user = await userService.findOne({ email: email, isDeleted: false });

    if (user && user.isBlocked) {
      return apiResponse({
        res,
        statusCode: StatusCodes.FORBIDDEN,
        status: false,
        message: "Your account has been blocked. Please contact support.",
      });
    }

    if (!user) {
      user = await userService.create({
        email: email,
        providerId: appleId,
        provider: enums.authProviderEnum.APPLE,
        isVerified: true,
      });
      isNewUser = true;
    } else {
      user.isVerified = true;
      user.providerId = appleId;
      user.provider = enums.authProviderEnum.APPLE;
      user.password = null;
      user.otp = null;
      user.otpExpiresAt = null;
      user = await user.save();
    }

    const generatedToken = await helper.generateToken({ userId: user._id });

    const result = {
      token: generatedToken,
      user: {
        _id: user._id,
        role: user.role,
        email: user.email,
        mobileNumber: user.mobileNumber,
        name: user.name,
        userRadius: user?.radius,
        notificationPreferences: user?.notificationPreferences
          ? user?.notificationPreferences
          : null,
        isNewUser,
      },
    };

    return apiResponse({
      res,
      statusCode: StatusCodes.OK,
      status: true,
      data: result,
      message: "Login successful",
    });
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

const forgotPasswordEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userService.findOne({ email: email, isDeleted: false });

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

    const result = await emailService.sendOTPEmail({
      email,
      otp,
      otpExpiresAt,
    });

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.log(error);

    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Internal server error",
    });
  }
};

const forgotPasswordMobile = async (req, res) => {
  try {
    const { mobileNumber } = req.body;
    const user = await userService.findOne({ mobileNumber });

    if (!user) {
      return apiResponse({
        res,
        message: `User does not exist`,
        statusCode: StatusCodes.BAD_REQUEST,
        status: false,
      });
    }

    const { otp, otpExpiresAt } = helper.generateOTP();

    // save otp and otp expiresAt to database
    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    // await smsServices.sendOTPSMS({
    //   mobileNumber,
    //   otp,
    //   otpExpiresAt,
    // });

    return apiResponse({
      res,
      statusCode: StatusCodes.OK,
      status: true,
      message: `OTP send to your mobile number please check. ${otp}`,
      // data: { otp },
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

const verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await userService.findOne({ email, isDeleted: false });

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

    const token = await helper.generateToken({ userId: user._id });

    user.isVerified = true;
    user.otp = null;
    user.otpExpiresAt = null;

    await user.save();
    const users = {
      token: token,
      user: {
        _id: user?._id,
        email: user?.email,
        name: user?.name,
        mobileNumber: user?.mobileNumber,
        provider: user?.provider,
        role: user?.role,
        isVerified: user?.isVerified,
        country: user?.country,
        state: user?.state,
        city: user?.city,
        dateOfBirth: user?.dateOfBirth,
        profilePicture: user?.profilePicture,
        username: user?.username,
        userRadius: user?.radius,
        notificationPreferences: user?.notificationPreferences
          ? user?.notificationPreferences
          : null,
      },
    };
    return apiResponse({
      res,
      status: true,
      data: users,

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

const verifyMobileOTP = async (req, res) => {
  try {
    const { mobileNumber, otp } = req.body;

    const user = await userService.findOne({
      mobileNumber,
    });

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
        message: "Invalid OTP",
        statusCode: StatusCodes.BAD_REQUEST,
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

    const token = await helper.generateToken({ userId: user._id });

    user.isVerified = true;
    user.otp = null;
    user.otpExpiresAt = null;

    await user.save();
    const users = {
      token: token,
      user: {
        _id: user?._id,
        email: user?.email,
        name: user?.name,
        mobileNumber: user?.mobileNumber,
        provider: user?.provider,
        role: user?.role,
        isVerified: user?.isVerified,
        country: user?.country,
        state: user?.state,
        city: user?.city,
        dateOfBirth: user?.dateOfBirth,
        profilePicture: user?.profilePicture,
        username: user?.username,
        userRadius: user?.radius,
        notificationPreferences: user?.notificationPreferences
          ? user?.notificationPreferences
          : null,
      },
    };

    return apiResponse({
      res,
      statusCode: StatusCodes.OK,
      status: true,
      data: users,
      message: "OTP verified successfully",
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

    const user = await userService.findOne({ email, isDeleted: false });

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
        return res.status(200).json(result);
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

const resendMobileOTP = async (req, res) => {
  try {
    const { mobileNumber } = req.body;

    const user = await userService.findOne({ mobileNumber });

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

    // await smsServices.sendOTPSMS({
    //   mobileNumber,
    //   otp,
    //   otpExpiresAt,
    // });

    return apiResponse({
      res,
      statusCode: StatusCodes.OK,
      status: true,
      message: `OTP sent successfully. ${otp}`,
      // data: { otp: otp },
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

    await userService.findByIdAndUpdate(user._id, {
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

    // Find user by email
    const user = await userService.findOne({ email, isDeleted: false });

    if (!user) {
      return apiResponse({
        res,
        statusCode: StatusCodes.NOT_FOUND,
        status: false,
        message: "User not found",
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    await userService.findByIdAndUpdate(user._id, {
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

const setPassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    const user = await userService.findById(userId);
    if (!user || user.provider != enums.authProviderEnum.GOOGLE) {
      return apiResponse({
        res,
        message: "User not found or not a Google user.",
        statusCode: StatusCodes.BAD_REQUEST,
        status: false,
      });
    }

    if (user.password != null) {
      return apiResponse({
        res,
        message: "Password already set.",
        statusCode: StatusCodes.BAD_REQUEST,
        status: false,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    return apiResponse({
      res,
      statusCode: StatusCodes.OK,
      message: "Password set successfully.",
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

const guestLogin = async (req, res) => {
  try {
    const { deviceId } = req.body;
    let isNewUser = false;
    let user = await userService.findOne({ deviceId, isDeleted: false });
    if (!user) {
      let username, name;
      let isUnique = false;

      function generateRandomAlphabet(length = 6) {
        const letters = 'abcdefghijklmnopqrstuvwxyz';
        let result = '';
        for (let i = 0; i < length; i++) {
          result += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        return result;
      }

      while (!isUnique) {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const randomName = generateRandomAlphabet();
        username = `guest_${randomNum}`;
        name = `${randomName.charAt(0).toUpperCase()}${randomName.slice(1)}`;

        const existing = await userService.findOne({
          $or: [{ username }, { name }],
        });

        if (!existing) {
          isUnique = true;
        }
      }

      user = await userService.create({
        deviceId,
        username,
        name,
        provider: enums.authProviderEnum.GUEST,
        role: enums.authProviderEnum.GUEST,
        isVerified: true,
      });

      isNewUser = true;
    }

    const generatedToken = await helper.generateToken({ userId: user._id });
    const result = {
      token: generatedToken,
      user: {
        _id: user._id,
        email: user.email || null,
        deviceId: user.deviceId,
        name: user.name || null,
        mobileNumber: user.mobileNumber || null,
        provider: user?.provider,
        role: user.role,
        isVerified: user?.isVerified,
        country: user?.country || null,
        state: user?.state || null,
        city: user?.city || null,
        dateOfBirth: user?.dateOfBirth || null,
        profilePicture: user?.profilePicture || null,
        username: user?.username || null,
        userRadius: user?.radius || null,
        notificationPreferences: user?.notificationPreferences
          ? user?.notificationPreferences
          : null,
        isNewUser,
      },
    };

    return apiResponse({
      res,
      statusCode: StatusCodes.OK,
      status: true,
      data: result,
      message: "User logged in successfully",
    });
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
  registerByMobile,
  loginByEmail,
  loginByMobile,
  loginByGoogle,
  loginByApple,
  forgotPasswordEmail,
  forgotPasswordMobile,
  verifyEmailOTP,
  verifyMobileOTP,
  resendEmailOTP,
  resendMobileOTP,
  changePassword,
  resetPassword,
  verifyToken,
  loginOrRegisterByMobile,
  setPassword,
  guestLogin
};
