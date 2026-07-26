import Trening from '../models/trening.js';
import TreningZavrsetak from '../models/treningZavrsetak.js';

function pocetakDana() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export const dohvatiTreninge = async (req, res) => {
  try {
    const treninzi = await Trening.find().select('naziv opis vjezbe').sort({ createdAt: -1 });
    const sazetak = treninzi.map(t => ({
      _id: t._id,
      naziv: t.naziv,
      opis: t.opis,
      brojVjezbi: t.vjezbe.length,
    }));
    res.json({ treninzi: sazetak });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri dohvaćanju treninga.', error: err.message });
  }
};

export const dohvatiTrening = async (req, res) => {
  try {
    const trening = await Trening.findById(req.params.id).populate('vjezbe.vjezbaId');
    if (!trening) return res.status(404).json({ poruka: 'Trening nije pronađen.' });

    const vjezbe = trening.vjezbe
      .filter(stavka => stavka.vjezbaId)
      .map(stavka => ({
        ...stavka.vjezbaId.toObject(),
        pauzaNakon: stavka.pauza != null ? stavka.pauza : null,
      }));

    const odradenoDanas = await TreningZavrsetak.exists({
      korisnikId: req.korisnik._id,
      treningId: trening._id,
      datum: pocetakDana(),
    });
    const ukupnoOdradeno = await TreningZavrsetak.countDocuments({
      korisnikId: req.korisnik._id,
      treningId: trening._id,
    });

    res.json({
      trening: { _id: trening._id, naziv: trening.naziv, opis: trening.opis, nacinIzvodjenja: trening.nacinIzvodjenja, vjezbe },
      odradenoDanas: !!odradenoDanas,
      ukupnoOdradeno,
    });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri dohvaćanju treninga.', error: err.message });
  }
};

function validirajTrening(body) {
  if (!body.naziv || !body.naziv.trim()) return 'Naziv je obavezan.';
  if (!Array.isArray(body.vjezbe) || body.vjezbe.length === 0) return 'Dodaj barem jednu vježbu u trening.';
  if (!body.vjezbe.every(v => v && v.vjezbaId)) return 'Neispravan popis vježbi.';
  return null;
}

export const dodajTrening = async (req, res) => {
  try {
    const greska = validirajTrening(req.body);
    if (greska) return res.status(400).json({ poruka: greska });

    const { naziv, opis, vjezbe, nacinIzvodjenja } = req.body;
    const trening = await Trening.create({
      naziv: naziv.trim(),
      opis,
      vjezbe,
      nacinIzvodjenja: nacinIzvodjenja === 'kruzno' ? 'kruzno' : 'redom',
      kreiraoId: req.korisnik._id,
    });
    res.status(201).json({ trening });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri kreiranju treninga.', error: err.message });
  }
};

export const azurirajTrening = async (req, res) => {
  try {
    const greska = validirajTrening(req.body);
    if (greska) return res.status(400).json({ poruka: greska });

    const { naziv, opis, vjezbe, nacinIzvodjenja } = req.body;
    const trening = await Trening.findByIdAndUpdate(
      req.params.id,
      { naziv: naziv.trim(), opis, vjezbe, nacinIzvodjenja: nacinIzvodjenja === 'kruzno' ? 'kruzno' : 'redom' },
      { new: true }
    ).populate('vjezbe.vjezbaId');

    if (!trening) return res.status(404).json({ poruka: 'Trening nije pronađen.' });
    res.json({ trening });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri ažuriranju treninga.', error: err.message });
  }
};

export const obrisiTrening = async (req, res) => {
  try {
    const trening = await Trening.findByIdAndDelete(req.params.id);
    if (!trening) return res.status(404).json({ poruka: 'Trening nije pronađen.' });
    await TreningZavrsetak.deleteMany({ treningId: trening._id });
    res.json({ poruka: 'Trening obrisan.' });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri brisanju.', error: err.message });
  }
};

export const oznaciOdradeno = async (req, res) => {
  try {
    const trening = await Trening.findById(req.params.id);
    if (!trening) return res.status(404).json({ poruka: 'Trening nije pronađen.' });

    const danas = pocetakDana();
    const postojeci = await TreningZavrsetak.findOne({
      korisnikId: req.korisnik._id,
      treningId: trening._id,
      datum: danas,
    });

    if (postojeci) {
      await postojeci.deleteOne();
    } else {
      await TreningZavrsetak.create({ korisnikId: req.korisnik._id, treningId: trening._id, datum: danas });
    }

    const ukupnoOdradeno = await TreningZavrsetak.countDocuments({
      korisnikId: req.korisnik._id,
      treningId: trening._id,
    });

    res.json({ odradenoDanas: !postojeci, ukupnoOdradeno });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri označavanju.', error: err.message });
  }
};
