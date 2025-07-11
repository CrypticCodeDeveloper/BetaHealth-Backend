import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';




dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

await connectDB();
app.use(cors());
app.use(express.json());

// ROUTES
app.use('/api/user', userRoutes);
app.use('/api/session', sessionRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('BetaHealth Backend is running!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
