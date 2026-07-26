import mongoose from 'mongoose';

const treningZavrsetakSchema = new mongoose.Schema(
  {
    korisnikId: { type: mongoose.Schema.Types.ObjectId, ref: 'Korisnik', required: true },
    treningId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trening', required: true },
    datum: { type: Date, required: true },
  },
  { timestamps: true }
);

treningZavrsetakSchema.index({ korisnikId: 1, treningId: 1, datum: 1 });

const TreningZavrsetak = mongoose.model('TreningZavrsetak', treningZavrsetakSchema);
export default TreningZavrsetak;
