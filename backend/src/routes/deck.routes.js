import express from 'express';
import { requireUser } from '../middleware/auth.js';
import {
  createDeck,
  getDeck,
  updateDeck,
  deleteDeck,
  saveCard,
  deleteCard,
  getStudyDeck,
  finishStudy,
  getPublishData,
  publishDeck,
} from '../controllers/deckController.js';

const router = express.Router();

// Rutas de mazos, tarjetas y estudio.
router.post('/mazos', requireUser, createDeck);
router.get('/mazos/:id', requireUser, getDeck);
router.put('/mazos/:id', requireUser, updateDeck);
router.delete('/mazos/:id', requireUser, deleteDeck);
router.post('/tarjetas', requireUser, saveCard);
router.delete('/tarjetas/:id', requireUser, deleteCard);
router.get('/estudio/:id', requireUser, getStudyDeck);
router.post('/estudio/:id/finish', requireUser, finishStudy);
router.get('/mazos/:id/publish', requireUser, getPublishData);
router.post('/mazos/:id/publish', requireUser, publishDeck);

// Alias conservados para las rutas que consume el frontend.
router.get('/estudiar/:id', requireUser, getStudyDeck);
router.post('/estudiar/:id/finalizar', requireUser, finishStudy);
router.get('/mazos/:id/publicar', requireUser, getPublishData);
router.post('/mazos/:id/publicar', requireUser, publishDeck);

export default router;
