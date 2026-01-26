import Joi from "joi";

const createEventType = Joi.object().keys({
  eventName: Joi.string().required().messages({
    "any.required": "Event Name is required",
    "string.empty": "Event Name cannot be empty",
    "string.base": "Event Name must be a string",
  }),
  notificationCategotyName: Joi.string().required().messages({
    "any.required": "Notification Category Name is required",
    "string.empty": "Notification Category Name cannot be empty",
    "string.base": "Notification Category Name must be a string",
  }),
});

const updateEventType = Joi.object().keys({
  eventName: Joi.string().optional().messages({
    "string.empty": "Event Name cannot be empty",
    "string.base": "Event Name must be a string",
  }),
  notificationCategotyName: Joi.string().optional().messages({
    "string.empty": "Notification Category Name cannot be empty",
    "string.base": "Notification Category Name must be a string",
  }),
});

export default {
  createEventType,
  updateEventType,
};