import express from 'express';
import { requireUser } from '../middleware/auth.js';
import {
  listMarketplace,
  getMarketplaceDetail,
  acquireFreeDeck,
  confirmPayment,
  ratePublication,
} from '../controllers/marketplaceController.js';

const router = express.Router();

// Rutas del marketplace y las compras.
router.get('/marketplace', requireUser, listMarketplace);
router.get('/marketplace/:id', requireUser, getMarketplaceDetail);
router.post('/marketplace/:id/acquire', requireUser, acquireFreeDeck);
router.post('/marketplace/:id/pay', requireUser, confirmPayment);
router.post('/marketplace/:id/rate', requireUser, ratePublication);

// Alias conservados para las rutas que consume el frontend.
router.get('/user/marketplace', requireUser, listMarketplace);
router.get('/user/marketplace/:id', requireUser, getMarketplaceDetail);
router.post('/user/marketplace/:id/adquirir', requireUser, acquireFreeDeck);
router.post('/user/marketplace/:id/confirmar', requireUser, confirmPayment);
router.post('/user/marketplace/:id/valorar', requireUser, ratePublication);

export default router;
