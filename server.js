const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.log("Database connection error:", err));

// User Schema and Model
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true }
});
const User = mongoose.model('User', userSchema);

// Mess Menu
const messMenu = [
    {
        day: 'Monday',
        meals: {
            breakfast: 'chole bhature, tomato rice, tea/coffee/milk',
            lunch: 'chapati, mix veg, rice, black masur, sambhar curd',
            snacks: 'mixer',
            dinner: 'soya chunks, kheer',
        },
    },
    {
        day: 'Tuesday',
        meals: {
            breakfast: 'aloo paratha, tea/coffee/milk',
            lunch: 'chapati, aloo matar, rice, sambhar, curd',
            snacks: 'dal wada',
            dinner: 'rajma, lemon rice',
        },
    },
    // Add the remaining days...
];

// Endpoint to Subscribe Users
app.post('/menu', async (req, res) => {
    const { email } = req.body;
    try {
        const user = new User({ email });
        await user.save();
        res.status(200).send('Email subscribed successfully!');
    } catch (error) {
        if (error.code === 11000) {
            res.status(400).send('Email already subscribed!');
        } else {
            res.status(400).send('Error subscribing email.');
        }
    }
});

// Nodemailer Configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
    },
});

// Function to Send Email
const sendEmail = async () => {
    const currentDay = new Date().toLocaleString('en-US', { weekday: 'long' });
    const menu = messMenu.find(m => m.day === currentDay);

    const users = await User.find();
    users.forEach(user => {
        const mailOptions = {
            from: process.env.EMAIL,
            to: user.email,
            subject: `Today's Mess Menu - ${currentDay}`,
            text: `Hello! Here's the menu for today:\n\nBreakfast: ${menu.meals.breakfast}\nLunch: ${menu.meals.lunch}\nSnacks: ${menu.meals.snacks}\nDinner: ${menu.meals.dinner}\n\nEnjoy your meals!`,
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) console.log(err);
            else console.log(`Email sent to ${user.email}: ${info.response}`);
        });
    });
};

// Schedule Tasks to Send Emails
cron.schedule('30 7 * * *', sendEmail); // 7:30 AM
cron.schedule('0 12 * * *', sendEmail); // 12:00 PM
cron.schedule('30 16 * * *', sendEmail); // 4:30 PM
cron.schedule('30 19 * * *', sendEmail); // 7:30 PM

// Start Server
app.listen(3000, () => console.log('Server running on port 3000'));
