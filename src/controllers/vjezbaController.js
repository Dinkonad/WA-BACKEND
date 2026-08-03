import Vjezba from '../models/vjezba.js';

const KATEGORIJE = [
  { kljuc: 'prsa', naziv: 'Prsa' },
  { kljuc: 'leđa', naziv: 'Leđa' },
  { kljuc: 'ramena', naziv: 'Ramena' },
  { kljuc: 'biceps', naziv: 'Biceps' },
  { kljuc: 'triceps', naziv: 'Triceps' },
  { kljuc: 'noge', naziv: 'Noge' },
  { kljuc: 'stomak', naziv: 'Stomak' },
  { kljuc: 'kardio', naziv: 'Kardio' },
];

const RAZINE = [
  { kljuc: 'pocetnik', naziv: 'Početnik', opis: '0-6 mjeseci treninga' },
  { kljuc: 'amater', naziv: 'Amater', opis: '6-18 mjeseci treninga' },
  { kljuc: 'pro', naziv: 'Pro', opis: '18+ mjeseci treninga' },
];

export const dohvatiOpcije = (req, res) => {
  res.json({ kategorije: KATEGORIJE, razine: RAZINE });
};

export const dohvatiVjezbe = async (req, res) => {
  try {
    const filter = {};
    if (req.query.kategorija) filter.kategorija = req.query.kategorija;
    if (req.query.razina) filter.razina = req.query.razina;

    const vjezbe = await Vjezba.find(filter).sort({ createdAt: 1 });
    res.json({ vjezbe });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri dohvaćanju vježbi.', error: err.message });
  }
};

function validirajPolja(body) {
  const { naziv, kategorija, razina } = body;
  if (!naziv || !naziv.trim()) return 'Naziv je obavezan.';
  if (!KATEGORIJE.some(k => k.kljuc === kategorija)) return 'Nepoznata kategorija.';
  if (!RAZINE.some(r => r.kljuc === razina)) return 'Nepoznata razina.';
  return null;
}

export const dodajVjezbu = async (req, res) => {
  try {
    const greska = validirajPolja(req.body);
    if (greska) return res.status(400).json({ poruka: greska });

    const { naziv, kategorija, razina, opis, video, serije, ponavljanja, kilaza, pauza } = req.body;

    const vjezba = await Vjezba.create({
      naziv: naziv.trim(),
      kategorija,
      razina,
      opis,
      video,
      serije: serije || undefined,
      ponavljanja,
      kilaza,
      pauza: pauza || undefined,
      kreiraoId: req.korisnik._id,
    });

    res.status(201).json({ vjezba });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri dodavanju vježbe.', error: err.message });
  }
};

export const azurirajVjezbu = async (req, res) => {
  try {
    const greska = validirajPolja(req.body);
    if (greska) return res.status(400).json({ poruka: greska });

    const { naziv, kategorija, razina, opis, video, serije, ponavljanja, kilaza, pauza } = req.body;

    const vjezba = await Vjezba.findByIdAndUpdate(
      req.params.id,
      { naziv: naziv.trim(), kategorija, razina, opis, video, serije: serije || undefined, ponavljanja, kilaza, pauza: pauza || undefined },
      { new: true }
    );

    if (!vjezba) return res.status(404).json({ poruka: 'Vježba nije pronađena.' });
    res.json({ vjezba });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri ažuriranju vježbe.', error: err.message });
  }
};

export const obrisiVjezbu = async (req, res) => {
  try {
    const vjezba = await Vjezba.findByIdAndDelete(req.params.id);
    if (!vjezba) return res.status(404).json({ poruka: 'Vježba nije pronađena.' });
    res.json({ poruka: 'Vježba obrisana.' });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri brisanju.', error: err.message });
  }
};
