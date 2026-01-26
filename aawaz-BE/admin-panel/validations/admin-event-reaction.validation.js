import Joi from "joi";

const createEventReaction = Joi.object().keys({
  reactionName: Joi.string().required().messages({
    "any.required": "Reaction Name is required",
    "string.empty": "Reaction Name cannot be empty",
    "string.base": "Reaction Name must be a string",
  }),
});

const updateEventReaction = Joi.object().keys({
  reactionName: Joi.string().optional().messages({
    "string.empty": "Reaction Name cannot be empty",
    "string.base": "Reaction Name must be a string",
  }),
});

export default {
  createEventReaction,
  updateEventReaction,
};