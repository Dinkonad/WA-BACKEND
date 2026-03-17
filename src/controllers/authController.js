import jwt from 'jsonwebtoken';
import Korisnik from '../models/korisnik.js';

const generirajToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

export const registracija = async (req, res) => {
  try {
    const { ime, email, lozinka } = req.body;

    if (!ime || !email || !lozinka) {
      return res.status(400).json({ poruka: 'Sva polja su obavezna.' });
    }

    const postojiKorisnik = await Korisnik.findOne({ email });
    if (postojiKorisnik) {
      return res.status(409).json({ poruka: 'Email je već registriran.' });
    }

    const korisnik = await Korisnik.create({ ime, email, lozinka });

    const token = generirajToken(korisnik._id);

    res.status(201).json({
      token,
      korisnik: {
        id: korisnik._id,
        ime: korisnik.ime,
        email: korisnik.email,
        uloga: korisnik.uloga,
      },
    });
  } catch (error) {
    res.status(500).json({ poruka: 'Greška na serveru.', error: error.message });
  }
};

export const prijava = async (req, res) => {
  try {
    const { email, lozinka } = req.body;

    if (!email || !lozinka) {
      return res.status(400).json({ poruka: 'Email i lozinka su obavezni.' });
    }

    const korisnik = await Korisnik.findOne({ email });
    if (!korisnik || !(await korisnik.provjeriLozinku(lozinka))) {
      return res.status(401).json({ poruka: 'Pogrešan email ili lozinka.' });
    }

    const token = generirajToken(korisnik._id);

    if (korisnik.strava?.accessToken) {
      import('./stravaController.js').then(({ sinkronizirajAktivnosti }) => {
        sinkronizirajAktivnosti(korisnik._id, korisnik.strava.accessToken).catch(console.error);
      });
    }

    res.json({
      token,
      korisnik: {
        id: korisnik._id,
        ime: korisnik.ime,
        email: korisnik.email,
        uloga: korisnik.uloga,
      },
    });
  } catch (error) {
    res.status(500).json({ poruka: 'Greška na serveru.', error: error.message });
  }
};

export const dohvatiProfil = async (req, res) => {
  res.json({
    korisnik: {
      id: req.korisnik._id,
      ime: req.korisnik.ime,
      email: req.korisnik.email,
      uloga: req.korisnik.uloga,
      strava: req.korisnik.strava ? {
        profilnaSlika: req.korisnik.strava.profilnaSlika,
        grad: req.korisnik.strava.grad,
        drzava: req.korisnik.strava.drzava,
        statistike: req.korisnik.strava.statistike,
      } : null,
    },
  });
};