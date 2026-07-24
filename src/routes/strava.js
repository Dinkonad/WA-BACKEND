import express from 'express';
import {
  preusmjeriNaStravu,
  stravaCallback,
  pokreniSync,
  dohvatiAktivnosti,
  dohvatiRekorde,
} from '../controllers/stravaController.js';
import { zastitiRutu } from '../middleware/auth.js';

const router = express.Router();

router.get('/strava/connect', preusmjeriNaStravu);
router.get('/strava/callback', stravaCallback);
router.post('/strava/sync', zastitiRutu, pokreniSync);
router.get('/strava/aktivnosti', zastitiRutu, dohvatiAktivnosti);
router.get('/strava/rekordi', zastitiRutu, dohvatiRekorde);

export default router;