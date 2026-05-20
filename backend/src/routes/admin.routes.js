import express from 'express';
import { requireAdmin } from '../middleware/auth.js';
import {
  dashboard,
  listUsers,
  promoteUser,
  deleteUser,
  listDecks,
  deleteDeck,
  restoreDeck,
  getDeckCards,
  salesReport,
} from '../controllers/adminController.js';

const router = express.Router();

// Rutas exclusivas de administración.
router.get('/admin/dashboard', requireAdmin, dashboard);
router.get('/admin/users', requireAdmin, listUsers);
router.patch('/admin/users/:id/promote', requireAdmin, promoteUser);
router.delete('/admin/users/:id', requireAdmin, deleteUser);
router.get('/admin/decks', requireAdmin, listDecks);
router.delete('/admin/decks/:id', requireAdmin, deleteDeck);
router.post('/admin/decks/:id/restore', requireAdmin, restoreDeck);
router.get('/admin/decks/:id/cards', requireAdmin, getDeckCards);
router.get('/admin/reports/sales', requireAdmin, salesReport);

// Alias conservados para las rutas que consume el frontend.
router.patch('/admin/users/:id/toggle', requireAdmin, promoteUser);
router.get('/admin/mazos', requireAdmin, listDecks);
router.delete('/admin/mazos/:id', requireAdmin, deleteDeck);
router.patch('/admin/mazos/:id/restore', requireAdmin, restoreDeck);
router.get('/admin/mazos/:id/tarjetas', requireAdmin, getDeckCards);
router.get('/admin/ventas', requireAdmin, salesReport);

export default router;
