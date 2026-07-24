import jwt from 'jsonwebtoken';
import Clanarina from '../models/clanarina.js';
import Korisnik from '../models/korisnik.js';
import Ulazak from '../models/ulazak.js';
import Financija from '../models/financija.js';

const DNEVNI_LIMIT_ULAZAKA = 2;

function pocetakDana() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

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

const TRAJANJE_DANA = 30;

export const dohvatiMojZahtjev = async (req, res) => {
  try {
    const zahtjev = await Clanarina.findOne({ korisnikId: req.korisnik._id }).sort({ createdAt: -1 });

    let vrijediDo = null;
    let istekla = false;

    if (zahtjev && zahtjev.status === 'odobreno' && zahtjev.datumObrade) {
      vrijediDo = new Date(zahtjev.datumObrade);
      vrijediDo.setDate(vrijediDo.getDate() + TRAJANJE_DANA);
      istekla = new Date() > vrijediDo;
    }

    res.json({ zahtjev, vrijediDo, istekla });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri dohvaćanju zahtjeva.', error: err.message });
  }
};

export const dohvatiMojePovijestClanarina = async (req, res) => {
  try {
    const zahtjevi = await Clanarina.find({ korisnikId: req.korisnik._id }).sort({ createdAt: -1 });
    res.json({ zahtjevi });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri dohvaćanju povijesti.', error: err.message });
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

    await Financija.create({
      vrsta: 'prihod',
      kategorija: 'Članarina',
      ime: zahtjev.imePrezime,
      iznos: zahtjev.cijena,
      opis: `${zahtjev.plan.toUpperCase()} · ${zahtjev.period === 'godisnje' ? 'godišnje' : 'mjesečno'}`,
      datum: zahtjev.datumObrade,
      automatski: true,
      clanarinaId: zahtjev._id,
      kreiraoId: req.korisnik._id,
    });

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

export const dohvatiQrKod = async (req, res) => {
  try {
    const zahtjev = await Clanarina.findOne({ korisnikId: req.korisnik._id }).sort({ createdAt: -1 });

    if (!zahtjev || zahtjev.status !== 'odobreno' || !zahtjev.datumObrade) {
      return res.json({ token: null });
    }

    const vrijediDo = new Date(zahtjev.datumObrade);
    vrijediDo.setDate(vrijediDo.getDate() + TRAJANJE_DANA);

    if (new Date() > vrijediDo) {
      return res.json({ token: null });
    }

    const token = jwt.sign(
      { korisnikId: String(req.korisnik._id), zahtjevId: String(zahtjev._id) },
      process.env.JWT_SECRET,
      { expiresIn: Math.floor((vrijediDo.getTime() - Date.now()) / 1000) }
    );

    res.json({ token, vrijediDo });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri generiranju QR koda.', error: err.message });
  }
};

export const provjeriQrKod = async (req, res) => {
  try {
    const { token, tip } = req.body;
    if (!token) return res.status(400).json({ validno: false, poruka: 'Nedostaje kod.' });
    if (!['ulaz', 'izlaz'].includes(tip)) {
      return res.status(400).json({ validno: false, poruka: 'Nedostaje tip prolaska (ulaz/izlaz).' });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.json({ validno: false, poruka: 'QR kod je istekao ili nije valjan.' });
    }

    if (!payload.zahtjevId) {
      return res.json({ validno: false, poruka: 'QR kod nije valjan.' });
    }

    const zahtjev = await Clanarina.findById(payload.zahtjevId);
    if (!zahtjev || zahtjev.status !== 'odobreno') {
      return res.json({ validno: false, poruka: 'Članarina više nije aktivna.' });
    }

    const vrijediDo = new Date(zahtjev.datumObrade);
    vrijediDo.setDate(vrijediDo.getDate() + TRAJANJE_DANA);
    if (new Date() > vrijediDo) {
      return res.json({ validno: false, poruka: 'Članarina je istekla.' });
    }

    const danasnji = await Ulazak.find({
      korisnikId: payload.korisnikId,
      createdAt: { $gte: pocetakDana() },
    }).sort({ createdAt: 1 });

    const zadnji = danasnji[danasnji.length - 1] || null;
    const brojUlazaka = danasnji.filter(u => u.tip === 'ulaz').length;
    const brojIzlazaka = danasnji.filter(u => u.tip === 'izlaz').length;

    if (tip === 'ulaz') {
      if (zadnji?.tip === 'ulaz') {
        return res.json({ validno: false, poruka: 'Član je već evidentiran kao "u teretani". Prvo skeniraj izlazak.' });
      }
      if (brojUlazaka >= DNEVNI_LIMIT_ULAZAKA) {
        return res.json({ validno: false, poruka: `Iskorišten dnevni limit od ${DNEVNI_LIMIT_ULAZAKA} ulaska.` });
      }
    } else {
      if (!zadnji || zadnji.tip !== 'ulaz') {
        return res.json({ validno: false, poruka: 'Član nije evidentiran kao da je u teretani danas.' });
      }
      if (brojIzlazaka >= DNEVNI_LIMIT_ULAZAKA) {
        return res.json({ validno: false, poruka: `Iskorišten dnevni limit od ${DNEVNI_LIMIT_ULAZAKA} izlaska.` });
      }
    }

    await Ulazak.create({ korisnikId: payload.korisnikId, tip });

    const korisnik = await Korisnik.findById(payload.korisnikId).select('ime strava.profilnaSlika');

    res.json({
      validno: true,
      tip,
      ime: korisnik?.ime || zahtjev.imePrezime,
      slika: korisnik?.strava?.profilnaSlika || null,
      plan: zahtjev.plan,
      vrijediDo,
      brojDanas: tip === 'ulaz' ? brojUlazaka + 1 : brojIzlazaka + 1,
      limitDanas: DNEVNI_LIMIT_ULAZAKA,
    });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri provjeri QR koda.', error: err.message });
  }
};

export const dohvatiBrojUTeretani = async (req, res) => {
  try {
    const danasnji = await Ulazak.find({ createdAt: { $gte: pocetakDana() } }).sort({ createdAt: 1 });
    const zadnjiPoKorisniku = new Map();
    for (const u of danasnji) {
      zadnjiPoKorisniku.set(String(u.korisnikId), u.tip);
    }
    const broj = [...zadnjiPoKorisniku.values()].filter(tip => tip === 'ulaz').length;
    res.json({ broj });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri dohvaćanju broja.', error: err.message });
  }
};

export const dohvatiTrenutnoUTeretani = async (req, res) => {
  try {
    const danasnji = await Ulazak.find({ createdAt: { $gte: pocetakDana() } }).sort({ createdAt: 1 });
    const zadnjiPoKorisniku = new Map();
    for (const u of danasnji) {
      zadnjiPoKorisniku.set(String(u.korisnikId), u);
    }

    const unutraIds = [...zadnjiPoKorisniku.entries()]
      .filter(([, u]) => u.tip === 'ulaz')
      .map(([korisnikId, u]) => ({ korisnikId, vrijemeUlaska: u.createdAt }));

    const korisnici = await Korisnik.find({ _id: { $in: unutraIds.map(u => u.korisnikId) } }).select('ime strava.profilnaSlika');

    const lista = unutraIds
      .map(({ korisnikId, vrijemeUlaska }) => {
        const korisnik = korisnici.find(k => String(k._id) === korisnikId);
        if (!korisnik) return null;
        return { korisnikId, ime: korisnik.ime, slika: korisnik.strava?.profilnaSlika || null, vrijemeUlaska };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.vrijemeUlaska) - new Date(a.vrijemeUlaska));

    res.json({ lista, broj: lista.length });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri dohvaćanju popisa.', error: err.message });
  }
};

function zadnjiZahtjevPoKorisniku(zahtjevi) {
  const mapa = new Map();
  for (const z of zahtjevi) {
    const kId = String(z.korisnikId?._id || z.korisnikId);
    if (!mapa.has(kId)) mapa.set(kId, z);
  }
  return mapa;
}

export const dohvatiRetenciju = async (req, res) => {
  try {
    const svi = await Clanarina.find()
      .populate('korisnikId', 'ime email')
      .sort({ createdAt: -1 });

    const zadnji = zadnjiZahtjevPoKorisniku(svi);
    const sada = new Date();

    let aktivnih = 0;
    let istekli = 0;
    let naCekanju = 0;
    const churnLista = [];

    for (const z of zadnji.values()) {
      if (z.status === 'na_cekanju') {
        naCekanju++;
        continue;
      }
      if (z.status !== 'odobreno' || !z.datumObrade) continue;

      const vrijediDo = new Date(z.datumObrade);
      vrijediDo.setDate(vrijediDo.getDate() + TRAJANJE_DANA);

      if (sada > vrijediDo) {
        istekli++;
        const danaOdIsteka = Math.floor((sada.getTime() - vrijediDo.getTime()) / (1000 * 60 * 60 * 24));
        churnLista.push({
          ime: z.korisnikId?.ime || z.imePrezime,
          email: z.korisnikId?.email || null,
          plan: z.plan,
          period: z.period,
          istekaoDatum: vrijediDo,
          danaOdIsteka,
        });
      } else {
        aktivnih++;
      }
    }

    churnLista.sort((a, b) => b.danaOdIsteka - a.danaOdIsteka);

    res.json({ aktivnih, istekli, naCekanju, churnLista });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri dohvaćanju retencije.', error: err.message });
  }
};

const PROZOR_ISKORISTENOSTI_DANA = 30;

export const dohvatiIskoristenost = async (req, res) => {
  try {
    const odobreni = await Clanarina.find({ status: 'odobreno' }).sort({ createdAt: -1 });
    const zadnji = zadnjiZahtjevPoKorisniku(odobreni);
    const sada = new Date();

    const poPlanu = {};
    for (const z of zadnji.values()) {
      if (!z.datumObrade) continue;
      const vrijediDo = new Date(z.datumObrade);
      vrijediDo.setDate(vrijediDo.getDate() + TRAJANJE_DANA);
      if (sada > vrijediDo) continue;

      if (!poPlanu[z.plan]) poPlanu[z.plan] = { korisnici: [], ukupnaCijena: 0 };
      poPlanu[z.plan].korisnici.push(String(z.korisnikId));
      poPlanu[z.plan].ukupnaCijena += z.cijena;
    }

    const odVremena = new Date(sada.getTime() - PROZOR_ISKORISTENOSTI_DANA * 24 * 60 * 60 * 1000);
    const ulasci = await Ulazak.find({ createdAt: { $gte: odVremena } }).select('korisnikId');
    const ulazakPoKorisniku = {};
    for (const u of ulasci) {
      const kId = String(u.korisnikId);
      ulazakPoKorisniku[kId] = (ulazakPoKorisniku[kId] || 0) + 1;
    }

    const podaciPoPlanu = Object.entries(poPlanu).map(([plan, info]) => {
      const brojClanova = info.korisnici.length;
      const ukupnoUlazaka = info.korisnici.reduce((s, kId) => s + (ulazakPoKorisniku[kId] || 0), 0);
      const cijenaPoPosjeti = ukupnoUlazaka > 0 ? info.ukupnaCijena / ukupnoUlazaka : null;

      return {
        plan,
        brojClanova,
        ukupnoUlazaka,
        prosjecnoUlazakaPoClanu: brojClanova ? Math.round((ukupnoUlazaka / brojClanova) * 10) / 10 : 0,
        cijenaPoPosjeti: cijenaPoPosjeti !== null ? Math.round(cijenaPoPosjeti * 100) / 100 : null,
      };
    });

    const ukupnoClanova = podaciPoPlanu.reduce((s, p) => s + p.brojClanova, 0);
    const ukupnoUlazaka = podaciPoPlanu.reduce((s, p) => s + p.ukupnoUlazaka, 0);
    const ukupnaCijenaSvih = Object.values(poPlanu).reduce((s, info) => s + info.ukupnaCijena, 0);
    const prosjecnaCijenaPoPosjeti = ukupnoUlazaka > 0 ? Math.round((ukupnaCijenaSvih / ukupnoUlazaka) * 100) / 100 : null;

    res.json({ podaciPoPlanu, ukupnoClanova, ukupnoUlazaka, prosjecnaCijenaPoPosjeti, prozorDana: PROZOR_ISKORISTENOSTI_DANA });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri dohvaćanju iskorištenosti.', error: err.message });
  }
};

export const obrisiZahtjev = async (req, res) => {
  try {
    const zahtjev = await Clanarina.findByIdAndDelete(req.params.id);
    if (!zahtjev) return res.status(404).json({ poruka: 'Zahtjev nije pronađen.' });
    res.json({ poruka: 'Zahtjev obrisan.' });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri brisanju.', error: err.message });
  }
};
