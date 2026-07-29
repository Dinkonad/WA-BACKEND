import Recept from '../models/recept.js';
import { uploadSliku } from '../services/supabase.js';

export const uploadSlikuRecepta = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ poruka: 'Slika je obavezna.' });
    const url = await uploadSliku(req.file, 'recepti');
    res.json({ slika: url });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri uploadu slike.', error: err.message });
  }
};

export const dohvatiRecepte = async (req, res) => {
  try {
    const recepti = await Recept.find().sort({ createdAt: -1 });
    res.json({ recepti });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri dohvaćanju recepata.', error: err.message });
  }
};

function validirajPolja(body) {
  const { naziv, sastojci, priprema } = body;
  if (!naziv || !naziv.trim()) return 'Naziv je obavezan.';
  if (!sastojci || !sastojci.trim()) return 'Sastojci su obavezni.';
  if (!priprema || !priprema.trim()) return 'Priprema je obavezna.';
  return null;
}

export const dodajRecept = async (req, res) => {
  try {
    const greska = validirajPolja(req.body);
    if (greska) return res.status(400).json({ poruka: greska });

    const { naziv, slika, porcije, sastojci, priprema, kalorije, proteini, ugljikohidrati, masti } = req.body;

    const recept = await Recept.create({
      naziv: naziv.trim(),
      slika,
      porcije,
      sastojci,
      priprema,
      kalorije,
      proteini,
      ugljikohidrati,
      masti,
      kreiraoId: req.korisnik._id,
    });

    res.status(201).json({ recept });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri dodavanju recepta.', error: err.message });
  }
};

export const azurirajRecept = async (req, res) => {
  try {
    const greska = validirajPolja(req.body);
    if (greska) return res.status(400).json({ poruka: greska });

    const { naziv, slika, porcije, sastojci, priprema, kalorije, proteini, ugljikohidrati, masti } = req.body;

    const recept = await Recept.findByIdAndUpdate(
      req.params.id,
      { naziv: naziv.trim(), slika, porcije, sastojci, priprema, kalorije, proteini, ugljikohidrati, masti },
      { new: true }
    );

    if (!recept) return res.status(404).json({ poruka: 'Recept nije pronađen.' });
    res.json({ recept });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri ažuriranju recepta.', error: err.message });
  }
};

export const obrisiRecept = async (req, res) => {
  try {
    const recept = await Recept.findByIdAndDelete(req.params.id);
    if (!recept) return res.status(404).json({ poruka: 'Recept nije pronađen.' });
    res.json({ poruka: 'Recept obrisan.' });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri brisanju.', error: err.message });
  }
};
