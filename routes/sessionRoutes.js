import express from 'express';
import { createSession, respondToSession } from '../controllers/sessionController.js';

const router = express.Router();

router.post('/', createSession);
router.post('/:id/respond', respondToSession); // 👈 new route

export default router;
