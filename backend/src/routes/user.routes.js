import express from 'express';
import { requireUser } from '../middleware/auth.js';
import { dashboard, creatorStats, report, getProfile, updateProfile } from '../controllers/userController.js';

const router = express.Router();

// Rutas del usuario autenticado.
router.get('/dashboard', requireUser, dashboard);
router.get('/creator-stats', requireUser, creatorStats);
router.get('/report', requireUser, report);
router.get('/profile', requireUser, getProfile);
router.put('/profile', requireUser, updateProfile);

// Alias conservados para las rutas que consume el frontend.
router.get('/user/dashboard', requireUser, dashboard);
router.get('/user/creator/stats', requireUser, creatorStats);
router.get('/user/report', requireUser, report);
router.get('/user/configuracion', requireUser, getProfile);
router.put('/user/configuracion', requireUser, updateProfile);

export default router;
