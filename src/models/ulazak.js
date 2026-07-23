import mongoose from 'mongoose';

const ulazakSchema = new mongoose.Schema(
  {
    korisnikId: { type: mongoose.Schema.Types.ObjectId, ref: 'Korisnik', required: true },
    tip: { type: String, enum: ['ulaz', 'izlaz'], required: true },
  },
  { timestamps: true }
);

ulazakSchema.index({ korisnikId: 1, createdAt: -1 });

const Ulazak = mongoose.model('Ulazak', ulazakSchema);
export default Ulazak;
