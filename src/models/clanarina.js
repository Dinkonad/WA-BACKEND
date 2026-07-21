import mongoose from 'mongoose';

const clanarinaSchema = new mongoose.Schema(
  {
    korisnikId: { type: mongoose.Schema.Types.ObjectId, ref: 'Korisnik', required: true },
    plan: { type: String, enum: ['student', 'basic', 'premium'], required: true },
    period: { type: String, enum: ['mjesecno', 'godisnje'], required: true },
    cijena: { type: Number, required: true },
    imePrezime: { type: String, required: true, trim: true },
    godiste: { type: Number, required: true },
    spol: { type: String, required: true, trim: true },
    broj: { type: String, required: true, trim: true },
    status: { type: String, enum: ['na_cekanju', 'odobreno', 'odbijeno'], default: 'na_cekanju' },
    napomenaOdbijanja: { type: String, trim: true },
    obradioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Korisnik' },
    datumObrade: { type: Date },
  },
  { timestamps: true }
);

const Clanarina = mongoose.model('Clanarina', clanarinaSchema);
export default Clanarina;
