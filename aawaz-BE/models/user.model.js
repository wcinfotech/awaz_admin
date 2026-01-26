import mongoose from "mongoose";
import enums from "../config/enum.js";

const schema = new mongoose.Schema(
  {
    email: {
      type: String,
      default: null,
    },
    name: {
      type: String,
      default: null,
    },
    username: {
      type: String,
      default: null,
    },
    mobileNumber: {
      type: String,
      default: null,
    },
    password: {
      type: String,
      default: null,
    },
    providerId: {
      type: String,
      default: null,
    },
    deviceId: {
      type: String,
      default: null,
    },
    provider: {
      type: String,
      enum: Object.values(enums.authProviderEnum),
      required: true,
    },
    otp: {
      type: Number,
      default: null,
    },
    otpExpiresAt: {
      type: Date,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: Object.values(enums.userRoleEnum),
      default: enums.userRoleEnum.USER,
    },
    country: {
      type: String,
      default: null,
    },
    state: {
      type: String,
      default: null,
    },
    savedEventPosts: {
      type: Array,
      default: [],
    },
    eventPostNotificationOnIds: { 
      type: Array,
      default: []
    },
    otherUserBlockIds: { 
      type: Array,
      default: []
    },
    dateOfBirth: {
      type: String,
      default: null,
    },
    city: {
      type: String,
      default: null,
    },
    profilePicture: {
      type: String,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    latitude: {
      type: Number,
      default: null,
    },
    notifications: [
      {
        eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
        sentTime: { type: Date, default: Date.now },
        distance: { type: Number, default: 0 },
      },
    ],
    isBlocked: {
      type: Boolean,
      default: false,
    },
    fcmTokens: [{
        token: {
            type: String,
            required: true
        },
        deviceId: {
            type: String,
            required: true
        },
        platform: {
            type: String,
            enum: ['android', 'ios', 'web'],
            default: 'android'
        },
        isActive: {
            type: Boolean,
            default: true
        },
        lastUsedAt: {
            type: Date,
            default: Date.now
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    additionMobileNumber: {
      type: String,
      default: null,
    },
    radius : {
      type: Number,
      default: 12
    },
    notificationPreferences: {
      dangerousTools: { type: Boolean, default: true },
      trafficMishaps: { type: Boolean, default: true },
      firearmIncidents: { type: Boolean, default: true },
      physicalAltercations: { type: Boolean, default: true },
      minorFires: { type: Boolean, default: true },
      majorBlazes: { type: Boolean, default: true },
      lostPersons: { type: Boolean, default: true },
      lostPets: { type: Boolean, default: true },
      communityHealth: { type: Boolean, default: true },
      severeWeatherDisasters: { type: Boolean, default: true },
      localOffenderWatch: { type: Boolean, default: true },
      transportUpdates: { type: Boolean, default: true },
      promotionalAlerts: { type: Boolean, default: false },
      police: { type: Boolean, default: true },
      rally: { type: Boolean, default: true },
      massRunning: { type: Boolean, default: true },
      goons: { type: Boolean, default: true },
      unknownEvent: { type: Boolean, default: true },
      generalPost: { type: Boolean, default: true},
      others: { type: Boolean, default: true },
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const UserModel = mongoose.model("User", schema);
export default UserModel;
