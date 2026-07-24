import Feedback from '../models/feedback.js';

export const posaljiFeedback = async (req, res) => {
  try {
    const { tekst } = req.body;
    if (!tekst || !tekst.trim()) {
      return res.status(400).json({ poruka: 'Upiši poruku prije slanja.' });
    }

    const feedback = await Feedback.create({ korisnikId: req.korisnik._id, tekst: tekst.trim() });
    res.status(201).json({ feedback });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri slanju feedbacka.', error: err.message });
  }
};

export const dohvatiFeedback = async (req, res) => {
  try {
    const svi = await Feedback.find()
      .populate('korisnikId', 'ime email')
      .sort({ createdAt: -1 });
    res.json({ feedback: svi });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri dohvaćanju feedbacka.', error: err.message });
  }
};

export const oznaciProcitano = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(req.params.id, { procitano: true }, { new: true });
    if (!feedback) return res.status(404).json({ poruka: 'Feedback nije pronađen.' });
    res.json({ feedback });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri ažuriranju.', error: err.message });
  }
};

export const obrisiFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) return res.status(404).json({ poruka: 'Feedback nije pronađen.' });
    res.json({ poruka: 'Feedback obrisan.' });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri brisanju.', error: err.message });
  }
};
