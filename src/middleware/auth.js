import jwt from 'jsonwebtoken';
import Korisnik from '../models/korisnik.js';

export const zastitiRutu = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ poruka: 'Nisi prijavljen. Molimo se prijavi.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.korisnik = await Korisnik.findById(decoded.id).select('-lozinka');

    if (!req.korisnik) {
      return res.status(401).json({ poruka: 'Korisnik ne postoji.' });
    }

    next();
  } catch {
    return res.status(401).json({ poruka: 'Token nije validan.' });
  }
};

export const samoadmin = (req, res, next) => {
  if (req.korisnik.uloga !== 'admin') {
    return res.status(403).json({ poruka: 'Pristup dozvoljen samo adminima.' });
  }
  next();
};