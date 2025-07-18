import axios from 'axios';
import Session from '../models/Session.js';
import User from '../models/User.js';

export const createSession = async (req, res) => {
  try {
    const { userId, condition, doctor } = req.body;

    if (!userId || !condition || !doctor) {
      return res.status(400).json({ message: 'userId, condition, and doctor are required.' });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Construct the prompt
    const prompt = `
You are Dr. ${doctor.toUpperCase()} – an AI medical assistant with a unique tone:
- Amara: Reassuring big sister
- David: Calm and factual
- Zara: Tech-savvy and casual
- Tunde: Herbal-to-modern health expert

The user is ${user.age} years old, ${user.gender}, and described their issue as:
"${condition}"

Based on this, suggest 2 to 3 follow-up health questions you would ask **in character**. 
Be brief, practical, and kind. Only return the questions in a numbered list.
`;

    let followUps = [];

    try {
      // Call the provided AI proxy endpoint
      const aiResponse = await axios.post(
        'https://promptus-u64u.onrender.com/v1/chat/completions',
        {
          role: 'user', // based on their API spec
          prompt: prompt,
          model: 'gpt-3.5-turbo',
          temperature: 0.7
        }
      );

      // 🔎 Inspect the response to confirm structure
      // console.log(aiResponse.data);

      // If their API mimics OpenAI:
      let rawText;
      if (aiResponse.data?.choices) {
        rawText = aiResponse.data.choices[0].message.content;
      } else {
        // If they just return plain text
        rawText = typeof aiResponse.data === 'string' ? aiResponse.data : JSON.stringify(aiResponse.data);
      }

      followUps = rawText
        .split('\n')
        .filter(q => q.trim() !== '')
        .map(q => q.replace(/^\d+\. /, '').trim());

    } catch (err) {
      console.error('AI Proxy failed, using fallback questions:', err.message);

      const fallback = {
        amara: [
          'When did the symptoms start?',
          'Have you eaten well recently?',
          'Have you been sleeping enough?'
        ],
        david: [
          'Have these symptoms occurred before?',
          'Do you have any known medical conditions?',
          'Is there any pain or discomfort?'
        ],
        zara: [
          'Got it! How long has this been going on?',
          'Have you taken any medication?',
          'Can you describe the pain level from 1 to 10?'
        ],
        tunde: [
          'Did you try any herbs or home remedies?',
          'Have you seen these symptoms in others around you?',
          'What’s your current energy level?'
        ]
      };

      followUps = fallback[doctor.toLowerCase()] || [];
    }

    // Create the session
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
    console.error('Error creating session:', error);
    res.status(500).json({ message: 'Error creating session.', error });
  }
};






export const respondToSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const { answers } = req.body;

    const session = await Session.findById(sessionId).populate('user');
    if (!session) return res.status(404).json({ message: 'Session not found.' });

    session.answers = answers;

    const { name, age, gender } = session.user;
    const doctor = session.doctor;

    const prompt = `
You are Dr. ${doctor.toUpperCase()}, an AI medical assistant. Respond like your persona:
- Amara: Reassuring big sister
- David: Calm and factual
- Zara: Friendly and tech-savvy
- Tunde: Knows both herbal myths and modern truths

The user is ${name}, a ${age}-year-old ${gender}. They described their condition as:
"${session.condition}"

They answered these follow-up questions:
${JSON.stringify(answers)}

Give a short, 2-3 line diagnosis summary in character — helpful, simple, and human-like.
`;

    let diagnosis;

    try {
      const aiResponse = await axios.post(
        'https://promptus-u64u.onrender.com/v1/chat/completions',
        {
          role: 'user',
          prompt: prompt,
          model: 'gpt-3.5-turbo',
          temperature: 0.7
        }
      );

      // Parse response depending on API structure
      if (aiResponse.data?.choices) {
        diagnosis = aiResponse.data.choices[0].message.content.trim();
      } else if (typeof aiResponse.data === 'string') {
        diagnosis = aiResponse.data;
      } else {
        diagnosis = JSON.stringify(aiResponse.data);
      }
    } catch (err) {
      console.error('AI Proxy failed, using fallback diagnosis:', err.message);
      // Fallback diagnosis logic
      const condition = session.condition.toLowerCase();
      if (condition.includes('fever') && condition.includes('cough')) {
        diagnosis = 'It seems like you might have the flu or malaria. Please get tested soon.';
      } else if (condition.includes('pain')) {
        diagnosis = 'Your pain might be due to inflammation or infection. Monitor and seek help if it worsens.';
      } else {
        diagnosis = 'Your symptoms suggest a mild illness. Rest, hydrate, and monitor your condition.';
      }
    }

    session.diagnosis = diagnosis;
    await session.save();

    res.status(200).json({ diagnosis });
  } catch (error) {
    console.error('Error responding to session:', error);
    res.status(500).json({ message: 'Error responding to session.', error });
  }
};

