require("dotenv").config();
const transporter = require("./config/nodemailer");

transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: process.env.EMAIL_USER,
  subject: "Test email",
  text: "Hello world",
})
  .then(() => console.log("OK"))
  .catch(err => console.log(err));
