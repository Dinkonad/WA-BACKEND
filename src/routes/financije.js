import express from 'express';
import {
  dohvatiKategorije,
  dodajFinanciju,
  dohvatiFinancije,
  obrisiFinanciju,
  dohvatiStatistiku,
  izvezuFinancije,
} from '../controllers/financijeController.js';
import { zastitiRutu, samoKnjigovodstvo } from '../middleware/auth.js';

const router = express.Router();

router.get('/financije/kategorije', zastitiRutu, samoKnjigovodstvo, dohvatiKategorije);
router.get('/financije/statistika', zastitiRutu, samoKnjigovodstvo, dohvatiStatistiku);
router.get('/financije/export', zastitiRutu, samoKnjigovodstvo, izvezuFinancije);
router.get('/financije', zastitiRutu, samoKnjigovodstvo, dohvatiFinancije);
router.post('/financije', zastitiRutu, samoKnjigovodstvo, dodajFinanciju);
router.delete('/financije/:id', zastitiRutu, samoKnjigovodstvo, obrisiFinanciju);

export default router;
