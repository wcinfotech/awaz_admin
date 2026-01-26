import { StatusCodes } from "http-status-codes";
import { apiResponse } from "../helper/apiResponse.js";
import User from "../models/user.model.js";
import helper from "../helper/common.js";
import enums from "../config/enum.js";  
import config from "../config/config.js";
import EventPost from "../models/event-post.model.js";
import AdminEventPost from "../admin-panel/models/admin-event-post.model.js";
import userService from "../services/user.services.js";
// import { sendEventPostNotificationToUser } from "../firebase/sendNotification.js";

const formatUserProfileResponse = async (user, eventPosts, verifiedEventPosts, adminEventPostModel, helper, eventList) => {

  const verifiedEventPostIds = eventList.filter(eventPost => eventPost.status === enums.eventPostStatusEnum.APPROVED).map(eventPost => eventPost.adminCreatedPostId);

  // Exclude deleted posts by checking 'deleted.isDeleted: false'
  const adminVerifiedEventPosts = await adminEventPostModel.find({ 
    _id: { $in: verifiedEventPostIds }, 
    "deleted.isDeleted": false // Exclude deleted posts
  });

  const adminEventPostMap = new Map(adminVerifiedEventPosts.map(post => [post._id.toString(), post.viewCounts || 0]));
  const totalApprovedEventViews = adminVerifiedEventPosts.reduce((total, post) => total + (post.viewCounts || 0), 0);

  const formattedEventPosts = eventPosts.filter(eventPost => {
    // Only include event posts with a non-deleted adminCreatedPostId
    if (eventPost.adminCreatedPostId) {
      const adminPost = adminEventPostMap.get(eventPost.adminCreatedPostId.toString());
      return adminPost !== undefined;  // If the admin post is found (i.e., not deleted)
    }
    return true;  // Include posts that do not have an adminCreatedPostId (e.g., user-generated)
  }).map(eventPost => {
    const eventPostViewCounts = eventPost.status === enums.eventPostStatusEnum.APPROVED
      ? helper.formatNumber(adminEventPostMap.get(eventPost.adminCreatedPostId?.toString()) || 0)
      : "0";

    const attachmentFileType = helper.getFileType(eventPost.attachment || eventPost.thumbnail);
      
    return {
      _id: eventPost._id,
      eventPostViewCounts,
      attachment: eventPost.attachment,
      status: eventPost.status,
      thumbnail: eventPost.thumbnail,
      postType: eventPost.postType,
      fileType: attachmentFileType,
      adminCreatedPostId: eventPost.adminCreatedPostId,
      createdAt: eventPost.createdAt,  // Add createdAt for sorting later
    };
  });

  // Sort the event posts by createdAt in descending order to show latest posts first
  const sortedFormattedEventPosts = formattedEventPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Exclude deleted posts while fetching saved posts
  const savedEventPosts = await adminEventPostModel.find({ 
    _id: { $in: user.savedEventPosts },
    "deleted.isDeleted": false // Exclude deleted posts
  });

  const formattedSavedEventPosts = (savedEventPosts || []).map(eventPost => {
    const eventDefaultAttachment = (eventPost.attachments || []).find(
      event => event.type === enums.eventPostTimelineTypeEnum.DEFAULT
    );

    return {
      _id: eventPost._id,
      eventPostViewCounts: helper.formatNumber(eventPost?.viewCounts) || "0",
      attachment: eventDefaultAttachment?.attachment,
      adminCreatedPostId: eventPost?._id,
      thumbnail: eventDefaultAttachment?.thumbnail ? eventDefaultAttachment?.thumbnail : null, 
    };
  });

  const verifiedTotalEventPosts = sortedFormattedEventPosts.filter(post => post.status === enums.eventPostStatusEnum.APPROVED)

  return {
    _id: user?._id,
    name: user?.name,
    username: user?.username,
    profilePicture: user?.profilePicture,
    dateOfBirth: user?.dateOfBirth,
    email: user?.email,
    mobileNumber: user?.mobileNumber,
    allBroadcastCounts: helper.formatNumber(eventPosts?.length || "0"),
    totalApprovedEventViews: helper.formatNumber(totalApprovedEventViews || "0"),
    verifiedEventCounts: helper.formatNumber(verifiedTotalEventPosts?.length || "0"),
    allBroadcasts: sortedFormattedEventPosts,  // Return sorted event posts
    verifiedEventPosts: verifiedTotalEventPosts,
    saveEventPost: formattedSavedEventPosts,
    userRadius: user.radius || 12,
  };
};



const getUserProfile = async (req, res) => {
  const userId = req.user.id;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return apiResponse({res,status: false,message: "User not found.",statusCode: StatusCodes.NOT_FOUND});
    }
    const eventPosts = await EventPost.find({ userId: userId });
    const users = await formatUserProfileResponse(user, eventPosts, eventPosts, AdminEventPost, helper, eventPosts);
    return apiResponse({ res, status: true, message: "User profile fetched successfully.", statusCode: StatusCodes.OK, data: users });
  } catch (error) {
    console.log(error);
    
    return apiResponse({ res, status: false, message: "Failed to fetch user profile.", statusCode: StatusCodes.INTERNAL_SERVER_ERROR });
  }
};

const updateUserProfile = async (req, res) => {
  const userId = req.user.id;
  const { name, dateOfBirth, attachment, username } = req.body;
  const profilePicture = req.file;
  const user = await User.findById(userId);

  if (!user) {
    return apiResponse({
      res,
      status: false,
      message: "User not found.",
      statusCode: StatusCodes.NOT_FOUND,
    });
  }

  try {
    let profilePictureUrl = null;
    if (attachment === undefined && profilePicture === undefined) {
      profilePictureUrl = null;
    } else if (attachment !== undefined && profilePicture === undefined) {
      profilePictureUrl = attachment;
    } else if (attachment === undefined && profilePicture !== undefined) {
      const now = new Date();
      const eventTimeFileId = helper.formatDateToString(now);
      if(user?.profilePicture){
        await helper.deleteMediaFromS3Bucket(user?.profilePicture)
      }
      profilePictureUrl = await helper.uploadMediaInS3Bucket(profilePicture, config.mediaFolderEnum.PROFILE_PICTURE, eventTimeFileId);
    }

    user.profilePicture = profilePictureUrl;
    if (name !== undefined) user.name = name;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (username !== undefined) user.username = username;

    await user.save();

    const eventPosts = await EventPost.find({ userId: userId });
    // const filteredEventPosts = eventPosts.map(eventPost => ({
    //   _id: eventPost._id,
    //   attachment: eventPost.attachment,
    //   status: eventPost.status,
    //   thumbnail: eventPost?.thumbnail,
    // }));

    // const verifiedEventPosts = filteredEventPosts.filter(eventPost => eventPost.status === enums.eventPostStatusEnum.APPROVED);

    // const users = await formatUserProfileResponse(user, filteredEventPosts, verifiedEventPosts, AdminEventPost, helper, eventPosts);

    const users = await formatUserProfileResponse(user, eventPosts, eventPosts, AdminEventPost, helper, eventPosts);


    return apiResponse({
      res,
      status: true,
      message: "User profile updated successfully.",
      statusCode: StatusCodes.OK,
      data: users,
    });
  } catch (error) {
    return apiResponse({
      res,
      status: false,
      message: "Failed to update user profile.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (degree) => (degree * Math.PI) / 180;
  const R = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const updateUserLocation = async (req, res) => {
  const userId = req.user.id;
  const { latitude, longitude } = req.body;

  try {
    const user = await User.findById({ _id: userId });
    // const events = await AdminEventPost.find({});

    if (!user) {
      return apiResponse({
        res,
        status: false,
        message: "User not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    user.latitude = latitude;
    user.longitude = longitude;
    // const userRadius = user.radius || 12;

    // const nearbyEvents = events.filter((event) => {
    //   const distance = haversineDistance(
    //     latitude,
    //     longitude,
    //     event.latitude,
    //     event.longitude
    //   );
    //   return distance <= userRadius;
    // });

    // const eventIds = user.notifications?.map((event) => event.eventId.toString());

    // (nearbyEvents || []).forEach((event) => {
    //   if (!eventIds.includes(event._id.toString())) {
    //     const distanceUserToEvent = haversineDistance(latitude, longitude, event.latitude, event.longitude);
    //     sendEventPostNotificationToUser([user.pushToken], event);
    //     user.notifications.push({ eventId: event._id, sentTime: new Date(), distance: parseFloat(distanceUserToEvent.toFixed(2))});
    //   }
    // });

    await user.save();

    return apiResponse({
      res,
      status: true,
      message: "User location updated successfully.",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    return apiResponse({
      res,
      status: false,
      message: "Failed to update user location.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const updateUserPushToken = async (req, res) => {
  const userId = req.user.id;
  const { pushToken } = req.body;
  try {
    const user = await User.findById({ _id: userId });

    if (!user) {
      return apiResponse({
        res,
        status: false,
        message: "User not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    user.pushToken = pushToken;
    await user.save();
    return apiResponse({
      res,
      status: true,
      message: "User push token updated successfully.",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    return apiResponse({
      res,
      status: false,
      message: "Failed to update user push token.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const getOtherUserProfile = async(req, res) =>{
  const { otherUserId } = req.params;
  const userId = req.user._id;
  try {
    const loggedInUser = await User.findById(userId);

    if (!loggedInUser) {
      return apiResponse({
        res,
        status: false,
        message: "Logged-in user not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    if (loggedInUser.otherUserBlockIds.includes(otherUserId)) {
      return apiResponse({
        res,
        status: true,
        message: "You have blocked this user. You cannot view their profile.",
        statusCode: StatusCodes.OK,
      });
    }

    const user = await User.findById({ _id: otherUserId });
    if (!user) {
      return apiResponse({
        res,
        status: false,
        message: "User not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    const eventPosts = await EventPost.find({ userId: otherUserId });

    const filteredEventPosts = (eventPosts || []).map(eventPost => {
      return {
        _id: eventPost._id,
        attachment: eventPost.attachment,
        status: eventPost.status,
        thumbnail: eventPost?.thumbnail,
      }
    });

    const verifiedEventPosts = (filteredEventPosts || []).filter(eventPost => eventPost.status === enums.eventPostStatusEnum.APPROVED)
    const users = {
      _id: user?._id,
      name: user?.name,
      profilePicture: user?.profilePicture,
      username: user?.username,
      isBlocked: user?.isBlocked,
      allBroadcastCounts: helper.formatNumber(filteredEventPosts?.length ? filteredEventPosts?.length : 0),
      totalApprovedEventViews: helper.formatNumber(0),
      verifiedEventCounts: helper.formatNumber(verifiedEventPosts?.length ? verifiedEventPosts?.length : 0),
      allBroadcasts: filteredEventPosts,
      verifiedEventPosts: verifiedEventPosts,
    };

    return apiResponse({
      res,
      status: true,
      message: "User profile fetched successfully.",
      statusCode: StatusCodes.OK,
      data: users,
    });

  } catch (error){
    console.log("errrrrorrrr", error)
    return apiResponse({
      res,
      status: false,
      message: "Failed to get user profile.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
}

const updateUserRadius = async (req, res) => {
  const userId = req.user._id;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return apiResponse({
        res,
        status: false,
        message: "User not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    // Update radius if provided
    if (req.body.radius !== undefined) {
      user.radius = req.body.radius;
    }

    // Update notification preferences if provided
    if (req.body.notificationPreferences) {
      Object.keys(req.body.notificationPreferences).forEach((key) => {
        if (user.notificationPreferences.hasOwnProperty(key)) {
          user.notificationPreferences[key] = req.body.notificationPreferences[key];
        }
      });
    }

    await user.save();

    return apiResponse({
      res,
      status: true,
      message: "User settings updated successfully.",
      statusCode: StatusCodes.OK,
      data: { 
        radius: user.radius,
        notificationPreferences: user.notificationPreferences
      }
    });
  } catch (error) {
    console.error("Error updating user settings:", error);
    return apiResponse({
      res,
      status: false,
      message: "Failed to update user settings.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById({ _id: userId });
    if (!user) {
      return apiResponse({
        res,
        status: false,
        message: "User not found",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    user.isDeleted = true
    await user.save();

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

const blockUnblobkUserToOtherUser = async (req, res) => {
  const { blockUserId } = req.body;
  const userId = req.user.id;

  try {
    if (userId === blockUserId) {
      return apiResponse({
        res,
        status: false,
        message: "You cannot block yourself.",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const user = await User.findById({ _id: userId });
    const otherUserDetails = await User.findById({ _id: blockUserId });

    if (!otherUserDetails) {
      return apiResponse({
        res,
        status: false,
        message: "blockUserId not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    const hasUser = user.otherUserBlockIds.includes(blockUserId);

    if (!hasUser) {
      user.otherUserBlockIds.push(blockUserId);
      await user.save();
    } else {
      user.otherUserBlockIds = user.otherUserBlockIds.filter((id) => id !== blockUserId);
      await user.save();
    }

    return apiResponse({
      res,
      status: true,
      data: {
        isBlockUser: hasUser ? false : true
      },
      message: hasUser ? "User unblock successfully." : "User block successfully.",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    console.log("error", error)
    return apiResponse({
      res,
      status: false,
      message: "Failed to block/unblock user.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const getBlockedUsers = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return apiResponse({
        res,
        status: false,
        message: "User not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    if (user.otherUserBlockIds.length === 0) {
      return apiResponse({
        res,
        status: true,
        data: [],
        message: "No blocked users found.",
        statusCode: StatusCodes.OK,
      });
    }

    const blockedUsers = await User.find({ _id: { $in: user.otherUserBlockIds } }).select("_id name email profilePicture");

    return apiResponse({
      res,
      status: true,
      data: blockedUsers,
      message: "Blocked users fetched successfully.",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    return apiResponse({
      res,
      status: false,
      message: "Failed to fetch blocked users.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const countUserInRadius = async (req, res) =>{
  const { latitude, longitude, distance } = req.body;
  try {
    const users = await User.find({
      latitude: { $ne: null },
      longitude: { $ne: null },
    });
  
    const filteredUsers = users.filter((user) => {
      if (!user.latitude || !user.longitude) return false;
      const userDistance = helper.calculateGeodesicDistance(latitude, longitude, user.latitude, user.longitude);
      return userDistance <= distance;
    });

    return apiResponse({
      res,
      status: true,
      data: {
        count: filteredUsers?.length
      },
      message: "User in radius counts fetched successfully.",
      statusCode: StatusCodes.OK,
    });

  } catch {
    return apiResponse({
      res,
      status: false,
      message: "Failed to fetch user in radius counts.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
}

const checkUsernameAvailability = async (req, res) => {
  try {
    const { username } = req.body;

    // Allow only a-z, A-Z, 0-9, and dot (.)
    const usernameRegex = /^[a-zA-Z0-9.]+$/;

    if (!usernameRegex.test(username)) {
      return apiResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        status: false,
        message: "Username can only contain letters, numbers, and '.' (dot)",
      });
    }

    const user = await userService.findOne({ username });

    if (user) {
      return apiResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        status: false,
        message: "Username is already taken",
      });
    }

    return apiResponse({
      res,
      statusCode: StatusCodes.OK,
      status: true,
      message: "Username is available",
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


const searchUsersByUsername = async (req, res) => {
  const { search } = req.query;

  if (!search) {
    return apiResponse({
      res,
      status: false,
      message: "search query parameter is required.",
      statusCode: StatusCodes.BAD_REQUEST,
    });
  }

  try {
    const users = await User.find({
      username: { $regex: search, $options: "i" },
      isDeleted: false,
    }).select("username name email profilePicture");

    return apiResponse({
      res,
      status: true,
      message: "Users fetched successfully.",
      statusCode: StatusCodes.OK,
      data: users,
    });
  } catch (error) {
    console.error(error);
    return apiResponse({
      res,
      status: false,
      message: "Error while searching users.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const updateGuestUserProfile = async (req,res) => {
  try {
    const data = req.body;
    const user = await userService.findByIdAndUpdate(req.user.id,{$set: data},{new: true});
    if (!user) {
      return apiResponse({
        res,
        status: false,
        statusCode: StatusCodes.NOT_FOUND,
        message: "User not found."
      })
    };

    return apiResponse({
      res,
      status: true,
      statusCode: StatusCodes.OK,
      data: user,
      message: "Profile updated successfully."
    })
  } catch (error) {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      data: null,
      message: "Internal server error."
    })
  }
}

export default {  
  getUserProfile,
  updateUserProfile,
  updateUserLocation,
  updateUserPushToken,
  getOtherUserProfile,
  updateUserRadius,
  deleteAccount,
  blockUnblobkUserToOtherUser,
  getBlockedUsers,
  countUserInRadius,
  checkUsernameAvailability,
  searchUsersByUsername,
  updateGuestUserProfile
};
