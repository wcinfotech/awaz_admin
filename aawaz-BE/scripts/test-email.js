import emailServices from "../services/email.services.js";
import config from "../config/config.js";

async function main() {
  try {
    const to = process.env.TEST_TO || config.nodemailer?.auth?.user || config.email?.from;

    console.log("Using SMTP host:", config.nodemailer?.host);
    console.log("Sending test email to:", to);

    const result = await emailServices.sendApprovalEmail({ email: to });
    console.log("Result:", result);
  } catch (err) {
    console.error("Test email failed:", err?.message || err);
  }
}

main();
