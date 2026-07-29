import express from 'express';
import { registracija, prijava, dohvatiProfil, azurirajProfil, uploadSlikuProfila } from '../controllers/authController.js';
import { zastitiRutu } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.post('/korisnici', registracija);

router.post('/auth/sesija', prijava);

router.get('/korisnici/profil', zastitiRutu, dohvatiProfil);
router.put('/korisnici/profil', zastitiRutu, azurirajProfil);
router.post('/korisnici/profil/slika', zastitiRutu, upload.single('slika'), uploadSlikuProfila);

export default router;