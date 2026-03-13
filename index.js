import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { poveziNaBazu } from './db.js';
import authRouter from './src/routes/auth.js';
import webauthnRouter from './src/routes/webauthn.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5173',
  ],
  credentials: true,
}));
app.use(express.json());

app.use('/api', authRouter);
app.use('/api', webauthnRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

poveziNaBazu().then(() => {
  app.listen(PORT, () => {
    console.log(`Server radi na portu ${PORT}`);
  });
});