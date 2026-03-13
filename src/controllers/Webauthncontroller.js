import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import jwt from 'jsonwebtoken';
import Korisnik from '../models/korisnik.js';

const RP_NAME = 'Teretana Inspector';
const RP_ID = process.env.RP_ID || 'localhost';
const ORIGIN = process.env.FRONTEND_URL || 'http://localhost:5173';

const generirajToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

export const dohvatiOpcijePrijavom = async (req, res) => {
  try {
    const { email } = req.body;

    const korisnik = await Korisnik.findOne({ email });
    if (!korisnik) {
      return res.status(404).json({ poruka: 'Korisnik nije pronađen.' });
    }

    if (!korisnik.autentifikatori || korisnik.autentifikatori.length === 0) {
      return res.status(400).json({ poruka: 'Face ID nije postavljen za ovaj račun.' });
    }

    const opcije = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials: korisnik.autentifikatori.map((aut) => ({
        id: aut.credentialID,
        transports: aut.transports,
      })),
      userVerification: 'preferred',
    });

    korisnik.webauthnChallenge = opcije.challenge;
    await korisnik.save({ validateBeforeSave: false });

    res.json(opcije);
  } catch (error) {
    console.log(error);
    res.status(500).json({ poruka: 'Greška na serveru.', error: error.message });
  }
};

export const provjeriPrijavu = async (req, res) => {
  try {
    const { email, odgovor } = req.body;

    const korisnik = await Korisnik.findOne({ email });
    if (!korisnik) {
      return res.status(404).json({ poruka: 'Korisnik nije pronađen.' });
    }

    const autentifikator = korisnik.autentifikatori.find(
      (aut) => aut.credentialID === odgovor.id
    );

    if (!autentifikator) {
      return res.status(400).json({ poruka: 'Uređaj nije prepoznat.' });
    }

    const provjera = await verifyAuthenticationResponse({
      response: odgovor,
      expectedChallenge: korisnik.webauthnChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: autentifikator.credentialID,
        publicKey: Buffer.from(autentifikator.credentialPublicKey, 'base64'),
        counter: autentifikator.counter,
        transports: autentifikator.transports,
      },
    });

    if (!provjera.verified) {
      return res.status(401).json({ poruka: 'Face ID provjera neuspješna.' });
    }

    autentifikator.counter = provjera.authenticationInfo.newCounter;
    korisnik.webauthnChallenge = undefined;
    await korisnik.save({ validateBeforeSave: false });

    const token = generirajToken(korisnik._id);

    res.json({
      token,
      korisnik: {
        id: korisnik._id,
        ime: korisnik.ime,
        email: korisnik.email,
        uloga: korisnik.uloga,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ poruka: 'Greška na serveru.', error: error.message });
  }
};

export const dohvatiOpcijeRegistracije = async (req, res) => {
  try {
    const korisnik = req.korisnik;

    const opcije = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: new TextEncoder().encode(korisnik._id.toString()),
      userName: korisnik.email,
      userDisplayName: korisnik.ime,
      attestationType: 'none',
      excludeCredentials: korisnik.autentifikatori.map((aut) => ({
        id: aut.credentialID,
        transports: aut.transports,
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform',
      },
    });

    korisnik.webauthnChallenge = opcije.challenge;
    await korisnik.save({ validateBeforeSave: false });

    res.json(opcije);
  } catch (error) {
    console.log(error);
    res.status(500).json({ poruka: 'Greška na serveru.', error: error.message });
  }
};

export const provjeriRegistraciju = async (req, res) => {
  try {
    const { odgovor } = req.body;
    const korisnik = req.korisnik;

    const provjera = await verifyRegistrationResponse({
      response: odgovor,
      expectedChallenge: korisnik.webauthnChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
    });

    if (!provjera.verified) {
      return res.status(400).json({ poruka: 'Registracija uređaja neuspješna.' });
    }

    const { credential } = provjera.registrationInfo;

    korisnik.autentifikatori.push({
      credentialID: credential.id,
      credentialPublicKey: Buffer.from(credential.publicKey).toString('base64'),
      counter: credential.counter,
      deviceType: provjera.registrationInfo.credentialDeviceType,
      backedUp: provjera.registrationInfo.credentialBackedUp,
      transports: odgovor.response.transports ?? [],
    });

    korisnik.webauthnChallenge = undefined;
    await korisnik.save({ validateBeforeSave: false });

    res.json({ poruka: 'Face ID uspješno postavljen!' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ poruka: 'Greška na serveru.', error: error.message });
  }
};