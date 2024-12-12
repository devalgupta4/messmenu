const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const cors = require('cors'); // Import CORS

const cron = require('node-cron');
require('dotenv').config();
console.log(process.env.MONGO_URI);

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Allow Cross-Origin Requests
app.use(cors()); // Enable CORS globally
app.use(express.static('frontend'));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.log("Database connection error:", err));

// User Schema and Model
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true }
});
const User = mongoose.model('User', userSchema);

// Mess Menu
const menus = [
    {
      day: 'Monday',
      meals: {
        breakfast: 'chole bhature,tomato rice, tea/coffee/milk',
        lunch: 'chapati, mix veg, rice, black masur, sambhar curd',
        snacks: 'mixer',
        dinner: 'soya chunks ,kheer',
      },
    },
    {
      day: 'tuesday',
      meals: {
        breakfast: 'aloo paratha, tea/coffee/milk',
        lunch: 'chapati, aloo matur, rice, sambhar, curd',
        snacks: 'dal wada',
        dinner: 'rahjma, lemon rice',
      },
    },
    {
      day: 'wednesday',
      meals: {
        breakfast: 'masala dosa, rice, tea/coffee/milk',
        lunch: 'chapati, beetroot, rice, dal,black chana, sambhar, curd',
        snacks: 'aloo wada',
        dinner: 'paneer ,chicken,',
      },
    },
    {
      day: 'thrusday',
      meals: {
        breakfast: 'idli, wada,upma , tea/coffee/milk',
        lunch: 'chapati, mix veg,tendy gravy, rice, dal, sambhar curd',
        snacks: 'veg puff',
        dinner: 'red lobe,jeera rice',
      },
    },
    {
      day: 'friday',
      meals: {
        breakfast: 'pav bhaji,khichdi, tea/coffee/milk',
        lunch: 'chapati, aloo bhindi, rice, dal, sambhar curd',
        snacks: 'kachori',
        dinner: 'paneer,egg curry',
      },
    },
    {
      day: 'saturday',
      meals: {
        breakfast: 'set dosa,poha, tea/coffee/milk',
        lunch: 'chapati, puri,chana masala, rice, dal, sambhar curd',
        snacks: 'cake',
        dinner: 'noodles, gobi machurian,tomato rice',
      },
    },
    {
      day: 'sunday',
      meals: {
        breakfast: 'bread jam,cuttlet,omlette, tea/coffee/milk',
        lunch: 'chicken,mushroom kebab,khuska rice',
        snacks: 'nothing',
        dinner: 'aloo gobhi,rice,sambhar',
      },
    },
    // Add menus for other days...
  ];

// Endpoint to Subscribe Users
app.post('/subscribe', async (req, res) => {
    const { email } = req.body; 
    try {
        const user = new User({ email }); 
        await user.save(); 
        res.status(200).send('Email subscribed successfully!');
    } catch (error) {
        if (error.code === 11000) { 
            res.status(200).send('Email already subscribed!');
        } else {
            res.status(500).send('Error subscribing email.');
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
