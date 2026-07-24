import express from 'express';
import {
  dohvatiObavijesti,
  kreirajObavijest,
  obrisiObavijest,
} from '../controllers/obavijestController.js';
import { zastitiRutu, samoadmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/obavijesti', zastitiRutu, dohvatiObavijesti);
router.post('/obavijesti', zastitiRutu, samoadmin, kreirajObavijest);
router.delete('/obavijesti/:id', zastitiRutu, samoadmin, obrisiObavijest);

export default router;
