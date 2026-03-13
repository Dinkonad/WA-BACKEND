import express from 'express';
import {
  dohvatiOpcijeRegistracije,
  provjeriRegistraciju,
  dohvatiOpcijePrijavom,
  provjeriPrijavu,
} from '../controllers/Webauthncontroller.js';
import { zastitiRutu } from '../middleware/auth.js';

const router = express.Router();

router.get('/webauthn/registracija-opcije', zastitiRutu, dohvatiOpcijeRegistracije);
router.post('/webauthn/registracija-provjera', zastitiRutu, provjeriRegistraciju);
router.post('/webauthn/prijava-opcije', dohvatiOpcijePrijavom);
router.post('/webauthn/prijava-provjera', provjeriPrijavu);

export default router;