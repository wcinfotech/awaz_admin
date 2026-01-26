import mongoose from "mongoose";

const JsonSchema = new mongoose.Schema(
    {
        appName: { type: String, required: true, index: true },
        jsonName: { type: String, required: true },
        jsonData: { type: Object, required: true },
    },
    { timestamps: true }
);
JsonSchema.index({ appName: 1, jsonName: 1 }, { unique: true }); // Ensures unique JSON per app

// export default mongoose.model("Json", JsonSchema);

const JsonModel = mongoose.model('JsonModel', JsonSchema);
  
export default JsonModel;



// const supportRequestSchema = new mongoose.Schema({
//     email: {
//       type: String,
//       required: true,
//     },
//     subject: {
//       type: String,
//       required: true,
//     },
//     description: {
//       type: String,
//       required: true,
//     },
//     status: {
//       type: String,
//       enum: [enums.statusEnum.OPEN, enums.statusEnum.CLOSE],
//       default: enums.statusEnum.OPEN,
//     },
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//       required: true,
//     },
//   }, { timestamps: true });
  
//   const SupportRequest = mongoose.model('SupportRequest', supportRequestSchema);
  
//   export default SupportRequest;