import mongoose from 'mongoose';

const treningSchema = new mongoose.Schema(
  {
    naziv: { type: String, required: true, trim: true },
    opis: { type: String, trim: true },
    nacinIzvodjenja: { type: String, enum: ['redom', 'kruzno'], default: 'redom' },
    vjezbe: [
      {
        vjezbaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vjezba', required: true },
        pauza: { type: Number },
      },
    ],
    kreiraoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Korisnik' },
  },
  { timestamps: true }
);

const Trening = mongoose.model('Trening', treningSchema);
export default Trening;
