import express from 'express';
import {
  kreirajIzazov,
  azurirajIzazov,
  dohvatiIzazove,
  dohvatiIzazov,
  obrisiIzazov,
  pridruziSeIzazovu,
  dohvatiLjestvicu,
  osvjeziLjestvicu,
  dohvatiSudionikDetalje,
  dohvatiTimove,
  stvoriTim,
  pridruziSeTimu,
  izbaciClanaIzTima,
} from '../controllers/izazovController.js';
import { zastitiRutu, samoadmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/izazovi', zastitiRutu, dohvatiIzazove);
router.get('/izazovi/:id', zastitiRutu, dohvatiIzazov);
router.get('/izazovi/:id/ljestvica', zastitiRutu, dohvatiLjestvicu);
router.post('/izazovi/:id/ljestvica/osvjezi', zastitiRutu, osvjeziLjestvicu);
router.get('/izazovi/:id/sudionik/:korisnikId', zastitiRutu, dohvatiSudionikDetalje);
router.post('/izazovi', zastitiRutu, samoadmin, kreirajIzazov);
router.post('/izazovi/:id/pridruzi', zastitiRutu, pridruziSeIzazovu);
router.get('/izazovi/:id/timovi', zastitiRutu, dohvatiTimove);
router.post('/izazovi/:id/timovi', zastitiRutu, stvoriTim);
router.post('/izazovi/:id/timovi/:timId/pridruzi', zastitiRutu, pridruziSeTimu);
router.delete('/izazovi/:id/timovi/:timId/clanovi/:korisnikId', zastitiRutu, izbaciClanaIzTima);
router.put('/izazovi/:id', zastitiRutu, samoadmin, azurirajIzazov);
router.delete('/izazovi/:id', zastitiRutu, samoadmin, obrisiIzazov);

export default router;
