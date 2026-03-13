import 'dotenv/config';
import mongoose from 'mongoose';
import Korisnik from '../models/korisnik.js';

async function kreirajAdmin() {
  await mongoose.connect(process.env.MONGODB_URI);

  const postojiAdmin = await Korisnik.findOne({ email: process.env.ADMIN_EMAIL });
  if (postojiAdmin) {
    console.log('Admin već postoji.');
    process.exit(0);
  }

  await Korisnik.create({
    ime: 'Admin',
    email: process.env.ADMIN_EMAIL,
    lozinka: process.env.ADMIN_LOZINKA,
    uloga: 'admin',
  });

  console.log('Admin kreiran!');
  process.exit(0);
}

kreirajAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});