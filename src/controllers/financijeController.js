import Financija from '../models/financija.js';

export const KATEGORIJE = {
  prihod: ['Članarina', 'Sponzorstvo', 'Ostalo'],
  rashod: ['Zaposlenici', 'Režije', 'Oprema', 'Ostalo'],
};

export const dohvatiKategorije = (req, res) => {
  res.json({ kategorije: KATEGORIJE });
};

export const dodajFinanciju = async (req, res) => {
  try {
    const { vrsta, kategorija, ime, iznos, opis, datum } = req.body;

    if (!['prihod', 'rashod'].includes(vrsta)) {
      return res.status(400).json({ poruka: 'Nepoznata vrsta.' });
    }
    if (!kategorija || !ime || iznos == null || !datum) {
      return res.status(400).json({ poruka: 'Popuni sva obavezna polja.' });
    }

    const stavka = await Financija.create({
      vrsta,
      kategorija,
      ime,
      iznos,
      opis,
      datum,
      kreiraoId: req.korisnik._id,
    });

    res.status(201).json({ stavka });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri dodavanju.', error: err.message });
  }
};

export const dohvatiFinancije = async (req, res) => {
  try {
    const filter = {};
    if (req.query.vrsta) filter.vrsta = req.query.vrsta;

    const stavke = await Financija.find(filter).sort({ datum: -1 });
    res.json({ stavke });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri dohvaćanju.', error: err.message });
  }
};

export const obrisiFinanciju = async (req, res) => {
  try {
    const stavka = await Financija.findByIdAndDelete(req.params.id);
    if (!stavka) return res.status(404).json({ poruka: 'Stavka nije pronađena.' });
    res.json({ poruka: 'Stavka obrisana.' });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri brisanju.', error: err.message });
  }
};

function pocetakDana(datum) {
  const d = new Date(datum);
  d.setHours(0, 0, 0, 0);
  return d;
}

function graniceRazdoblja(period) {
  const sad = new Date();

  if (period === 'tjedno') {
    const pocetak = pocetakDana(sad);
    pocetak.setDate(pocetak.getDate() - 6);
    return { pocetak, nazivBucketa: (d) => d.toLocaleDateString('hr-HR', { weekday: 'short' }), korakDani: 1, brojBucketa: 7 };
  }

  if (period === 'mjesecno') {
    const pocetak = new Date(sad.getFullYear(), sad.getMonth(), 1);
    const brojDana = new Date(sad.getFullYear(), sad.getMonth() + 1, 0).getDate();
    return { pocetak, nazivBucketa: (d) => String(d.getDate()), korakDani: 1, brojBucketa: brojDana };
  }

  const pocetak = new Date(sad.getFullYear(), 0, 1);
  return { pocetak, nazivBucketa: null, korakMjeseci: true, brojBucketa: 12 };
}

function formatirajDatumEU(datum) {
  const d = new Date(datum);
  const dan = String(d.getDate()).padStart(2, '0');
  const mjesec = String(d.getMonth() + 1).padStart(2, '0');
  return `${dan}/${mjesec}/${d.getFullYear()}`;
}

export const izvezuFinancije = async (req, res) => {
  try {
    const period = ['tjedno', 'mjesecno', 'godisnje'].includes(req.query.period) ? req.query.period : null;
    const filter = {};

    if (period) {
      const { pocetak } = graniceRazdoblja(period);
      filter.datum = { $gte: pocetak };
    }
    if (['prihod', 'rashod'].includes(req.query.vrsta)) filter.vrsta = req.query.vrsta;

    const stavke = await Financija.find(filter).sort({ datum: 1 });

    const redovi = ['Datum;Vrsta;Kategorija;Ime;Iznos (EUR);Opis;Automatski'];
    for (const s of stavke) {
      const vrsta = s.vrsta === 'prihod' ? 'Prihod' : 'Rashod';
      const opis = (s.opis || '').replace(/;/g, ',').replace(/[\r\n]+/g, ' ');
      const ime = (s.ime || '').replace(/;/g, ',');
      redovi.push(`${formatirajDatumEU(s.datum)};${vrsta};${s.kategorija};${ime};${s.iznos.toFixed(2)};${opis};${s.automatski ? 'Da' : 'Ne'}`);
    }

    const csv = '﻿' + redovi.join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="financije-${period || 'sve'}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri izvozu.', error: err.message });
  }
};

export const dohvatiStatistiku = async (req, res) => {
  try {
    const period = ['tjedno', 'mjesecno', 'godisnje'].includes(req.query.period) ? req.query.period : 'mjesecno';
    const { pocetak, nazivBucketa, korakMjeseci, brojBucketa } = graniceRazdoblja(period);

    const stavke = await Financija.find({ datum: { $gte: pocetak } });

    const ukupnoPrihod = stavke.filter(s => s.vrsta === 'prihod').reduce((s, a) => s + a.iznos, 0);
    const ukupnoRashod = stavke.filter(s => s.vrsta === 'rashod').reduce((s, a) => s + a.iznos, 0);

    const bucketi = [];
    const mjNazivi = ['Sij', 'Velj', 'Ožu', 'Tra', 'Svi', 'Lip', 'Srp', 'Kol', 'Ruj', 'Lis', 'Stu', 'Pro'];

    for (let i = 0; i < brojBucketa; i++) {
      let oznaka, uOvomBucketu;

      if (korakMjeseci) {
        const godina = pocetak.getFullYear();
        oznaka = mjNazivi[i];
        uOvomBucketu = stavke.filter(s => new Date(s.datum).getFullYear() === godina && new Date(s.datum).getMonth() === i);
      } else {
        const dan = new Date(pocetak);
        dan.setDate(dan.getDate() + i);
        oznaka = nazivBucketa(dan);
        uOvomBucketu = stavke.filter(s => pocetakDana(s.datum).getTime() === dan.getTime());
      }

      bucketi.push({
        oznaka,
        prihod: uOvomBucketu.filter(s => s.vrsta === 'prihod').reduce((s, a) => s + a.iznos, 0),
        rashod: uOvomBucketu.filter(s => s.vrsta === 'rashod').reduce((s, a) => s + a.iznos, 0),
      });
    }

    const rashodPoKategoriji = {};
    stavke.filter(s => s.vrsta === 'rashod').forEach(s => {
      rashodPoKategoriji[s.kategorija] = (rashodPoKategoriji[s.kategorija] || 0) + s.iznos;
    });

    const rashodBreakdown = Object.entries(rashodPoKategoriji)
      .sort((a, b) => b[1] - a[1])
      .map(([kategorija, iznos]) => ({
        kategorija,
        iznos,
        postotak: ukupnoRashod ? Math.round((iznos / ukupnoRashod) * 100) : 0,
      }));

    res.json({
      period,
      ukupnoPrihod,
      ukupnoRashod,
      neto: ukupnoPrihod - ukupnoRashod,
      bucketi,
      rashodBreakdown,
    });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri računanju statistike.', error: err.message });
  }
};
