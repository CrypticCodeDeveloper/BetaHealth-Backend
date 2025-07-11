import Session from '../models/Session.js';
import User from '../models/User.js';

// import { OpenAI } from 'openai';

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY
// });


// Mock doctor responses for simplicity
const doctorResponses = {
  amara: [
    "When did the symptoms start?",
    "Have you eaten well recently?",
    "Have you been sleeping enough?"
  ],
  david: [
    "Have these symptoms occurred before?",
    "Do you have any known medical conditions?",
    "Is there any pain or discomfort?"
  ],
  zara: [
    "Got it! How long has this been going on?",
    "Have you taken any medication?",
    "Can you describe the pain level from 1 to 10?"
  ],
  tunde: [
    "Did you try any herbs or home remedies?",
    "Have you seen these symptoms in others around you?",
    "What’s your current energy level?"
  ]
};

export const createSession = async (req, res) => {
  try {
    const { userId, condition, doctor } = req.body;

    if (!userId || !condition || !doctor) {
      return res.status(400).json({ message: 'userId, condition, and doctor are required.' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const followUps = doctorResponses[doctor] || [];

    const session = await Session.create({
      user: userId,
      condition,
      doctor,
      followUps
    });

    res.status(201).json({
      sessionId: session._id,
      followUpQuestions: followUps
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating session.', error });
  }
};

export const respondToSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const { answers } = req.body;

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found.' });

    session.answers = answers;

    // Optionally simulate a basic diagnosis
    const condition = session.condition.toLowerCase();
    let diagnosis = 'Common illness. Drink water and rest.';

    if (condition.includes('fever') && condition.includes('cough')) {
      diagnosis = 'Possible flu or malaria. Seek medical testing.';
    } else if (condition.includes('pain')) {
      diagnosis = 'Pain could be infection or inflammation. Monitor closely.';
    }

    session.diagnosis = diagnosis;

    await session.save();

    res.status(200).json({ diagnosis });
  } catch (error) {
    res.status(500).json({ message: 'Error responding to session.', error });
  }
};


// export const respondToSession = async (req, res) => {
//   try {
//     const sessionId = req.params.id;
//     const { answers } = req.body;

//     const session = await Session.findById(sessionId).populate('user');
//     if (!session) return res.status(404).json({ message: 'Session not found.' });

//     session.answers = answers;

//     const { name, age, gender } = session.user;
//     const doctor = session.doctor;

//     const prompt = `
// You are Dr. ${doctor.toUpperCase()}, an AI medical assistant. Respond like your persona:
// - Amara: Reassuring big sister
// - David: Calm and factual
// - Zara: Friendly and tech-savvy
// - Tunde: Knows both herbal myths and modern truths

// The user is ${name}, a ${age}-year-old ${gender}. They described their condition as:
// "${session.condition}"

// They answered these follow-up questions:
// ${JSON.stringify(answers)}

// Give a short, 2-3 line diagnosis summary in character — helpful, simple, and human-like.
// `;

//     const completion = await openai.chat.completions.create({
//       model: 'gpt-3.5-turbo',
//       messages: [{ role: 'user', content: prompt }],
//       temperature: 0.7
//     });

//     const diagnosis = completion.choices[0].message.content.trim();
//     session.diagnosis = diagnosis;
//     await session.save();

//     res.status(200).json({ diagnosis });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Error using AI for diagnosis.', error });
//   }
// };
