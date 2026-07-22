import mongoose from 'mongoose';

const financijaSchema = new mongoose.Schema(
  {
    vrsta: { type: String, enum: ['prihod', 'rashod'], required: true },
    kategorija: { type: String, required: true, trim: true },
    ime: { type: String, required: true, trim: true },
    iznos: { type: Number, required: true },
    opis: { type: String, trim: true },
    datum: { type: Date, required: true },
    automatski: { type: Boolean, default: false },
    clanarinaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clanarina' },
    kreiraoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Korisnik' },
  },
  { timestamps: true }
);

financijaSchema.index({ vrsta: 1, datum: -1 });

const Financija = mongoose.model('Financija', financijaSchema);
export default Financija;
