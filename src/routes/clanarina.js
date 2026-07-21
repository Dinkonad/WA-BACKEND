import express from 'express';
import {
  dohvatiPlanove,
  posaljiZahtjev,
  dohvatiMojZahtjev,
  dohvatiZahtjeve,
  odobriZahtjev,
  odbijZahtjev,
} from '../controllers/clanarinaController.js';
import { zastitiRutu, samoKnjigovodstvo } from '../middleware/auth.js';

const router = express.Router();

router.get('/clanarina/planovi', dohvatiPlanove);
router.post('/clanarina', zastitiRutu, posaljiZahtjev);
router.get('/clanarina/moja', zastitiRutu, dohvatiMojZahtjev);
router.get('/clanarina', zastitiRutu, samoKnjigovodstvo, dohvatiZahtjeve);
router.put('/clanarina/:id/odobri', zastitiRutu, samoKnjigovodstvo, odobriZahtjev);
router.put('/clanarina/:id/odbij', zastitiRutu, samoKnjigovodstvo, odbijZahtjev);

export default router;
