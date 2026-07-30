import express from 'express';
import { registracija, prijava, dohvatiProfil, azurirajProfil, uploadSlikuProfila, dohvatiKorisnike, obrisiKorisnika } from '../controllers/authController.js';
import { zastitiRutu, samoadmin } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.post('/korisnici', registracija);

router.post('/auth/sesija', prijava);

router.get('/korisnici/profil', zastitiRutu, dohvatiProfil);
router.put('/korisnici/profil', zastitiRutu, azurirajProfil);
router.post('/korisnici/profil/slika', zastitiRutu, upload.single('slika'), uploadSlikuProfila);

router.get('/korisnici', zastitiRutu, samoadmin, dohvatiKorisnike);
router.delete('/korisnici/:id', zastitiRutu, samoadmin, obrisiKorisnika);

export default router;