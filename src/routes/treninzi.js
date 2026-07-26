import express from 'express';
import {
  dohvatiTreninge,
  dohvatiTrening,
  dodajTrening,
  azurirajTrening,
  obrisiTrening,
  oznaciOdradeno,
} from '../controllers/treningController.js';
import { zastitiRutu, samoadmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/treninzi', zastitiRutu, dohvatiTreninge);
router.get('/treninzi/:id', zastitiRutu, dohvatiTrening);
router.post('/treninzi', zastitiRutu, samoadmin, dodajTrening);
router.put('/treninzi/:id', zastitiRutu, samoadmin, azurirajTrening);
router.delete('/treninzi/:id', zastitiRutu, samoadmin, obrisiTrening);
router.post('/treninzi/:id/odradi', zastitiRutu, oznaciOdradeno);

export default router;
