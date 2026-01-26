import { StatusCodes } from "http-status-codes";
import { apiResponse } from "../helper/apiResponse.js";
import helper from "../helper/common.js";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import fs from "fs";
import os from "os";
import path from "path";
import axios from "axios";

ffmpeg.setFfmpegPath(ffmpegPath);

const updateWaterMark = async (req, res) => {
  const { url } = req.body;
  const file = req.file;
  const watermarkUrl = "https://guardianshot.blr1.cdn.digitaloceanspaces.com/eagleEye/watermark-videos/ic_water_mark_awaaz.webp";

  const tempInputPath = path.join(os.tmpdir(), `input_${Date.now()}.mp4`);
  const tempOutputPath = path.join(os.tmpdir(), `output_${Date.now()}.mp4`);
  const tempLogoPath = path.join(os.tmpdir(), `logo_${Date.now()}.webp`);

  const fontPath =
    process.platform === "win32"
      ? "C:/Windows/Fonts/arial.ttf"
      : "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"; // ✅ most common on Linux

  try {
    // Step 1: Download input video
    if (url) {
      const response = await axios({ url, responseType: "stream" });
      const writer = fs.createWriteStream(tempInputPath);
      response.data.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });
    } else if (file) {
      fs.writeFileSync(tempInputPath, file.buffer);
    } else {
      return apiResponse({
        res,
        status: false,
        message: "Either video URL or file is required.",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    // Step 2: Download watermark image
    const logoResponse = await axios({ url: watermarkUrl, responseType: "stream" });
    const logoWriter = fs.createWriteStream(tempLogoPath);
    logoResponse.data.pipe(logoWriter);
    await new Promise((resolve, reject) => {
      logoWriter.on("finish", resolve);
      logoWriter.on("error", reject);
    });

    // ✅ Extra check before running FFmpeg
    if (!fs.existsSync(tempInputPath) || !fs.existsSync(tempLogoPath)) {
      return apiResponse({
        res,
        status: false,
        message: "Input video or watermark logo not found.",
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }

    // Step 3: Watermark with FFmpeg
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(tempInputPath)
        .input(tempLogoPath)
        .complexFilter([
          {
            filter: "scale",
            options: { w: 200, h: 200 },
            inputs: "[1:v]",
            outputs: "logo_resized",
          },
          {
            filter: "overlay",
            options: { x: "W-w-20", y: "H-h-20" },
            inputs: ["[0:v]", "logo_resized"],
            outputs: "with_logo",
          },
          {
            filter: "drawtext",
            options: {
              fontfile: fontPath,
              text: "© MyWatermark",
              fontcolor: "white",
              fontsize: 20,
              x: 20,
              y: 20,
              shadowcolor: "black",
              shadowx: 1,
              shadowy: 1,
            },
            inputs: "with_logo",
            outputs: "final",
          },
        ])
        .map("final")
        .videoCodec("libx264")
        .audioCodec("aac")
        .outputOptions(["-preset ultrafast", "-crf 28", "-movflags +faststart"])
        .on("end", resolve)
        .on("error", (err) => {
          console.error("FFmpeg error:", err);
          reject(err);
        })
        .save(tempOutputPath);
    });

    // Step 4: Upload to DigitalOcean Spaces
    const outputBuffer = fs.readFileSync(tempOutputPath);
    const uploadedUrl = await helper.uploadMediaInS3Bucket(
      {
        originalname: `watermarked_${Date.now()}.mp4`,
        mimetype: "video/mp4",
        buffer: outputBuffer,
      },
      "watermark-videos"
    );

    // Cleanup
    fs.unlinkSync(tempInputPath);
    fs.unlinkSync(tempOutputPath);
    fs.unlinkSync(tempLogoPath);

    return apiResponse({
      res,
      status: true,
      message: "Watermark added successfully.",
      statusCode: StatusCodes.CREATED,
      data: { videoUrl: uploadedUrl },
    });
  } catch (error) {
    console.error("Error while watermarking:", error);
    return apiResponse({
      res,
      status: false,
      message: "Failed to process video.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

export default {
  updateWaterMark,
};
