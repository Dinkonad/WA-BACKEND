import 'dotenv/config';
import mongoose from 'mongoose';
import Korisnik from '../models/korisnik.js';

async function kreirajRecepciju() {
  await mongoose.connect(process.env.MONGODB_URI);

  const postoji = await Korisnik.findOne({ email: process.env.RECEPCIJA_EMAIL });
  if (postoji) {
    console.log('Recepcija korisnik već postoji.');
    process.exit(0);
  }

  await Korisnik.create({
    ime: 'Recepcija',
    email: process.env.RECEPCIJA_EMAIL,
    lozinka: process.env.RECEPCIJA_LOZINKA,
    uloga: 'recepcija',
  });

  console.log('Recepcija korisnik kreiran!');
  process.exit(0);
}

kreirajRecepciju().catch((err) => {
  console.error(err);
  process.exit(1);
});
