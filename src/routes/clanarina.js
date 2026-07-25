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
  dohvatiRetenciju,
  dohvatiIskoristenost,
  dohvatiMojePovijestClanarina,
  dohvatiTrenutnoUTeretani,
  dohvatiNaRecepciji,
  oznaciPlaceno,
} from '../controllers/clanarinaController.js';
import { zastitiRutu, samoKnjigovodstvo, samoRecepcija } from '../middleware/auth.js';

const router = express.Router();

router.get('/clanarina/planovi', dohvatiPlanove);
router.post('/clanarina', zastitiRutu, posaljiZahtjev);
router.get('/clanarina/moja', zastitiRutu, dohvatiMojZahtjev);
router.get('/clanarina/moja-povijest', zastitiRutu, dohvatiMojePovijestClanarina);
router.get('/clanarina/qr', zastitiRutu, dohvatiQrKod);
router.get('/clanarina/broj-u-teretani', zastitiRutu, dohvatiBrojUTeretani);
router.get('/clanarina/trenutno-u-teretani', zastitiRutu, samoRecepcija, dohvatiTrenutnoUTeretani);
router.get('/clanarina/na-recepciji', zastitiRutu, samoRecepcija, dohvatiNaRecepciji);
router.put('/clanarina/:id/oznaci-placeno', zastitiRutu, samoRecepcija, oznaciPlaceno);
router.post('/clanarina/qr/provjeri', zastitiRutu, samoRecepcija, provjeriQrKod);
router.get('/clanarina/retencija', zastitiRutu, samoKnjigovodstvo, dohvatiRetenciju);
router.get('/clanarina/iskoristenost', zastitiRutu, samoKnjigovodstvo, dohvatiIskoristenost);
router.get('/clanarina', zastitiRutu, samoKnjigovodstvo, dohvatiZahtjeve);
router.put('/clanarina/:id/odobri', zastitiRutu, samoKnjigovodstvo, odobriZahtjev);
router.put('/clanarina/:id/odbij', zastitiRutu, samoKnjigovodstvo, odbijZahtjev);
router.delete('/clanarina/:id', zastitiRutu, samoKnjigovodstvo, obrisiZahtjev);

export default router;
