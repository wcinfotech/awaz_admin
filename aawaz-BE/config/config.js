import Joi from "joi";
import dotenv from "dotenv";
import enums from "./enum.js";
import { parseJoiError } from "../helper/apiResponse.js";

const nodeEnv = process.env.NODE_ENV;

// Load base env first, then optionally override with .env.dev in development
dotenv.config({ path: ".env" });
if (nodeEnv === enums.nodeEnvEnums.DEVELOPMENT) {
  dotenv.config({ path: ".env.dev", override: true });
}

console.log(nodeEnv === enums.nodeEnvEnums.DEVELOPMENT ? ".env.dev" : ".env");

const envVarsSchema = Joi.object({
  PORT: Joi.number().description("port number"),
  MONGODB_URL: Joi.string().trim().description("Mongodb url"),
  CLIENT_URL: Joi.string().trim().description("Client url"),
  BASE_URL: Joi.string().trim().description("Base URL"),
  FRONTEND_URL: Joi.string().trim().optional().description("Frontend URL"),
  SERVER_URL: Joi.string().trim().description("Server url"),
  JWT_SECRET_KEY: Joi.string().description("Jwt secret key"),

  SMTP_HOST: Joi.string().description("server that will send the emails"),
  SMTP_PORT: Joi.number().description("port to connect to the email server"),
  SMTP_USERNAME: Joi.string().description("username for email server"),
  SMTP_PASSWORD: Joi.string().description("password for email server"),
  EMAIL_FROM: Joi.string().description("the from field in the emails sent by the app"),
  SMTP_DISABLED: Joi.string().optional().description("flag to skip SMTP"),

  GOOGLE_CLIENT_ID: Joi.string().description("google client id"),
  GOOGLE_CLIENT_SECRET: Joi.string().description("google client secret"),
  GOOGLE_REDIRECT_URL: Joi.string().description("google redirect url"),

  DIGITAL_OCEAN_DIRNAME: Joi.string().description("digitalOcean folder name"),
  DIGITAL_OCEAN_SPACES_ACCESS_KEY: Joi.string().description("digital ocean spaces access key"),
  DIGITAL_OCEAN_SPACES_SECRET_KEY: Joi.string().description("digital ocean spaces secret key"),
  DIGITAL_OCEAN_SPACES_REGION: Joi.string().description("digital ocean spaces region"),
  DIGITAL_OCEAN_SPACES_BASE_URL: Joi.string().description("digital ocean spaces base url"),
  DIGITAL_OCEAN_BUCKET_NAME: Joi.string().description("digital ocean spaces bucket name"),
  DIGITAL_OCEAN_ENDPOINT: Joi.string().description("digital ocean spaces endpoint"),

  TWILIO_ACCOUNT_SID: Joi.string().description("twilio account sid"),
  TWILIO_AUTH_TOKEN: Joi.string().description("twilio auth token"),
  TWILIO_FROM_NUMBER: Joi.string().description("twilio from number"),

  FIREBASE_TYPE: Joi.string().description("firebase type"),
  FIREBASE_PROJECT_ID: Joi.string().description("firebase project id"),
  FIREBASE_PRIVATE_KEY_ID: Joi.string().description("firebase private key id"),
  FIREBASE_PRIVATE_KEY: Joi.string().description("firebase private key"),
  FIREBASE_CLIENT_EMAIL: Joi.string().description("firebase client email"),
  FIREBASE_CLIENT_ID: Joi.string().description("firebase client id"),
  FIREBASE_AUTH_URI: Joi.string().description("firebase auth uri"),
  FIREBASE_TOKEN_URI: Joi.string().description("firebase token uri"),
  FIREBASE_AUTH_PROVIDER_X509_CERT_URL: Joi.string().description("firebase auth provider x509 cert url"),
  FIREBASE_CLIENT_X509_CERT_URL: Joi.string().description("firebase client x509 cert url"),
})
  .unknown()
  .prefs({ errors: { label: "key" } });

const { value: envVars, error } = envVarsSchema.validate(process.env, {
  abortEarly: false,
});

if (error) {
  const parsedError = parseJoiError(error);
  console.log("Config Error: ", parsedError);
}

export default {
  port: envVars.PORT,
  nodeEnv: nodeEnv,
  mongodb: {
    url: envVars.MONGODB_URL,
    options: {
      serverSelectionTimeoutMS: 5000,
    },
  },
  base_url: envVars.BASE_URL,
  frontendUrl: envVars.FRONTEND_URL,
  server_url: envVars.SERVER_URL,
  client_url: envVars.CLIENT_URL,
  jwt: {
    secretKey: envVars.JWT_SECRET_KEY,
    expiresIn: envVars.JWT_TOKEN_EXPIRES_IN,
  },
  otpExpiryDurationSeconds: envVars.OTP_EXPIRY_DURATION_SECONDS,
  google: {
    clientId: envVars.GOOGLE_CLIENT_ID,
    clientSecret: envVars.GOOGLE_CLIENT_SECRET,
    redirectUrl: envVars.GOOGLE_REDIRECT_URL,
  },
  cloud: {
    digitalocean: {
      rootDirname: envVars.DIGITAL_OCEAN_DIRNAME,
      region: envVars.DIGITAL_OCEAN_SPACES_REGION,
      baseUrl: envVars.DIGITAL_OCEAN_SPACES_BASE_URL,
      bucketName: envVars.DIGITAL_OCEAN_BUCKET_NAME,
      endpoint: envVars.DIGITAL_OCEAN_ENDPOINT,
      credentials: {
        accessKeyId: envVars.DIGITAL_OCEAN_SPACES_ACCESS_KEY,
        secretAccessKey: envVars.DIGITAL_OCEAN_SPACES_SECRET_KEY,
      },
    },
  },
  nodemailer: {
    host: envVars.SMTP_HOST,
    port: envVars.SMTP_PORT,
    auth: {
      user: envVars.SMTP_USERNAME,
      pass: envVars.SMTP_PASSWORD,
    },
    supportEmail: envVars.SUPPORT_EMAIL,
    supportPassword: envVars.SUPPORT_PASSWORD,
  },
  email: {
    from: envVars.EMAIL_FROM, 
  },
  twilio: {
    accountSid: envVars.TWILIO_ACCOUNT_SID,
    authToken: envVars.TWILIO_AUTH_TOKEN,
    fromNumber: envVars.TWILIO_FROM_NUMBER,
  },
  mediaFolderEnum: {
    EVENT_POST: envVars.EVENT_POST,
    PROFILE_PICTURE: envVars.PROFILE_PICTURE,
    EVENT_TYPE: envVars.EVENT_TYPE,
    EVENT_REACTION: envVars.EVENT_REACTION,
    RESCUE_UPDATE: envVars.RESCUE_UPDATE,
    DRAFT_POST: envVars.DRAFT_POST,
    DRAFT_ADMIN_POST: envVars.DRAFT_ADMIN_POST,
    SUPPORT_REQUEST: envVars.SUPPORT_REQUEST,
    TEST_FOLDER: "test_folder"
  },
  firebase: {
    type: envVars.FIREBASE_TYPE,
    projectId: envVars.FIREBASE_PROJECT_ID,
    privateKeyId: envVars.FIREBASE_PRIVATE_KEY_ID,
    privateKey: envVars.FIREBASE_PRIVATE_KEY,
    clientEmail: envVars.FIREBASE_CLIENT_EMAIL,
    clientId: envVars.FIREBASE_CLIENT_ID,
    authUri: envVars.FIREBASE_AUTH_URI,
    tokenUri: envVars.FIREBASE_TOKEN_URI,
    authProviderX509CertUrl: envVars.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    clientX509CertUrl: envVars.FIREBASE_CLIENT_X509_CERT_URL,
  },
  oneSignal: {
    appId: envVars.ONE_SIGNAL_APP_ID,
    androidChannelId: envVars.ONE_SIGNAL_ANDROID_CHANNEL_ID,
    apiKey: envVars.ONE_SIGNAL_API_KEY,
  }
};
