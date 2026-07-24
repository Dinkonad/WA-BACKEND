import Obavijest from '../models/obavijest.js';

export const dohvatiObavijesti = async (req, res) => {
  try {
    const obavijesti = await Obavijest.find().sort({ createdAt: -1 }).limit(20);
    res.json({ obavijesti });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri dohvaćanju obavijesti.', error: err.message });
  }
};

export const kreirajObavijest = async (req, res) => {
  try {
    const { tekst } = req.body;
    if (!tekst || !tekst.trim()) {
      return res.status(400).json({ poruka: 'Upiši tekst obavijesti.' });
    }
    const obavijest = await Obavijest.create({ tekst: tekst.trim(), kreiraoId: req.korisnik._id });
    res.status(201).json({ obavijest });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri kreiranju obavijesti.', error: err.message });
  }
};

export const obrisiObavijest = async (req, res) => {
  try {
    const obavijest = await Obavijest.findByIdAndDelete(req.params.id);
    if (!obavijest) return res.status(404).json({ poruka: 'Obavijest nije pronađena.' });
    res.json({ poruka: 'Obavijest obrisana.' });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri brisanju.', error: err.message });
  }
};
