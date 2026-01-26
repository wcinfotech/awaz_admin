import config from "../../config/config.js";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";

const sendEmail = async ({
  from = config.email.from,
  to,
  subject,
  templateVariables,
  filename,
}) => {
  // Input validations
  if (!to) {
    throw new Error("Recipient email address(es) (to) is required");
  }

  if (!subject) {
    throw new Error("Email subject is required");
  }

  if (!filename) {
    throw new Error("Template filename is required");
  }

  if (!templateVariables || typeof templateVariables !== "object") {
    throw new Error("Template variables must be an object");
  }

  try {
    // Validate template file exists
    const templatePath = path.join(process.cwd(), "html-templates", filename);
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Email template file not found: ${filename}`);
    }

    // Read html template with validation
    let html;
    try {
      html = fs.readFileSync(templatePath, "utf-8");
    } catch (readError) {
      throw new Error(`Failed to read email template: ${readError.message}`);
    }

    // Validate template variables replacement
    try {
      Object.keys(templateVariables).forEach((key) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
        html = html.replace(regex, templateVariables[key]);

        if (html.includes(`{{${key}}}`)) {
          console.warn(`Template variable {{${key}}} was not replaced`);
        }
      });
    } catch (replaceError) {
      throw new Error(
        `Failed to replace template variables: ${replaceError.message}`
      );
    }

    // Validate transporter configuration
    if (
      !config.nodemailer ||
      !config.nodemailer.host ||
      !config.nodemailer.port ||
      !config.nodemailer.auth ||
      !config.nodemailer.auth.user ||
      !config.nodemailer.auth.pass
    ) {
      throw new Error("Incomplete nodemailer configuration");
    }

    // Create transporter with validation
    let mailTransport;
    try {
      mailTransport = nodemailer.createTransport({
        name: config.nodemailer.name,
        host: config.nodemailer.host,
        port: config.nodemailer.port,
        secure: false,
        auth: {
          user: config.nodemailer.auth.user,
          pass: config.nodemailer.auth.pass,
        },
      });

      // Verify transporter connection
      try {
        await mailTransport.verify();
      } catch (verifyError) {
        throw new Error(
          `Failed to verify mail transporter: ${verifyError.message}`
        );
      }
    } catch (transportError) {
      throw new Error(
        `Failed to create mail transporter: ${transportError.message}`
      );
    }

    try {
      const result = await new Promise((resolve, reject) => {
        mailTransport.sendMail(
          {
            from: from,
            to: Array.isArray(to) ? to.join(", ") : to,
            subject,
            html,
          },
          (error, info) => {
            if (error) {
              reject(error);
            } else {
              console.log(
                `Email successfully sent to ${info.accepted.join(", ")}`
              );
              resolve(info);
            }
          }
        );
      });

      return result;
    } catch (sendError) {
      throw new Error(`Failed to send email: ${sendError.message}`);
    }
  } catch (error) {
    console.error("Email sending failed:", error.message);
    throw error;
  }
};

const sendOTPEmail = async ({ email, otp, otpExpiresAt }) => {
  try {
    const emailResult = await sendEmail({
      to: email,
      subject: "OTP verification",
      templateVariables: {
        otp: otp,
        otpExpiresAt: new Date(otpExpiresAt).toLocaleString(),
      },
      filename: "verifyOTP.html",
    });

    if (emailResult?.rejected?.length > 0) {
      return {
        success: false,
        data: null,
        message: "Failed to send OTP email.",
      };
    }

    return {
      success: true,
      data: null,
      message: `OTP sent to your email address. Please check.`,
    };
  } catch (error) {
    console.error("Error in sendOTPEmail:", error);
    return {
      success: false,
      data: null,
      message: error.message,
    };
  }
};

export default {
  sendOTPEmail,
};
