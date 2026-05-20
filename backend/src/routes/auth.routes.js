import express from 'express';
import { requireUser } from '../middleware/auth.js';
import { me, login, adminLogin, register, logout, adminLogout } from '../controllers/authController.js';

const router = express.Router();

// Rutas de autenticación y sesión.
router.get('/me', requireUser, me);
router.post('/login', login);
router.post('/admin/login', adminLogin);
router.post('/register', register);
router.post('/logout', logout);
router.post('/admin/logout', adminLogout);

export default router;
