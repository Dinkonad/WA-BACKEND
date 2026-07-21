import Clanarina from '../models/clanarina.js';

export const PLANOVI = {
  student: { naziv: 'Student', mjesecno: 25, znacajke: ['Pristup teretani', 'Od 8 do 15 sati'] },
  basic: { naziv: 'Basic', mjesecno: 35, znacajke: ['Pristup teretani', 'Cijeli dan pristup'] },
  premium: { naziv: 'Premium', mjesecno: 70, znacajke: ['Pristup teretani', 'Sauna'] },
};

export const dohvatiPlanove = (req, res) => {
  res.json({ planovi: PLANOVI });
};

export const posaljiZahtjev = async (req, res) => {
  try {
    const { plan, period, imePrezime, godiste, spol, broj } = req.body;

    if (!PLANOVI[plan]) return res.status(400).json({ poruka: 'Nepoznat plan.' });
    if (!['mjesecno', 'godisnje'].includes(period)) return res.status(400).json({ poruka: 'Nepoznat period.' });
    if (!imePrezime || !godiste || !spol || !broj) return res.status(400).json({ poruka: 'Popuni sva polja.' });

    const cijenaMjesecno = PLANOVI[plan].mjesecno;
    const cijena = period === 'godisnje' ? cijenaMjesecno * 12 : cijenaMjesecno;

    const zahtjev = await Clanarina.create({
      korisnikId: req.korisnik._id,
      plan,
      period,
      cijena,
      imePrezime,
      godiste,
      spol,
      broj,
    });

    res.status(201).json({ zahtjev });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri slanju zahtjeva.', error: err.message });
  }
};

export const dohvatiMojZahtjev = async (req, res) => {
  try {
    const zahtjev = await Clanarina.findOne({ korisnikId: req.korisnik._id }).sort({ createdAt: -1 });
    res.json({ zahtjev });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri dohvaćanju zahtjeva.', error: err.message });
  }
};

export const dohvatiZahtjeve = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const zahtjevi = await Clanarina.find(filter)
      .populate('korisnikId', 'ime email')
      .sort({ createdAt: -1 });

    res.json({ zahtjevi });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri dohvaćanju zahtjeva.', error: err.message });
  }
};

export const odobriZahtjev = async (req, res) => {
  try {
    const zahtjev = await Clanarina.findById(req.params.id);
    if (!zahtjev) return res.status(404).json({ poruka: 'Zahtjev nije pronađen.' });

    zahtjev.status = 'odobreno';
    zahtjev.obradioId = req.korisnik._id;
    zahtjev.datumObrade = new Date();
    await zahtjev.save();

    res.json({ zahtjev });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri odobravanju.', error: err.message });
  }
};

export const odbijZahtjev = async (req, res) => {
  try {
    const zahtjev = await Clanarina.findById(req.params.id);
    if (!zahtjev) return res.status(404).json({ poruka: 'Zahtjev nije pronađen.' });

    zahtjev.status = 'odbijeno';
    zahtjev.napomenaOdbijanja = req.body.napomena || '';
    zahtjev.obradioId = req.korisnik._id;
    zahtjev.datumObrade = new Date();
    await zahtjev.save();

    res.json({ zahtjev });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri odbijanju.', error: err.message });
  }
};
