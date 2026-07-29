import mongoose from 'mongoose';

const receptSchema = new mongoose.Schema(
  {
    naziv: { type: String, required: true, trim: true },
    slika: { type: String, trim: true },
    porcije: { type: String, trim: true },
    sastojci: { type: String, required: true, trim: true },
    priprema: { type: String, required: true, trim: true },
    kalorije: { type: String, trim: true },
    proteini: { type: String, trim: true },
    ugljikohidrati: { type: String, trim: true },
    masti: { type: String, trim: true },
    kreiraoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Korisnik' },
  },
  { timestamps: true }
);

const Recept = mongoose.model('Recept', receptSchema);
export default Recept;
