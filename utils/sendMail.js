const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.MAIL_USER, // your email
    pass: process.env.MAIL_PASS  // app password
  }
});

// const sendMail = ({ to, subject, text }) => {
//   return transporter.sendMail({
//     from: process.env.MAIL_USER,
//     to,
//     subject,
//     text
//   });
// };

const sendMail = async ({ to, subject, text, html }) => {
  const { EMAIL_USER, EMAIL_PASS } = process.env;

  if (!EMAIL_USER || !EMAIL_PASS) {
    console.error('Email credentials are missing in environment variables.');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Signavox Internal System" <${EMAIL_USER}>`,
    to,
    subject,
    text,
    html, // optional: in case you want to send HTML version
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Mail sent: ${info.response}`);
  } catch (error) {
    console.error('Error sending mail:', error.message);
    // Optionally: log this to a DB or monitoring system
  }
};

module.exports = sendMail;
