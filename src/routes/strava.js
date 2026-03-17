import express from 'express';
import {
  preusmjeriNaStravu,
  stravaCallback,
  pokreniSync,
  dohvatiAktivnosti,
} from '../controllers/stravaController.js';
import { zastitiRutu } from '../middleware/auth.js';

const router = express.Router();

router.get('/strava/connect', preusmjeriNaStravu);
router.get('/strava/callback', stravaCallback);
router.post('/strava/sync', zastitiRutu, pokreniSync);
router.get('/strava/aktivnosti', zastitiRutu, dohvatiAktivnosti);

export default router;