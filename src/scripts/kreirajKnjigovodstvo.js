import 'dotenv/config';
import mongoose from 'mongoose';
import Korisnik from '../models/korisnik.js';

async function kreirajKnjigovodstvo() {
  await mongoose.connect(process.env.MONGODB_URI);

  const postoji = await Korisnik.findOne({ email: process.env.KNJIGOVODSTVO_EMAIL });
  if (postoji) {
    console.log('Knjigovodstvo korisnik već postoji.');
    process.exit(0);
  }

  await Korisnik.create({
    ime: 'Knjigovodstvo',
    email: process.env.KNJIGOVODSTVO_EMAIL,
    lozinka: process.env.KNJIGOVODSTVO_LOZINKA,
    uloga: 'knjigovodstvo',
  });

  console.log('Knjigovodstvo korisnik kreiran!');
  process.exit(0);
}

kreirajKnjigovodstvo().catch((err) => {
  console.error(err);
  process.exit(1);
});
