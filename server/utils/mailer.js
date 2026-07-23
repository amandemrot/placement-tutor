const DEMO_EMAILS = ["student@demo.com", "mentor@test.com", "admin@pttutor.com"];

const FROM = { name: "PlacementTutor", email: "amandemrot123@gmail.com" };

const isDemo = (email) => {
  const e = (email || "").trim().toLowerCase();
  return DEMO_EMAILS.includes(e) || e.endsWith("@placementtutor.demo") || e.endsWith("@test.com");
};

const send = async ({ to, subject, html }) => {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: FROM,
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error("Brevo error: " + err);
  }
};

const wrap = (title, body) => `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#0f1117;border-radius:12px;padding:32px;color:#e5e7eb;">
    <h2 style="color:#818cf8;margin-top:0;">PlacementTutor</h2>
    <h3 style="color:#fff;">${title}</h3>
    ${body}
    <p style="color:#6b7280;font-size:12px;margin-top:28px;">If you didn't request this, you can safely ignore this email.</p>
  </div>`;

const row = (k, v) =>
  `<tr><td style="padding:6px 12px;color:#9ca3af;">${k}</td><td style="padding:6px 12px;color:#fff;font-weight:bold;">${v}</td></tr>`;

const sendOtpMail = (email, otp) =>
  send({
    to: email,
    subject: `${otp} is your PlacementTutor verification code`,
    html: wrap(
      "Your verification code",
      `<p>Use this code to sign in. It expires in <b>10 minutes</b>.</p>
       <div style="font-size:34px;letter-spacing:10px;font-weight:bold;color:#818cf8;background:#1a1d27;border-radius:10px;padding:18px;text-align:center;margin:20px 0;">${otp}</div>`
    ),
  });

const sendBookingConfirmation = ({ to, studentName, mentorName, company, date, time, duration, amount, meetingLink }) =>
  send({
    to,
    subject: "Booking confirmed — PlacementTutor",
    html: wrap(
      "Your session is booked! 🎉",
      `<p>Hi ${studentName}, your mentorship session is confirmed.</p>
       <table style="width:100%;background:#1a1d27;border-radius:10px;margin:16px 0;">
         ${row("Mentor", `${mentorName}${company ? " (" + company + ")" : ""}`)}
         ${row("Date", date)}
         ${row("Time", time)}
         ${row("Duration", duration + " min")}
         ${row("Amount", "₹" + amount)}
       </table>
       ${meetingLink ? `<a href="${meetingLink}" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Join Meeting</a>` : ""}`
    ),
  });

const sendMentorNotification = ({ to, mentorName, studentName, date, time, duration, amount, meetingLink }) =>
  send({
    to,
    subject: "New booking received — PlacementTutor",
    html: wrap(
      "You have a new booking! 📅",
      `<p>Hi ${mentorName}, ${studentName} booked a session with you.</p>
       <table style="width:100%;background:#1a1d27;border-radius:10px;margin:16px 0;">
         ${row("Student", studentName)}
         ${row("Date", date)}
         ${row("Time", time)}
         ${row("Duration", duration + " min")}
         ${row("Earning", "₹" + amount)}
       </table>
       ${meetingLink ? `<a href="${meetingLink}" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Join Meeting</a>` : ""}`
    ),
  });

module.exports = { sendOtpMail, sendBookingConfirmation, sendMentorNotification, isDemo };