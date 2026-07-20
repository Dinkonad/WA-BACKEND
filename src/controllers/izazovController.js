import Izazov from '../models/izazov.js';
import Korisnik from '../models/korisnik.js';

export const kreirajIzazov = async (req, res) => {
  try {
    const { naziv, opis, vrsta, pocetak, kraj, uvjeti, nacin } = req.body;
    if (!naziv || !vrsta || !pocetak || !kraj || !uvjeti?.length) {
      return res.status(400).json({ poruka: 'Nedostaju obavezna polja.' });
    }

    const izazov = await Izazov.create({
      naziv,
      opis,
      vrsta,
      pocetak,
      kraj,
      uvjeti,
      nacin,
      kreiraoId: req.korisnik._id,
    });

    res.status(201).json({ izazov });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri kreiranju izazova.', error: err.message });
  }
};

export const azurirajIzazov = async (req, res) => {
  try {
    const { naziv, opis, vrsta, pocetak, kraj, uvjeti, nacin } = req.body;
    const izazov = await Izazov.findById(req.params.id);
    if (!izazov) return res.status(404).json({ poruka: 'Izazov nije pronađen.' });

    if (naziv !== undefined) izazov.naziv = naziv;
    if (opis !== undefined) izazov.opis = opis;
    if (vrsta !== undefined) izazov.vrsta = vrsta;
    if (pocetak !== undefined) izazov.pocetak = pocetak;
    if (kraj !== undefined) izazov.kraj = kraj;
    if (uvjeti !== undefined) izazov.uvjeti = uvjeti;
    if (nacin !== undefined) izazov.nacin = nacin;

    await izazov.save();
    res.json({ izazov });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri ažuriranju izazova.', error: err.message });
  }
};

export const dohvatiIzazove = async (req, res) => {
  try {
    const izazovi = await Izazov.find().sort({ pocetak: -1 });
    const sad = new Date();
    const korisnikId = String(req.korisnik._id);

    const mapiraj = (i) => {
      const obj = i.toObject();
      obj.pridruzen = i.sudionici.some(s => String(s.korisnikId) === korisnikId);
      obj.brojSudionika = i.sudionici.length;
      delete obj.sudionici;
      return obj;
    };

    res.json({
      aktivni: izazovi.filter(i => krajDana(i.kraj) >= sad).map(mapiraj),
      prosli: izazovi.filter(i => krajDana(i.kraj) < sad).map(mapiraj),
    });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri dohvaćanju izazova.', error: err.message });
  }
};

export const pridruziSeIzazovu = async (req, res) => {
  try {
    const izazov = await Izazov.findById(req.params.id);
    if (!izazov) return res.status(404).json({ poruka: 'Izazov nije pronađen.' });
    if (krajDana(izazov.kraj) < new Date()) return res.status(400).json({ poruka: 'Izazov je već završio.' });

    const korisnikId = req.korisnik._id;
    const vecPostoji = izazov.sudionici.some(s => s.korisnikId.equals(korisnikId));
    if (vecPostoji) return res.json({ pridruzen: true });

    izazov.sudionici.push({ korisnikId, datumPridruzivanja: new Date() });
    await izazov.save();

    res.json({ pridruzen: true });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri pridruživanju.', error: err.message });
  }
};

const MJERA_POLJE = {
  km: (a) => (a.udaljenost || 0) / 1000,
  vrijeme: (a) => (a.trajanje || 0) / 60,
  kalorije: (a) => a.kalorije || 0,
  elevacija: (a) => a.visinskaRazlika || 0,
  broj: () => 1,
};

function napredakZaUvjet(aktivnosti, uvjet) {
  const izracunajVrijednost = MJERA_POLJE[uvjet.mjera] || (() => 0);
  const relevantne = aktivnosti.filter(a => a.tip === uvjet.tip);
  return relevantne.reduce((s, a) => s + izracunajVrijednost(a), 0);
}

function izracunajKumulativno(korisnik, izazov, odDatuma) {
  let bodovi = 0;

  izazov.uvjeti.forEach(uvjet => {
    const relevantne = korisnik.aktivnosti.filter(a =>
      new Date(a.datum) >= odDatuma && new Date(a.datum) <= krajDana(izazov.kraj)
    );
    const napredak = napredakZaUvjet(relevantne, uvjet);
    bodovi += Math.floor(napredak / uvjet.cilj) * uvjet.bodovi;
  });

  return { bodovi, status: 'aktivan', eliminiranDatum: null };
}

function pocetakDana(datum) {
  const d = new Date(datum);
  d.setHours(0, 0, 0, 0);
  return d;
}

function krajDana(datum) {
  const d = new Date(datum);
  d.setHours(23, 59, 59, 999);
  return d;
}

function istiDan(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function izracunajDnevno(korisnik, izazov, odDatuma) {
  const jucer = pocetakDana(new Date());
  jucer.setDate(jucer.getDate() - 1);
  const zadnjiDanZaProvjeru = izazov.kraj < jucer ? pocetakDana(izazov.kraj) : jucer;

  let dan = pocetakDana(odDatuma);
  let bodovi = 0;
  let status = 'aktivan';
  let eliminiranDatum = null;

  while (dan <= zadnjiDanZaProvjeru) {
    const dnevneAktivnosti = korisnik.aktivnosti.filter(a => istiDan(new Date(a.datum), dan));
    let danProsao = false;

    izazov.uvjeti.forEach(uvjet => {
      const napredak = napredakZaUvjet(dnevneAktivnosti, uvjet);
      if (napredak >= uvjet.cilj) {
        bodovi += uvjet.bodovi;
        danProsao = true;
      }
    });

    if (!danProsao) {
      status = 'eliminiran';
      eliminiranDatum = new Date(dan);
      break;
    }

    dan.setDate(dan.getDate() + 1);
  }

  return { bodovi, status, eliminiranDatum };
}

export const dohvatiLjestvicu = async (req, res) => {
  try {
    const izazov = await Izazov.findById(req.params.id);
    if (!izazov) return res.status(404).json({ poruka: 'Izazov nije pronađen.' });

    const korisniciIds = izazov.sudionici.map(s => s.korisnikId);
    const korisnici = await Korisnik.find({ _id: { $in: korisniciIds } }).select('ime strava.profilnaSlika aktivnosti');

    const ljestvica = izazov.sudionici
      .map(sudionik => {
        const korisnik = korisnici.find(k => k._id.equals(sudionik.korisnikId));
        if (!korisnik) return null;

        const odDatuma = sudionik.datumPridruzivanja > izazov.pocetak ? sudionik.datumPridruzivanja : izazov.pocetak;
        const rezultat = izazov.nacin === 'dnevno'
          ? izracunajDnevno(korisnik, izazov, odDatuma)
          : izracunajKumulativno(korisnik, izazov, odDatuma);

        return {
          korisnikId: korisnik._id,
          ime: korisnik.ime,
          slika: korisnik.strava?.profilnaSlika || null,
          bodovi: rezultat.bodovi,
          status: rezultat.status,
          eliminiranDatum: rezultat.eliminiranDatum,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === 'aktivan' ? -1 : 1;
        return b.bodovi - a.bodovi;
      });

    res.json({ ljestvica });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri računanju ljestvice.', error: err.message });
  }
};

export const obrisiIzazov = async (req, res) => {
  try {
    const izazov = await Izazov.findByIdAndDelete(req.params.id);
    if (!izazov) return res.status(404).json({ poruka: 'Izazov nije pronađen.' });
    res.json({ poruka: 'Izazov obrisan.' });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri brisanju izazova.', error: err.message });
  }
};

export const dohvatiIzazov = async (req, res) => {
  try {
    const izazov = await Izazov.findById(req.params.id);
    if (!izazov) return res.status(404).json({ poruka: 'Izazov nije pronađen.' });
    res.json({ izazov });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška.', error: err.message });
  }
};
