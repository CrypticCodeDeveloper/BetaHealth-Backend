import express from 'express';
import { createUser, getUserSessions } from '../controllers/userController.js';

const router = express.Router();

router.post('/', createUser);
router.get('/:id/sessions', getUserSessions);

export default router;
