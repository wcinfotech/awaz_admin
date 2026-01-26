import config from "../config/config.js";
import jwt from "jsonwebtoken";
import moment from "moment";
import {
  PutObjectCommand,
  ListBucketsCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { s3Client } from "../config/aws.config.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";

/**
 * Pagination details
 */
export const paginationDetails = ({ page = 1, totalItems, limit }) => {
  const totalPages = Math.ceil(totalItems / limit);

  return { page: Number(page), totalPages, totalItems, limit };
};

/**
 * Pagination function
 */
export const paginationFun = (data) => {
  const { page = 1, limit = 10 } = data;

  return {
    limit: Number(limit),
    skip: (Number(page) - 1) * Number(limit),
  };
};

const generateToken = async (payload, expiresIn = "365d") => {
  return jwt.sign(payload, config.jwt.secretKey, {
    expiresIn: expiresIn,
  });
};

const verifyToken = async (token) => {
  return jwt.verify(token, config.jwt.secretKey);
};

const generateOTP = () => {
  // Generate a random number between 1000 and 9999
  const otp = Math.floor(1000 + Math.random() * 9000);

  const otpExpiryDurationSeconds = 180;
  const otpExpiresAt = moment()
    .add(otpExpiryDurationSeconds, "seconds")
    .toDate();

  return { otp, otpExpiresAt };
};

const extractFileKey = (url) => {
  const parts = url.split("/");
  const fileKey = parts.slice(3).join("/");
  return fileKey;
};

const checkBucketExists = async (bucketName) => {
  try {
    const data = await s3Client.send(new ListBucketsCommand({}));
    const bucketExists = data.Buckets.some(
      (bucket) => bucket.Name === bucketName
    );
    if (!bucketExists) {
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
};

const uploadMediaInS3Bucket = async (file, folderName, userId) => {
  const bucketName = process.env.DIGITAL_OCEAN_BUCKET_NAME;
  const timestamp = Date.now();
  const fileExtension = file?.originalname.split(".").pop();
  let key;
  if (userId) {
    key = `${process.env.DIGITAL_OCEAN_DIRNAME}/${folderName}/${userId}.${fileExtension}`;
  } else {
    key = `${process.env.DIGITAL_OCEAN_DIRNAME}/${folderName}/${timestamp}.${fileExtension}`;
  }

  try {
    const bucketExists = await checkBucketExists(bucketName);
    if (!bucketExists) return;

    // Get content type from file mimetype
    const contentType = file?.mimetype;

    const params = {
      Bucket: bucketName,
      Key: key,
      Body: file?.buffer,
      ContentType: contentType,
      ACL: "public-read",
    };

    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    const fileUrl = `${process.env.DIGITAL_OCEAN_SPACES_BASE_URL}/${key}`;
    console.log(`File uploaded successfully at ${fileUrl}`);
    return fileUrl;
  } catch (err) {
    if (err.Code === "NoSuchBucket") {
      console.error(
        `Bucket "${bucketName}" does not exist. Please create the bucket or check the bucket name.`
      );
    } else {
      console.error("Error:", err);
    }
  }
};

const deleteMediaFromS3Bucket = async (fileUrl) => {
  const fileKey = extractFileKey(fileUrl);
  const bucketName = process.env.DIGITAL_OCEAN_BUCKET_NAME;

  try {
    const deleteParams = {
      Bucket: bucketName,
      Key: fileKey,
    };

    await s3Client.send(new DeleteObjectCommand(deleteParams));
    console.log(`File with key ${fileKey} deleted successfully.`);
  } catch (err) {
    console.error(`Failed to delete file with key ${fileKey}:`, err);
  }
};

const formatDateToString = (date) => {
  return `${date.getFullYear()}${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}${date.getDate().toString().padStart(2, "0")}${date
    .getHours()
    .toString()
    .padStart(2, "0")}${date.getMinutes().toString().padStart(2, "0")}${date
    .getSeconds()
    .toString()
    .padStart(2, "0")}`;
};

const getUserDetailsById = async (userId) => {
  const user = await User.findById(userId);
  return {
    name: user.name,
    profileImage: user.profilePicture,
  };
};

const transformComments = async (comments, currentUserId) => {
  return Promise.all(
    comments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map(async (comment) => {
      const userDetails = await getUserDetailsById(comment.userId);
      const isLiked = comment.likes.includes(currentUserId);
      const totalLikes = formatNumber(comment.likes.length);
      const totalReplies = formatNumber(comment.replies.length);

      const transformedReplies = await Promise.all(
        comment.replies.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map(async (reply) => {
          const replyUserDetails = await getUserDetailsById(reply.userId);
          return {
            userId: reply.userId,
            name: replyUserDetails.name,
            profileImage: replyUserDetails.profileImage,
            comment: reply.comment,
            timestamp: reply.timestamp,
            totalLikes: formatNumber(reply.likes.length),
            isLiked: reply.likes.includes(currentUserId),
            isDeleted: reply.isDeleted,
            _id: reply._id,
          };
        })
      );

      return {
        userId: comment.userId,
        name: userDetails.name,
        profileImage: userDetails.profileImage,
        comment: comment.comment,
        timestamp: comment.timestamp,
        totalLikes: totalLikes,
        isLiked: isLiked,
        isDeleted: comment.isDeleted,
        totalReplies: totalReplies,
        replies: transformedReplies,
        _id: comment._id,
      };
    })
  );
};

const formatNumber = (num) => {
  if (num < 1000) {
    return num.toString();
  } else if (num >= 1000 && num < 1000000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  } else if (num >= 1000000 && num < 1000000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  } else {
    return (num / 1000000000).toFixed(1).replace(/\.0$/, "") + "B";
  }
};

const convertUtcToLocal = (utcTimestamp) => {
  const utcTime = moment.utc(utcTimestamp);
  if (!utcTime.isValid()) {
    throw new Error("Invalid UTC timestamp format.");
  }
  const localTime = utcTime.local();

  return localTime.format("DD-MM-YYYY HH:mm:ss");
};

const getEventsInsidePolygon = (polygonCoords, events) => {
  const corner1 = polygonCoords[0];
  const corner2 = polygonCoords[1];
  const corner3 = polygonCoords[2];
  const corner4 = polygonCoords[2];

  // Define the bounding box
  const latMin = Math.min(corner1[0], corner2[0], corner3[0], corner4[0]);
  const latMax = Math.max(corner1[0], corner2[0], corner3[0], corner4[0]);
  const lonMin = Math.min(corner1[1], corner2[1], corner3[1], corner4[1]);
  const lonMax = Math.max(corner1[1], corner2[1], corner3[1], corner4[1]);

  const filteredData = events.filter((item) => {
    const lat = parseFloat(item.latitude);
    const lon = parseFloat(item.longitude);

    return lat >= latMin && lat <= latMax && lon >= lonMin && lon <= lonMax;
  });

  return filteredData;
};

const calculateGeodesicDistance = (lat1, lon1, lat2, lon2) => {
  const earthRadius = 6371;
  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  const lat1Rad = toRadians(lat1);
  const lon1Rad = toRadians(lon1);
  const lat2Rad = toRadians(lat2);
  const lon2Rad = toRadians(lon2);

  const deltaLat = lat2Rad - lat1Rad;
  const deltaLon = lon2Rad - lon1Rad;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = earthRadius * c;

  return distance;
};

const validateObjectIds = (ids) => {
  for (const [key, value] of Object.entries(ids)) {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return { isValid: false, message: `Invalid ${key}` };
    }
  }
  return { isValid: true };
};

const validateEntitiesExistence = async (entities) => {
  const results = await Promise.all(
    entities.map(async ({ model, id, name }) => {
      const entity = await model.findById(id);
      return entity ? null : `${name} with ID ${id} not found`;
    })
  );
  return results.filter((result) => result !== null);
};

const toBoolean = (value) => {
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return value;
};

const getFileType = (fileName) => {
  if(!fileName) return 'Unknown'

  const fileExtension = fileName?.split('.').pop().toLowerCase(); 

  // File types
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', "webp"];
    const videoTypes = ['mp4', 'avi', 'mkv', 'webm', 'mov', 'flv'];
    const pdfTypes = ['pdf'];
    const textTypes = ['txt'];

  // Check for image types
  if (imageTypes.includes(fileExtension)) {
    return 'Image';
  }
  
  // Check for video types
  if (videoTypes.includes(fileExtension)) {
    return 'Video';
  }

  // Check for PDF
  if (pdfTypes.includes(fileExtension)) {
    return 'PDF';
  }

  // Check for Text File
  if (textTypes.includes(fileExtension)) {
    return 'Text File';
  }

  return 'Unknown';
}

const uploadNomlFileMediaInS3Bucket = async (file, folderName, userId) => {
  const bucketName = process.env.DIGITAL_OCEAN_BUCKET_NAME;
  const timestamp = Date.now();
  const fileExtension = file?.originalname.split(".").pop();
  let key;
  if (userId) {
    key = `Noml/${folderName}/${userId}.${fileExtension}`;
  } else {
    key = `Noml/${folderName}/${timestamp}.${fileExtension}`;
  }

  try {
    const bucketExists = await checkBucketExists(bucketName);
    if (!bucketExists) return;

    // Get content type from file mimetype
    const contentType = file?.mimetype;

    const params = {
      Bucket: bucketName,
      Key: key,
      Body: file?.buffer,
      ContentType: contentType,
      ACL: "public-read",
    };

    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    const fileUrl = `${process.env.DIGITAL_OCEAN_SPACES_BASE_URL}/${key}`;
    console.log(`Noml file uploaded successfully at ${fileUrl}`);
    return fileUrl;
  } catch (err) {
    if (err.Code === "NoSuchBucket") {
      console.error(
        `Bucket "${bucketName}" does not exist. Please create the bucket or check the bucket name.`
      );
    } else {
      console.error("Error:", err);
    }
  }
};

export default {
  generateOTP,
  verifyToken,
  generateToken,
  paginationDetails,
  paginationFun,
  extractFileKey,
  uploadMediaInS3Bucket,
  deleteMediaFromS3Bucket,
  formatDateToString,
  transformComments,
  formatNumber,
  convertUtcToLocal,
  getEventsInsidePolygon,
  calculateGeodesicDistance,
  validateObjectIds,
  validateEntitiesExistence,
  toBoolean,
  getFileType,
  uploadNomlFileMediaInS3Bucket
};
