import express from 'express';
import { health, schema, listTableRows, getTableRow } from '../controllers/systemController.js';

const router = express.Router();

// Rutas técnicas para salud y depuración.
router.get('/health', health);
router.get('/schema', schema);
router.get('/tables/:table', listTableRows);
router.get('/tables/:table/:id', getTableRow);

export default router;
