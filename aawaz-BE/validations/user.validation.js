import Joi from "joi";

const updateUserLocation = Joi.object().keys({
  latitude: Joi.number().required().messages({
    "any.required": "Latitude is required",
    "number.empty": "Latitude cannot be empty",
    "number.base": "Latitude must be a number",
    
  }),
  longitude: Joi.number().required().messages({
    "any.required": "Longitude is required",
    "number.empty": "Longitude cannot be empty",
    "number.base": "Longitude must be a number",
  })
});

const pushtokenUpdateValidation = Joi.object().keys({
  pushToken: Joi.string().required().messages({
    "any.required": "pushToken is required",
    "string.empty": "pushToken cannot be empty",
    "string.base": "pushToken must be a string",
  })
});

const userRadiusValidation = Joi.object().keys({
  radius: Joi.number().min(0).max(12).required().messages({
    "any.required": "radius is required",
    "number.base": "radius must be a number",
    "number.min": "radius cannot be less than 0",
    "number.max": "radius cannot be greater than 12"
  })
});

const userIdIdValidation = Joi.object({
  blockUserId: Joi.string().required().messages({
    "any.required": "block user id is required",
    "string.empty": "block user id cannot be empty",
    "string.base": "block user id must be a string",
  }),
});

const countUserInRadiusValidation = Joi.object({
  latitude: Joi.number().required().messages({
    "any.required": "Latitude is required",
    "number.empty": "Latitude cannot be empty",
    "number.base": "Latitude must be a number",
  }),
  longitude: Joi.number().required().messages({
    "any.required": "Longitude is required",
    "number.empty": "Longitude cannot be empty",
    "number.base": "Longitude must be a number",
  }),
  distance: Joi.number().required().messages({
    "any.required": "distance is required",
    "number.empty": "distance cannot be empty",
    "number.base": "distance must be a number",
  }),
});

const checkUsernameAvailability = Joi.object().keys({
  username: Joi.string().required().messages({
    "any.required": "Username is required",
    "string.empty": "Username cannot be empty",
    "string.base": "Username must be a string",
  }),
});


export default {
  updateUserLocation,
  pushtokenUpdateValidation,
  userRadiusValidation,
  userIdIdValidation,
  countUserInRadiusValidation,
  checkUsernameAvailability
};
