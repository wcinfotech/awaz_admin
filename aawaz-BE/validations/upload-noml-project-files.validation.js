import Joi from "joi";

const uploadFileValidation = Joi.object().keys({
    uploadFileType: Joi.string().valid("UserProfile", "Category", "Poke").required().messages({
        "any.required": "uploadFileType is required",
        "string.empty": "uploadFileType cannot be empty",
        "any.only": `uploadFileType must be one of UserProfile, Category, Poke`,
    }),
});

export default {
    uploadFileValidation,
};
