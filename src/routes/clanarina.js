import express from 'express';
import {
  dohvatiPlanove,
  posaljiZahtjev,
  dohvatiMojZahtjev,
  dohvatiZahtjeve,
  odobriZahtjev,
  odbijZahtjev,
  obrisiZahtjev,
  dohvatiQrKod,
  provjeriQrKod,
  dohvatiBrojUTeretani,
} from '../controllers/clanarinaController.js';
import { zastitiRutu, samoKnjigovodstvo, samoRecepcija } from '../middleware/auth.js';

const router = express.Router();

router.get('/clanarina/planovi', dohvatiPlanove);
router.post('/clanarina', zastitiRutu, posaljiZahtjev);
router.get('/clanarina/moja', zastitiRutu, dohvatiMojZahtjev);
router.get('/clanarina/qr', zastitiRutu, dohvatiQrKod);
router.get('/clanarina/broj-u-teretani', zastitiRutu, dohvatiBrojUTeretani);
router.post('/clanarina/qr/provjeri', zastitiRutu, samoRecepcija, provjeriQrKod);
router.get('/clanarina', zastitiRutu, samoKnjigovodstvo, dohvatiZahtjeve);
router.put('/clanarina/:id/odobri', zastitiRutu, samoKnjigovodstvo, odobriZahtjev);
router.put('/clanarina/:id/odbij', zastitiRutu, samoKnjigovodstvo, odbijZahtjev);
router.delete('/clanarina/:id', zastitiRutu, samoKnjigovodstvo, obrisiZahtjev);

export default router;
