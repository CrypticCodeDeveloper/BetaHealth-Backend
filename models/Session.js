import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  condition: { type: String, required: false }, // What user describes
  doctor: { type: String, enum: ['amara', 'david', 'zara', 'tunde'], required: true },
  symptoms: [String], // Optional: future expansion
  followUps: [String], // Questions AI asks after hearing the condition
  answers: Object,     // User responses to follow-ups
  diagnosis: String,   // Final result
  createdAt: {
    type: Date,
    default: Date.now
  }
});


export default mongoose.model('Session', sessionSchema);
