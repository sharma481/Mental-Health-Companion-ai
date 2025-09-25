require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const { analyzeSentiment } = require('./sentiment');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

mongoose.connect(process.env.MONGO_URI);

const UserSchema = new mongoose.Schema({
  name: String,
  mood: String,
  stressLevel: Number,
  advice: String,
  history: Array
});
const User = mongoose.model('User', UserSchema);

app.post('/api/sentiment', async (req, res) => {
  const { message } = req.body;
  const sentiment = await analyzeSentiment(message);
  res.json(sentiment);
});

app.post('/api/advice', async (req, res) => {
  const { mood, stressLevel } = req.body;
  try {
    // Gemini API call
    const geminiRes = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + process.env.GEMINI_API_KEY,
      {
        contents: [
          {
            role: "user",
            parts: [
              { text: `My mood is ${mood}, stress level ${stressLevel}. Give me personalized daily mental health advice as a life coach.` }
            ]
          }
        ]
      }
    );
    const content = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, advice unavailable.";
    res.json({ advice: content });
  } catch (err) {
    res.status(500).json({ error: "Gemini API error" });
  }
});

app.post('/api/user', async (req, res) => {
  const { name, mood, stressLevel, advice } = req.body;
  let user = await User.findOne({ name });
  if (!user) {
    user = new User({ name, mood, stressLevel, advice, history: [] });
  }
  user.mood = mood;
  user.stressLevel = stressLevel;
  user.advice = advice;
  user.history.push({ mood, stressLevel, advice, time: new Date() });
  await user.save();
  res.json(user);
});

app.get('/api/emergency', (req, res) => {
  res.json({
    helplines: [
      { name: 'India Mental Health Helpline', phone: '9152987821' },
      { name: 'Suicide Prevention', phone: '9152987821' },
      { name: 'National Mental Health', phone: '9152987821' }
    ]
  });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});