import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { poveziNaBazu } from './db.js';
import authRouter from './src/routes/auth.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api', authRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

poveziNaBazu().then(() => {
  app.listen(PORT, () => {
    console.log(`Server radi na portu ${PORT}`);
  });
});