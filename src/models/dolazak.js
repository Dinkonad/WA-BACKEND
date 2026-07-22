import mongoose from 'mongoose';

const dolazakSchema = new mongoose.Schema(
  {
    korisnikId: { type: mongoose.Schema.Types.ObjectId, ref: 'Korisnik', required: true },
    datum: { type: String, required: true },
    vrijemeUlaska: { type: Date, required: true },
    vrijemeIzlaska: { type: Date, default: null },
  },
  { timestamps: true }
);

dolazakSchema.index({ korisnikId: 1, datum: 1 });

const Dolazak = mongoose.model('Dolazak', dolazakSchema);
export default Dolazak;
