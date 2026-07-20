import express from 'express';
import {
  dohvatiFeed,
  azurirajFeedStatus,
  lajkajAktivnost,
  dodajKomentar,
} from '../controllers/feedController.js';
import { zastitiRutu } from '../middleware/auth.js';

const router = express.Router();

router.get('/feed', zastitiRutu, dohvatiFeed);
router.patch('/strava/aktivnost/:id/feed', zastitiRutu, azurirajFeedStatus);
router.post('/feed/:aktivnostId/lajk', zastitiRutu, lajkajAktivnost);
router.post('/feed/:aktivnostId/komentar', zastitiRutu, dodajKomentar);

export default router;
