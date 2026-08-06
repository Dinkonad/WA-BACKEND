import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { poveziNaBazu } from './db.js';
import authRouter from './src/routes/auth.js';
import webauthnRouter from './src/routes/webauthn.js';
import stravaRouter from './src/routes/strava.js';
import feedRouter from './src/routes/feed.js';
import izazoviRouter from './src/routes/izazovi.js';
import clanarinaRouter from './src/routes/clanarina.js';
import financijeRouter from './src/routes/financije.js';
import feedbackRouter from './src/routes/feedback.js';
import obavijestiRouter from './src/routes/obavijesti.js';
import vjezbeRouter from './src/routes/vjezbe.js';
import treninziRouter from './src/routes/treninzi.js';
import receptiRouter from './src/routes/recepti.js';

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

app.use(authRouter);
app.use(webauthnRouter);
app.use(stravaRouter);
app.use(feedRouter);
app.use(izazoviRouter);
app.use(clanarinaRouter);
app.use(financijeRouter);
app.use(feedbackRouter);
app.use(obavijestiRouter);
app.use(vjezbeRouter);
app.use(treninziRouter);
app.use(receptiRouter);

app.get('/health', (req, res) => res.json({ status: 'OK' }));

poveziNaBazu().then(() => {
  app.listen(PORT, () => console.log(`Server radi na portu ${PORT}`));
});