import jwt from 'jsonwebtoken';
import Korisnik from '../models/korisnik.js';
import Ulazak from '../models/ulazak.js';
import Clanarina from '../models/clanarina.js';
import Feedback from '../models/feedback.js';
import TreningZavrsetak from '../models/treningZavrsetak.js';
import Izazov from '../models/izazov.js';
import { uploadSliku } from '../services/supabase.js';

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
      slika: req.korisnik.slika,
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
        slika: req.korisnik.slika,
      },
    });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri ažuriranju profila.', error: err.message });
  }
};

export const uploadSlikuProfila = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ poruka: 'Slika je obavezna.' });
    const url = await uploadSliku(req.file, 'profilne');
    req.korisnik.slika = url;
    await req.korisnik.save();
    res.json({ slika: url });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri uploadu slike.', error: err.message });
  }
};

export const dohvatiKorisnike = async (req, res) => {
  try {
    const korisnici = await Korisnik.find().select('ime email uloga createdAt').sort({ createdAt: -1 });
    res.json({ korisnici });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri dohvaćanju korisnika.', error: err.message });
  }
};

export const obrisiKorisnika = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === String(req.korisnik._id)) {
      return res.status(400).json({ poruka: 'Ne možeš obrisati sam sebe.' });
    }

    const korisnik = await Korisnik.findById(id);
    if (!korisnik) return res.status(404).json({ poruka: 'Korisnik nije pronađen.' });

    await Promise.all([
      Ulazak.deleteMany({ korisnikId: id }),
      Clanarina.deleteMany({ korisnikId: id }),
      Feedback.deleteMany({ korisnikId: id }),
      TreningZavrsetak.deleteMany({ korisnikId: id }),
    ]);

    const izazovi = await Izazov.find({
      $or: [{ 'sudionici.korisnikId': id }, { 'timovi.clanovi': id }],
    });
    for (const izazov of izazovi) {
      izazov.timovi.forEach(t => {
        t.clanovi = t.clanovi.filter(c => String(c) !== id);
      });
      izazov.timovi = izazov.timovi.filter(t => {
        if (t.clanovi.length === 0) return false;
        if (String(t.kapetan) === id) t.kapetan = t.clanovi[0];
        return true;
      });
      const preostaliTimIds = izazov.timovi.map(t => String(t._id));
      izazov.sudionici = izazov.sudionici.filter(s => {
        if (String(s.korisnikId) === id) return false;
        if (s.timId && !preostaliTimIds.includes(String(s.timId))) return false;
        return true;
      });
      await izazov.save();
    }
    
    const sTragovima = await Korisnik.find({
      $or: [{ 'aktivnosti.lajkovi': id }, { 'aktivnosti.komentari.korisnikId': id }],
    }).select('aktivnosti');

    for (const drugi of sTragovima) {
      drugi.aktivnosti.forEach(a => {
        a.lajkovi = a.lajkovi.filter(l => String(l) !== id);
        a.komentari.forEach(k => {
          if (k.korisnikId && String(k.korisnikId) === id) k.korisnikId = null;
        });
      });
      await drugi.save();
    }

    await Korisnik.findByIdAndDelete(id);

    res.json({ poruka: 'Korisnik i svi njegovi tragovi u bazi su obrisani.' });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri brisanju korisnika.', error: err.message });
  }
};