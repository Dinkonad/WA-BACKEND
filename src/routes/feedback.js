import express from 'express';
import {
  posaljiFeedback,
  dohvatiFeedback,
  oznaciProcitano,
  obrisiFeedback,
} from '../controllers/feedbackController.js';
import { zastitiRutu, samoadmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/feedback', zastitiRutu, posaljiFeedback);
router.get('/feedback', zastitiRutu, samoadmin, dohvatiFeedback);
router.put('/feedback/:id/procitano', zastitiRutu, samoadmin, oznaciProcitano);
router.delete('/feedback/:id', zastitiRutu, samoadmin, obrisiFeedback);

export default router;
