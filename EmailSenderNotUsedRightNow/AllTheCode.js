//Use Nodemailer to Send Email
const nodemailer = require('nodemailer');

// Set up a transporter for sending emails (using Gmail SMTP for example)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-email-password'
  }
});

// Function to send verification email
async function sendVerificationEmail(userEmail, verificationToken) {
  const EmployeeverificationCode = generateVerificationToken();
  const AdminverificationCode = generateVerificationToken();

  const mailOptions = {
    from: 'your-email@gmail.com',
    to: userEmail,
    subject: 'Email Verification',
    text: `If you want employee do this ${EmployeeverificationCode} and if you want admin do this ${AdminverificationCode}`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Verification email sent!');
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

// Add To user Schema a Token Generator: 
const crypto = require('crypto');

// Function to generate a unique token for email verification
function generateVerificationToken() {
  return crypto.randomBytes(20).toString('hex');  // Generates a random string of 40 characters
}

//Show the path where email will be verified
const express = require('express');
const app = express();
const User = require('./models/User'); // Your user model
const jwt = require('jsonwebtoken');  // For token validation, if using JWT

// Route for handling email verification
app.get('/verify-email', async (req, res) => {
  const { token } = req.query; // Get the token from the URL

  try {
    // Find the user with the matching token (assuming you store the token in the DB)
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ message: 'Invalid verification token' });
    }

    // Update the user's 'verified' field to true
    user.verified = true;
    user.verificationToken = null; // Optionally remove the token after successful verification

    await user.save();

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error verifying email' });
  }
});

//For registring through Verification 
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
  
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
  
    const verificationToken = generateVerificationToken();
  
    // Create a new user and save them with the verification token
    const newUser = new User({
      name,
      email,
      password,
      verificationToken
    });
  
    await newUser.save();
  
    // Send the verification email
    sendVerificationEmail(email, verificationToken);
  
    res.status(201).json({ message: 'Registration successful. Please check your email to verify your account.' });
  });
  

//https://chatgpt.com/share/673b0baa-eea0-8005-8610-20f29f89171e