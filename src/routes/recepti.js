import express from 'express';
import { dohvatiRecepte, dodajRecept, azurirajRecept, obrisiRecept, uploadSlikuRecepta } from '../controllers/receptController.js';
import { zastitiRutu, samoadmin } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.get('/recepti', zastitiRutu, dohvatiRecepte);
router.post('/recepti/slika', zastitiRutu, samoadmin, upload.single('slika'), uploadSlikuRecepta);
router.post('/recepti', zastitiRutu, samoadmin, dodajRecept);
router.put('/recepti/:id', zastitiRutu, samoadmin, azurirajRecept);
router.delete('/recepti/:id', zastitiRutu, samoadmin, obrisiRecept);

export default router;
