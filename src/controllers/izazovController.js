import Izazov from '../models/izazov.js';
import Korisnik from '../models/korisnik.js';

export const kreirajIzazov = async (req, res) => {
  try {
    const { naziv, opis, vrsta, pocetak, kraj, uvjeti, nacin, velicinaTima } = req.body;
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
      velicinaTima,
      kreiraoId: req.korisnik._id,
    });

    res.status(201).json({ izazov });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri kreiranju izazova.', error: err.message });
  }
};

export const azurirajIzazov = async (req, res) => {
  try {
    const { naziv, opis, vrsta, pocetak, kraj, uvjeti, nacin, velicinaTima } = req.body;
    const izazov = await Izazov.findById(req.params.id);
    if (!izazov) return res.status(404).json({ poruka: 'Izazov nije pronađen.' });

    if (naziv !== undefined) izazov.naziv = naziv;
    if (opis !== undefined) izazov.opis = opis;
    if (vrsta !== undefined) izazov.vrsta = vrsta;
    if (pocetak !== undefined) izazov.pocetak = pocetak;
    if (kraj !== undefined) izazov.kraj = kraj;
    if (uvjeti !== undefined) izazov.uvjeti = uvjeti;
    if (nacin !== undefined) izazov.nacin = nacin;
    if (velicinaTima !== undefined) izazov.velicinaTima = velicinaTima;

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
    const danas = pocetakDana(sad);
    const korisnikId = String(req.korisnik._id);

    for (const izazov of izazovi) {
      if (krajDana(izazov.kraj) < sad) continue;
      if (izazov.sudionici.length === 0) continue;
      if (!izazov.ljestvicaAzurirana || izazov.ljestvicaAzurirana < danas) {
        await azurirajBodoveZaIzazov(izazov);
      }
    }

    const mapiraj = (i) => {
      const obj = i.toObject();
      const mojSudionik = i.sudionici.find(s => String(s.korisnikId) === korisnikId);
      obj.pridruzen = !!mojSudionik;
      obj.status = mojSudionik?.status || null;
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
    if (izazov.vrsta === 'tim') {
      return res.status(400).json({ poruka: 'Ovo je timski izazov — koristi timske rute za pridruživanje.' });
    }
    if (krajDana(izazov.kraj) < new Date()) return res.status(400).json({ poruka: 'Izazov je već završio.' });
    if (izazov.nacin === 'dnevno' && krajDana(izazov.pocetak) < new Date()) {
      return res.status(400).json({ poruka: 'Dnevnom izazovu je moguće pridružiti se samo prvog dana.' });
    }

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

export const dohvatiTimove = async (req, res) => {
  try {
    const izazov = await Izazov.findById(req.params.id);
    if (!izazov) return res.status(404).json({ poruka: 'Izazov nije pronađen.' });
    if (izazov.vrsta !== 'tim') return res.status(400).json({ poruka: 'Ovo nije timski izazov.' });

    const korisniciIds = izazov.timovi.flatMap(t => t.clanovi);
    const korisnici = await Korisnik.find({ _id: { $in: korisniciIds } }).select('ime slika strava.profilnaSlika');

    const timovi = izazov.timovi.map(t => {
      const clanovi = t.clanovi
        .map(cid => {
          const k = korisnici.find(kk => kk._id.equals(cid));
          return k ? { korisnikId: k._id, ime: k.ime, slika: k.slika || k.strava?.profilnaSlika || null } : null;
        })
        .filter(Boolean);
      return {
        timId: t._id,
        naziv: t.naziv,
        kapetan: t.kapetan,
        brojClanova: clanovi.length,
        puna: izazov.velicinaTima ? clanovi.length >= izazov.velicinaTima : false,
        clanovi,
      };
    });

    res.json({ velicinaTima: izazov.velicinaTima, timovi });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri dohvaćanju timova.', error: err.message });
  }
};

export const stvoriTim = async (req, res) => {
  try {
    const izazov = await Izazov.findById(req.params.id);
    if (!izazov) return res.status(404).json({ poruka: 'Izazov nije pronađen.' });
    if (izazov.vrsta !== 'tim') return res.status(400).json({ poruka: 'Ovo nije timski izazov.' });
    if (krajDana(izazov.kraj) < new Date()) return res.status(400).json({ poruka: 'Izazov je već završio.' });
    if (izazov.nacin === 'dnevno' && krajDana(izazov.pocetak) < new Date()) {
      return res.status(400).json({ poruka: 'Dnevnom izazovu je moguće pridružiti se samo prvog dana.' });
    }

    const naziv = (req.body.naziv || '').trim();
    if (!naziv) return res.status(400).json({ poruka: 'Naziv tima je obavezan.' });

    const korisnikId = req.korisnik._id;
    const vecPostoji = izazov.sudionici.some(s => s.korisnikId.equals(korisnikId));
    if (vecPostoji) return res.status(400).json({ poruka: 'Već si član tima u ovom izazovu.' });

    izazov.timovi.push({ naziv, kapetan: korisnikId, clanovi: [korisnikId] });
    const noviTim = izazov.timovi[izazov.timovi.length - 1];
    izazov.sudionici.push({ korisnikId, timId: noviTim._id, datumPridruzivanja: new Date() });

    await izazov.save();
    res.status(201).json({ pridruzen: true, timId: noviTim._id, naziv: noviTim.naziv });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri stvaranju tima.', error: err.message });
  }
};

export const pridruziSeTimu = async (req, res) => {
  try {
    const izazov = await Izazov.findById(req.params.id);
    if (!izazov) return res.status(404).json({ poruka: 'Izazov nije pronađen.' });
    if (izazov.vrsta !== 'tim') return res.status(400).json({ poruka: 'Ovo nije timski izazov.' });
    if (krajDana(izazov.kraj) < new Date()) return res.status(400).json({ poruka: 'Izazov je već završio.' });
    if (izazov.nacin === 'dnevno' && krajDana(izazov.pocetak) < new Date()) {
      return res.status(400).json({ poruka: 'Dnevnom izazovu je moguće pridružiti se samo prvog dana.' });
    }

    const tim = izazov.timovi.id(req.params.timId);
    if (!tim) return res.status(404).json({ poruka: 'Tim nije pronađen.' });

    const korisnikId = req.korisnik._id;
    const postojeciSudionik = izazov.sudionici.find(s => s.korisnikId.equals(korisnikId));
    if (postojeciSudionik) {
      if (String(postojeciSudionik.timId) === String(tim._id)) return res.json({ pridruzen: true, timId: tim._id });
      return res.status(400).json({ poruka: 'Već si član tima u ovom izazovu.' });
    }

    if (izazov.velicinaTima && tim.clanovi.length >= izazov.velicinaTima) {
      return res.status(400).json({ poruka: 'Tim je pun.' });
    }

    tim.clanovi.push(korisnikId);
    izazov.sudionici.push({ korisnikId, timId: tim._id, datumPridruzivanja: new Date() });

    await izazov.save();
    res.json({ pridruzen: true, timId: tim._id });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri pridruživanju timu.', error: err.message });
  }
};

export const izbaciClanaIzTima = async (req, res) => {
  try {
    const izazov = await Izazov.findById(req.params.id);
    if (!izazov) return res.status(404).json({ poruka: 'Izazov nije pronađen.' });

    const tim = izazov.timovi.id(req.params.timId);
    if (!tim) return res.status(404).json({ poruka: 'Tim nije pronađen.' });

    if (String(tim.kapetan) !== String(req.korisnik._id)) {
      return res.status(403).json({ poruka: 'Samo kapetan tima može izbacivati članove.' });
    }
    if (String(req.params.korisnikId) === String(tim.kapetan)) {
      return res.status(400).json({ poruka: 'Kapetan ne može izbaciti sam sebe.' });
    }
    if (!tim.clanovi.some(c => String(c) === req.params.korisnikId)) {
      return res.status(404).json({ poruka: 'Osoba nije član ovog tima.' });
    }

    tim.clanovi = tim.clanovi.filter(c => String(c) !== req.params.korisnikId);
    izazov.sudionici = izazov.sudionici.filter(s => String(s.korisnikId) !== req.params.korisnikId);

    await izazov.save();
    res.json({ izbacen: true });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri izbacivanju člana.', error: err.message });
  }
};

const MJERA_POLJE = {
  km: (a) => (a.udaljenost || 0) / 1000,
  vrijeme: (a) => (a.trajanje || 0) / 60,
  kalorije: (a) => a.kalorije || 0,
  elevacija: (a) => a.visinskaRazlika || 0,
  broj: () => 1,
};

function aktivnostSazetak(a) {
  return {
    stravaId: a.stravaId,
    naziv: a.naziv,
    tip: a.tip,
    datum: a.datum,
    udaljenost: a.udaljenost,
    trajanje: a.trajanje,
    kalorije: a.kalorije,
    visinskaRazlika: a.visinskaRazlika,
  };
}

function bodoviIAktivnostiZaUvjet(aktivnosti, uvjet) {
  const relevantne = aktivnosti.filter(a => a.tip === uvjet.tip);

  if (uvjet.mjera === 'broj') {
    const napredak = relevantne.length;
    const bodovi = Math.floor(napredak / uvjet.cilj) * uvjet.bodovi;
    return { bodovi, napredak, aktivnosti: relevantne.map(a => ({ ...aktivnostSazetak(a), bodoviOstvareno: null })) };
  }

  const izracunajVrijednost = MJERA_POLJE[uvjet.mjera] || (() => 0);
  let bodovi = 0;
  let napredak = 0;

  const aktivnostiDetalji = relevantne.map(a => {
    const vrijednost = izracunajVrijednost(a);
    napredak += vrijednost;
    const bodoviZaAktivnost = Math.floor(vrijednost / uvjet.cilj) * uvjet.bodovi;
    bodovi += bodoviZaAktivnost;
    return { ...aktivnostSazetak(a), bodoviOstvareno: bodoviZaAktivnost };
  });

  return { bodovi, napredak, aktivnosti: aktivnostiDetalji };
}

function izracunajKumulativno(korisnik, izazov, odDatuma) {
  const uPeriodu = korisnik.aktivnosti.filter(a =>
    new Date(a.datum) >= odDatuma && new Date(a.datum) <= krajDana(izazov.kraj)
  );

  let bodovi = 0;
  const uvjeti = izazov.uvjeti.map(uvjet => {
    const { bodovi: uvjetBodovi, napredak, aktivnosti } = bodoviIAktivnostiZaUvjet(uPeriodu, uvjet);
    bodovi += uvjetBodovi;

    return {
      tip: uvjet.tip,
      mjera: uvjet.mjera,
      cilj: uvjet.cilj,
      bodoviPoPragu: uvjet.bodovi,
      napredak,
      bodoviOstvareno: uvjetBodovi,
      aktivnosti,
    };
  });

  return { bodovi, status: 'aktivan', eliminiranDatum: null, uvjeti };
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
  const danas = pocetakDana(new Date());
  const zadnjiDanZaProvjeru = izazov.kraj < danas ? pocetakDana(izazov.kraj) : danas;

  let dan = pocetakDana(odDatuma);
  let bodovi = 0;
  let status = 'aktivan';
  let eliminiranDatum = null;
  const dani = [];

  while (dan <= zadnjiDanZaProvjeru) {
    const jeDanasnji = istiDan(dan, danas);
    const dnevneAktivnosti = korisnik.aktivnosti.filter(a => istiDan(new Date(a.datum), dan));

    let danBodovi = 0;
    const uvjetiInfo = izazov.uvjeti.map(uvjet => {
      const { bodovi: uvjetBodovi, napredak, aktivnosti } = bodoviIAktivnostiZaUvjet(dnevneAktivnosti, uvjet);
      danBodovi += uvjetBodovi;
      return {
        tip: uvjet.tip,
        mjera: uvjet.mjera,
        cilj: uvjet.cilj,
        bodoviPoPragu: uvjet.bodovi,
        napredak,
        bodoviOstvareno: uvjetBodovi,
        aktivnosti,
      };
    });

    const danProsao = danBodovi > 0;

    dani.push({
      datum: new Date(dan),
      prosao: danProsao,
      bodovi: danBodovi,
      uvjeti: uvjetiInfo,
      aktivnosti: dnevneAktivnosti.map(aktivnostSazetak),
    });

    if (danProsao) {
      bodovi += danBodovi;
    } else if (!jeDanasnji) {
      status = 'eliminiran';
      eliminiranDatum = new Date(dan);
      break;
    }

    dan.setDate(dan.getDate() + 1);
  }

  return { bodovi, status, eliminiranDatum, dani };
}

export const dohvatiLjestvicu = async (req, res) => {
  try {
    const izazov = await Izazov.findById(req.params.id);
    if (!izazov) return res.status(404).json({ poruka: 'Izazov nije pronađen.' });

    const danas = pocetakDana(new Date());
    if (izazov.sudionici.length > 0 && (!izazov.ljestvicaAzurirana || izazov.ljestvicaAzurirana < danas)) {
      await azurirajBodoveZaIzazov(izazov);
    }

    const korisniciIds = izazov.sudionici.map(s => s.korisnikId);
    const korisnici = await Korisnik.find({ _id: { $in: korisniciIds } }).select('ime slika strava.profilnaSlika');

    if (izazov.vrsta !== 'tim') {
      const ljestvica = izazov.sudionici
        .map(sudionik => {
          const korisnik = korisnici.find(k => k._id.equals(sudionik.korisnikId));
          if (!korisnik) return null;

          return {
            korisnikId: korisnik._id,
            ime: korisnik.ime,
            slika: korisnik.slika || korisnik.strava?.profilnaSlika || null,
            bodovi: sudionik.bodovi,
            status: sudionik.status,
            eliminiranDatum: sudionik.eliminiranDatum,
          };
        })
        .filter(Boolean)
        .sort((a, b) => {
          if (a.status !== b.status) return a.status === 'aktivan' ? -1 : 1;
          return b.bodovi - a.bodovi;
        });

      return res.json({ ljestvica, azurirana: izazov.ljestvicaAzurirana });
    }

    const timovi = izazov.timovi
      .map(tim => {
        const clanovi = izazov.sudionici
          .filter(s => s.timId && String(s.timId) === String(tim._id))
          .map(s => {
            const korisnik = korisnici.find(k => k._id.equals(s.korisnikId));
            if (!korisnik) return null;
            return {
              korisnikId: korisnik._id,
              ime: korisnik.ime,
              slika: korisnik.slika || korisnik.strava?.profilnaSlika || null,
              bodovi: s.bodovi,
              status: s.status,
              eliminiranDatum: s.eliminiranDatum,
            };
          })
          .filter(Boolean);
        const bodovi = clanovi.reduce((zbroj, c) => zbroj + c.bodovi, 0);
        return { timId: tim._id, naziv: tim.naziv, bodovi, clanovi };
      })
      .sort((a, b) => b.bodovi - a.bodovi);

    res.json({ timovi, azurirana: izazov.ljestvicaAzurirana });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri dohvaćanju ljestvice.', error: err.message });
  }
};

export async function azurirajBodoveZaIzazov(izazov) {
  const korisniciIds = izazov.sudionici.map(s => s.korisnikId);
  const korisnici = await Korisnik.find({ _id: { $in: korisniciIds } }).select('aktivnosti');

  izazov.sudionici.forEach(sudionik => {
    const korisnik = korisnici.find(k => k._id.equals(sudionik.korisnikId));
    if (!korisnik) return;

    const odDatuma = sudionik.datumPridruzivanja > izazov.pocetak ? sudionik.datumPridruzivanja : izazov.pocetak;
    const rezultat = izazov.nacin === 'dnevno'
      ? izracunajDnevno(korisnik, izazov, odDatuma)
      : izracunajKumulativno(korisnik, izazov, odDatuma);

    sudionik.bodovi = rezultat.bodovi;
    sudionik.status = rezultat.status;
    sudionik.eliminiranDatum = rezultat.eliminiranDatum;
  });

  izazov.ljestvicaAzurirana = new Date();
  await izazov.save();
}

export const osvjeziLjestvicu = async (req, res) => {
  try {
    const izazov = await Izazov.findById(req.params.id);
    if (!izazov) return res.status(404).json({ poruka: 'Izazov nije pronađen.' });

    await azurirajBodoveZaIzazov(izazov);

    res.json({ azurirana: izazov.ljestvicaAzurirana });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri osvježavanju ljestvice.', error: err.message });
  }
};

export const dohvatiSudionikDetalje = async (req, res) => {
  try {
    const izazov = await Izazov.findById(req.params.id);
    if (!izazov) return res.status(404).json({ poruka: 'Izazov nije pronađen.' });

    const sudionik = izazov.sudionici.find(s => String(s.korisnikId) === req.params.korisnikId);
    if (!sudionik) return res.status(404).json({ poruka: 'Sudionik nije pronađen u ovom izazovu.' });

    const korisnik = await Korisnik.findById(sudionik.korisnikId).select('ime slika strava.profilnaSlika aktivnosti');
    if (!korisnik) return res.status(404).json({ poruka: 'Korisnik ne postoji.' });

    const odDatuma = sudionik.datumPridruzivanja > izazov.pocetak ? sudionik.datumPridruzivanja : izazov.pocetak;
    const rezultat = izazov.nacin === 'dnevno'
      ? izracunajDnevno(korisnik, izazov, odDatuma)
      : izracunajKumulativno(korisnik, izazov, odDatuma);

    res.json({
      korisnikId: korisnik._id,
      ime: korisnik.ime,
      slika: korisnik.slika || korisnik.strava?.profilnaSlika || null,
      datumPridruzivanja: sudionik.datumPridruzivanja,
      nacin: izazov.nacin,
      ...rezultat,
    });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri dohvaćanju detalja.', error: err.message });
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
