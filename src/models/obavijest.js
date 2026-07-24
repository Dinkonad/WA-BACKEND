import mongoose from 'mongoose';

const obavijestSchema = new mongoose.Schema(
  {
    tekst: { type: String, required: true, trim: true, maxlength: 500 },
    kreiraoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Korisnik' },
  },
  { timestamps: true }
);

const Obavijest = mongoose.model('Obavijest', obavijestSchema);
export default Obavijest;
