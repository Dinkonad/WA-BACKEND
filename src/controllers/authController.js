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
      datumRodjenja: req.korisnik.datumRodjenja,
      spol: req.korisnik.spol,
      telefon: req.korisnik.telefon,
      visina: req.korisnik.visina,
      tezina: req.korisnik.tezina,
      adresa: req.korisnik.adresa,
      clanOd: req.korisnik.createdAt,
      strava: req.korisnik.strava ? {
        profilnaSlika: req.korisnik.strava.profilnaSlika,
        grad: req.korisnik.strava.grad,
        drzava: req.korisnik.strava.drzava,
        statistike: req.korisnik.strava.statistike,
        povezano: !!req.korisnik.strava.accessToken,
      } : null,
    },
  });
};

export const azurirajProfil = async (req, res) => {
  try {
    const { ime, datumRodjenja, spol, telefon, visina, tezina, adresa } = req.body;

    if (ime !== undefined) {
      if (!ime.trim()) return res.status(400).json({ poruka: 'Ime ne može biti prazno.' });
      req.korisnik.ime = ime.trim();
    }
    if (datumRodjenja !== undefined) req.korisnik.datumRodjenja = datumRodjenja || null;
    if (spol !== undefined) req.korisnik.spol = spol;
    if (telefon !== undefined) req.korisnik.telefon = telefon;
    if (visina !== undefined) req.korisnik.visina = visina;
    if (tezina !== undefined) req.korisnik.tezina = tezina;
    if (adresa !== undefined) req.korisnik.adresa = adresa;

    await req.korisnik.save();

    res.json({
      korisnik: {
        id: req.korisnik._id,
        ime: req.korisnik.ime,
        email: req.korisnik.email,
        datumRodjenja: req.korisnik.datumRodjenja,
        spol: req.korisnik.spol,
        telefon: req.korisnik.telefon,
        visina: req.korisnik.visina,
        tezina: req.korisnik.tezina,
        adresa: req.korisnik.adresa,
      },
    });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri ažuriranju profila.', error: err.message });
  }
};