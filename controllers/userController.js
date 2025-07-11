import User from '../models/User.js';

export const createUser = async (req, res) => {
  try {
    const { name, age, gender } = req.body;

    if (!name || !age || !gender) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const newUser = await User.create({ name, age, gender });
    res.status(201).json({ userId: newUser._id });
  } catch (error) {
    res.status(500).json({ message: 'Server error creating user.', error });
  }
};


export const getUserSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ user: req.params.id }).sort({ createdAt: -1 });
    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving sessions.', error });
  }
};