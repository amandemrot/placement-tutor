const nodemailer = require("nodemailer");

// demo accounts never receive email — OTP is returned in the response instead
const DEMO_EMAILS = ["student@demo.com", "mentor@test.com", "admin@pttutor.com"];

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const isDemo = (email) => {
  const e = (email || "").trim().toLowerCase();
  return DEMO_EMAILS.includes(e) || e.endsWith("@placementtutor.demo") || e.endsWith("@test.com");
};

const sendOtpMail = async (email, otp) => {
  await transporter.sendMail({
    from: `"PlacementTutor" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `${otp} is your PlacementTutor login code`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h2 style="margin:0 0 8px">PlacementTutor</h2>
        <p style="color:#555;margin:0 0 24px">Here is your one-time login code.</p>
        <div style="font-size:32px;letter-spacing:8px;font-weight:700;background:#f4f4f8;padding:16px;text-align:center;border-radius:8px">${otp}</div>
        <p style="color:#777;font-size:13px;margin-top:24px">This code expires in 10 minutes. If you didn't request it, you can ignore this email.</p>
      </div>`,
  });
};

const wrap = (title, body) => `
  <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
    <h2 style="margin:0 0 4px">PlacementTutor</h2>
    <p style="color:#777;margin:0 0 24px;font-size:13px">${title}</p>
    ${body}
  </div>`;

const row = (k, v) =>
  `<tr><td style="padding:6px 0;color:#777;font-size:14px">${k}</td><td style="padding:6px 0;color:#111;font-size:14px;font-weight:600;text-align:right">${v}</td></tr>`;

// to the student
const sendBookingConfirmation = async ({ to, studentName, mentorName, company, date, time, duration, amount, meetingLink }) => {
  await transporter.sendMail({
    from: `"PlacementTutor" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Session confirmed with ${mentorName} — ${date}`,
    html: wrap("Your session is confirmed", `
      <p style="font-size:15px;color:#333">Hi ${studentName}, your 1:1 session is booked.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;border-top:1px solid #eee;border-bottom:1px solid #eee">
        ${row("Mentor", `${mentorName}${company ? ` · ${company}` : ""}`)}
        ${row("Date", date)}
        ${row("Time", time)}
        ${row("Duration", `${duration} min`)}
        ${row("Amount paid", `₹${amount}`)}
      </table>
      <a href="${meetingLink}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600">Join the session</a>
      <p style="color:#777;font-size:13px;margin-top:20px">The same link is available under My Bookings. You can cancel up to 10 minutes before the session starts.</p>
    `),
  });
};

// to the mentor
const sendMentorNotification = async ({ to, mentorName, studentName, date, time, duration, amount, meetingLink }) => {
  await transporter.sendMail({
    from: `"PlacementTutor" <${process.env.EMAIL_USER}>`,
    to,
    subject: `New session booked — ${date}`,
    html: wrap("You have a new booking", `
      <p style="font-size:15px;color:#333">Hi ${mentorName}, ${studentName} has booked a session with you.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;border-top:1px solid #eee;border-bottom:1px solid #eee">
        ${row("Student", studentName)}
        ${row("Date", date)}
        ${row("Time", time)}
        ${row("Duration", `${duration} min`)}
        ${row("You earn", `₹${amount}`)}
      </table>
      <a href="${meetingLink}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600">Join the session</a>
    `),
  });
};

module.exports = { sendOtpMail, sendBookingConfirmation, sendMentorNotification, isDemo };