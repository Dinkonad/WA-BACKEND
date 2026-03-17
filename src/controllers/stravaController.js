import axios from 'axios';
import jwt from 'jsonwebtoken';
import Korisnik from '../models/korisnik.js';

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const REDIRECT_URI = process.env.STRAVA_REDIRECT_URI;
const FRONTEND_URL = process.env.FRONTEND_URL;

const generirajToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });


const osvjeziTokenAkoTreba = async (korisnik) => {
  if (!korisnik.strava?.refreshToken) return korisnik;
  const sad = new Date();
  if (korisnik.strava.tokenIstice && korisnik.strava.tokenIstice > sad) return korisnik;

  const odgovor = await axios.post('https://www.strava.com/oauth/token', {
    client_id: STRAVA_CLIENT_ID,
    client_secret: STRAVA_CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: korisnik.strava.refreshToken,
  });

  korisnik.strava.accessToken = odgovor.data.access_token;
  korisnik.strava.refreshToken = odgovor.data.refresh_token;
  korisnik.strava.tokenIstice = new Date(odgovor.data.expires_at * 1000);
  await korisnik.save({ validateBeforeSave: false });
  return korisnik;
};

export const preusmjeriNaStravu = (req, res) => {
  const scope = 'read,activity:read_all,profile:read_all';
  const url = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${scope}`;
  res.redirect(url);
};

export const stravaCallback = async (req, res) => {
  const { code, error } = req.query;

  if (error || !code) {
    return res.redirect(`${FRONTEND_URL}/odabir-prijave?greska=strava_odbijeno`);
  }

  try {

    const tokenOdgovor = await axios.post('https://www.strava.com/oauth/token', {
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    });

    const { access_token, refresh_token, expires_at, athlete } = tokenOdgovor.data;

    let korisnik = await Korisnik.findOne({ 'strava.id': String(athlete.id) });

    if (!korisnik) {
      const email = athlete.email || `strava_${athlete.id}@teretana-inspector.app`;
      korisnik = await Korisnik.findOne({ email });

      if (!korisnik) {
        korisnik = await Korisnik.create({
          ime: `${athlete.firstname} ${athlete.lastname}`,
          email,
          lozinka: Math.random().toString(36) + Math.random().toString(36),
          uloga: 'korisnik',
          strava: {
            id: String(athlete.id),
            accessToken: access_token,
            refreshToken: refresh_token,
            tokenIstice: new Date(expires_at * 1000),
            profilnaSlika: athlete.profile,
            grad: athlete.city,
            drzava: athlete.country,
            spol: athlete.sex,
            statistike: { zadnjaSync: new Date() },
          },
        });
      } else {
        korisnik.strava = {
          id: String(athlete.id),
          accessToken: access_token,
          refreshToken: refresh_token,
          tokenIstice: new Date(expires_at * 1000),
          profilnaSlika: athlete.profile,
          grad: athlete.city,
          drzava: athlete.country,
          spol: athlete.sex,
          statistike: korisnik.strava?.statistike || { zadnjaSync: new Date() },
        };
        if (!korisnik.ime || korisnik.ime === '') {
          korisnik.ime = `${athlete.firstname} ${athlete.lastname}`;
        }
        await korisnik.save({ validateBeforeSave: false });
      }
    } else {
    
      korisnik.strava.accessToken = access_token;
      korisnik.strava.refreshToken = refresh_token;
      korisnik.strava.tokenIstice = new Date(expires_at * 1000);
      korisnik.strava.profilnaSlika = athlete.profile;
      await korisnik.save({ validateBeforeSave: false });
    }


    sinkronizirajAktivnosti(korisnik._id, access_token).catch(console.error);

    const token = generirajToken(korisnik._id);
    return res.redirect(`${FRONTEND_URL}/dashboard?token=${token}`);
  } catch (err) {
    console.error('Strava callback greška:', err.response?.data || err.message);
    return res.redirect(`${FRONTEND_URL}/odabir-prijave?greska=strava_greska`);
  }
};


const sinkronizirajAktivnosti = async (korisnikId, accessToken) => {
  try {
    const korisnik = await Korisnik.findById(korisnikId);
    if (!korisnik) return;

    const osvjezeni = await osvjeziTokenAkoTreba(korisnik);
    const token = osvjezeni.strava.accessToken || accessToken;

  
    const odgovor = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
      headers: { Authorization: `Bearer ${token}` },
      params: { per_page: 100, page: 1 },
    });

    const aktivnosti = odgovor.data;

    for (const akt of aktivnosti) {
      const postoji = korisnik.aktivnosti.some(a => a.stravaId === String(akt.id));
      if (postoji) continue;

      korisnik.aktivnosti.push({
        stravaId: String(akt.id),
        naziv: akt.name,
        tip: akt.type,
        datum: new Date(akt.start_date),
        trajanje: akt.moving_time,
        udaljenost: akt.distance,
        visinskaRazlika: akt.total_elevation_gain,
        prosjecnaBrzina: akt.average_speed,
        maxBrzina: akt.max_speed,
        kalorije: akt.calories,
        polyline: akt.map?.summary_polyline || '',
        karta: akt.map?.summary_polyline
          ? `https://maps.googleapis.com/maps/api/staticmap?size=600x300&path=enc:${encodeURIComponent(akt.map.summary_polyline)}`
          : '',
      });
    }


    const trcanje = aktivnosti.filter(a => a.type === 'Run').reduce((s, a) => s + a.distance, 0);
    const bicikl = aktivnosti.filter(a => a.type === 'Ride').reduce((s, a) => s + a.distance, 0);
    const hodanje = aktivnosti.filter(a => a.type === 'Walk' || a.type === 'Hike').reduce((s, a) => s + a.distance, 0);

    korisnik.strava.statistike = {
      ukupnoTrcanje: Math.round(trcanje / 1000),
      ukupnoBicikl: Math.round(bicikl / 1000),
      ukupnoHodanje: Math.round(hodanje / 1000),
      zadnjaSync: new Date(),
    };

    await korisnik.save({ validateBeforeSave: false });
  } catch (err) {
    console.error('Greška pri sinkronizaciji aktivnosti:', err.message);
  }
};


export const pokreniSync = async (req, res) => {
  try {
    const korisnik = await Korisnik.findById(req.korisnik._id);
    if (!korisnik?.strava?.accessToken) {
      return res.status(400).json({ poruka: 'Strava nije spojena.' });
    }
    await sinkronizirajAktivnosti(korisnik._id, korisnik.strava.accessToken);
    const osvjezeni = await Korisnik.findById(korisnik._id);
    res.json({
      poruka: 'Sinkronizacija uspješna!',
      ukupnoAktivnosti: osvjezeni.aktivnosti.length,
      statistike: osvjezeni.strava.statistike,
    });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška pri sinkronizaciji.', error: err.message });
  }
};

export const dohvatiAktivnosti = async (req, res) => {
  try {
    const korisnik = await Korisnik.findById(req.korisnik._id);
    const stranica = parseInt(req.query.stranica) || 1;
    const velicina = parseInt(req.query.velicina) || 20;
    const pocetak = (stranica - 1) * velicina;

    const sortirane = [...korisnik.aktivnosti]
      .sort((a, b) => new Date(b.datum) - new Date(a.datum))
      .slice(pocetak, pocetak + velicina);

    res.json({
      aktivnosti: sortirane,
      ukupno: korisnik.aktivnosti.length,
      statistike: korisnik.strava?.statistike,
      stravaSpojeno: !!korisnik.strava?.id,
    });
  } catch (err) {
    res.status(500).json({ poruka: 'Greška.', error: err.message });
  }
};