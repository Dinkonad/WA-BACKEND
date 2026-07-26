import express from 'express';
import {
  dohvatiOpcije,
  dohvatiVjezbe,
  dodajVjezbu,
  azurirajVjezbu,
  obrisiVjezbu,
} from '../controllers/vjezbaController.js';
import { zastitiRutu, samoadmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/vjezbe/opcije', zastitiRutu, dohvatiOpcije);
router.get('/vjezbe', zastitiRutu, dohvatiVjezbe);
router.post('/vjezbe', zastitiRutu, samoadmin, dodajVjezbu);
router.put('/vjezbe/:id', zastitiRutu, samoadmin, azurirajVjezbu);
router.delete('/vjezbe/:id', zastitiRutu, samoadmin, obrisiVjezbu);

export default router;
