// 🔹 Email Reminder Logic (added without touching your code above)
import nodemailer from "nodemailer";
import cron from "node-cron";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const sendReminderEmail = async (emails, meeting, whenText) => {
  const mailOptions = {
    from: `"Group Discussion Scheduler" <${process.env.GMAIL_USER}>`,
    to: emails.join(","),
    subject: `Reminder: ${meeting.roomName}`,
    html: `
      <h3>Group Discussion Reminder</h3>
      <p><b>Room:</b> ${meeting.roomName}</p>
      <p><b>Code:</b> ${meeting.roomCode}</p>
      <p><b>Scheduled At:</b> ${meeting.scheduledAt}</p>
      <p><b>This is your reminder ${whenText} before the meeting.</b></p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Reminder (${whenText}) sent to: ${emails}`);
  } catch (err) {
    console.error("Error sending reminder:", err);
  }
};

export const scheduleRemindersForMeeting = async (roomId) => {
  try {
    const meeting = await Room.findById(roomId).populate("participants", "email");
    if (!meeting) return console.error("Meeting not found for reminders");

    const emails = meeting.participants.map((p) => p.email);
    if (emails.length === 0) return console.log("No participants to notify");

    const meetingTime = new Date(meeting.scheduledAt);

    // 1 hour before
    let reminder1 = new Date(meetingTime);
    reminder1.setHours(reminder1.getHours() - 1);

    // 5 minutes before
    let reminder2 = new Date(meetingTime);
    reminder2.setMinutes(reminder2.getMinutes() - 5);

    const toCron = (date) =>
      `${date.getMinutes()} ${date.getHours()} ${date.getDate()} ${
        date.getMonth() + 1
      } *`;

    cron.schedule(toCron(reminder1), () => {
      sendReminderEmail(emails, meeting, "1 hour");
    });

    cron.schedule(toCron(reminder2), () => {
      sendReminderEmail(emails, meeting, "5 minutes");
    });

    console.log(`⏰ Reminders scheduled for meeting ${meeting.roomName}`);
  } catch (err) {
    console.error("Error scheduling reminders:", err);
  }
};
