import express from 'express';
import { registracija, prijava, dohvatiProfil, azurirajProfil } from '../controllers/authController.js';
import { zastitiRutu } from '../middleware/auth.js';

const router = express.Router();

router.post('/korisnici', registracija);

router.post('/auth/sesija', prijava);

router.get('/korisnici/profil', zastitiRutu, dohvatiProfil);
router.put('/korisnici/profil', zastitiRutu, azurirajProfil);

export default router;