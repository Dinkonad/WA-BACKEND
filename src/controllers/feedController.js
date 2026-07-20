import Korisnik from '../models/korisnik.js';

export const dohvatiFeed = async (req, res) => {
  try {
    const stranica = parseInt(req.query.stranica) || 1;
    const velicina = 10;

    const rezultat = await Korisnik.aggregate([
      { $unwind: '$aktivnosti' },
      { $match: { 'aktivnosti.uFeedu': true } },
      { $sort: { 'aktivnosti.datum': -1 } },
      { $skip: (stranica - 1) * velicina },
      { $limit: velicina },
      { $project: {
          _id: 0,
          autorId: '$_id',
          autorIme: '$ime',
          autorSlika: '$strava.profilnaSlika',
          aktivnost: '$aktivnosti',
        } },
    ]);

    const korisnikId = String(req.korisnik._id);

    const sviLajkeriId = [...new Set(rezultat.flatMap(r => (r.aktivnost.lajkovi || []).map(id => String(id))))];
    const lajkeri = await Korisnik.find({ _id: { $in: sviLajkeriId } }).select('ime');
    const imenaPoId = new Map(lajkeri.map(k => [String(k._id), k.ime]));

    const stavke = rezultat.map(r => ({
      ...r.aktivnost,
      autorId: r.autorId,
      autorIme: r.autorIme,
      autorSlika: r.autorSlika,
      brojLajkova: r.aktivnost.lajkovi?.length || 0,
      lajkano: (r.aktivnost.lajkovi || []).some(id => String(id) === korisnikId),
      imenaLajkera: (r.aktivnost.lajkovi || []).map(id => imenaPoId.get(String(id))).filter(Boolean),
      lajkovi: undefined,
    }));

    res.json({ aktivnosti: stavke });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri dohvaćanju feeda.', error: err.message });
  }
};

export const azurirajFeedStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { uFeedu, opis } = req.body;

    const korisnik = await Korisnik.findById(req.korisnik._id);
    const akt = korisnik.aktivnosti.id(id);
    if (!akt) return res.status(404).json({ poruka: 'Aktivnost nije pronađena.' });

    if (uFeedu !== undefined) akt.uFeedu = uFeedu;
    if (opis !== undefined) akt.opis = opis;

    await korisnik.save({ validateBeforeSave: false });
    res.json({ uFeedu: akt.uFeedu, opis: akt.opis });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri ažuriranju.', error: err.message });
  }
};

export const lajkajAktivnost = async (req, res) => {
  try {
    const { aktivnostId } = req.params;
    const korisnikId = req.korisnik._id;

    const vlasnik = await Korisnik.findOne({ 'aktivnosti._id': aktivnostId });
    if (!vlasnik) return res.status(404).json({ poruka: 'Aktivnost nije pronađena.' });

    const akt = vlasnik.aktivnosti.id(aktivnostId);
    const vecLajkano = akt.lajkovi.some(id => id.equals(korisnikId));

    if (vecLajkano) akt.lajkovi.pull(korisnikId);
    else akt.lajkovi.push(korisnikId);

    await vlasnik.save({ validateBeforeSave: false });

    const lajkeri = await Korisnik.find({ _id: { $in: akt.lajkovi } }).select('ime');

    res.json({ lajkano: !vecLajkano, brojLajkova: akt.lajkovi.length, imenaLajkera: lajkeri.map(k => k.ime) });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri lajkanju.', error: err.message });
  }
};

export const dodajKomentar = async (req, res) => {
  try {
    const { aktivnostId } = req.params;
    const tekst = req.body.tekst?.trim();
    if (!tekst) return res.status(400).json({ poruka: 'Komentar ne može biti prazan.' });

    const vlasnik = await Korisnik.findOne({ 'aktivnosti._id': aktivnostId });
    if (!vlasnik) return res.status(404).json({ poruka: 'Aktivnost nije pronađena.' });

    const akt = vlasnik.aktivnosti.id(aktivnostId);
    akt.komentari.push({ korisnikId: req.korisnik._id, ime: req.korisnik.ime, tekst });

    await vlasnik.save({ validateBeforeSave: false });
    res.json({ komentari: akt.komentari });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri komentiranju.', error: err.message });
  }
};
