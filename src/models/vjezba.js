import mongoose from 'mongoose';

const vjezbaSchema = new mongoose.Schema(
  {
    naziv: { type: String, required: true, trim: true },
    kategorija: {
      type: String,
      required: true,
      enum: ['prsa', 'leđa', 'ramena', 'biceps', 'triceps', 'noge', 'stomak', 'kardio'],
    },
    razina: { type: String, required: true, enum: ['pocetnik', 'amater', 'pro'] },
    opis: { type: String, trim: true },
    video: { type: String, trim: true },
    serije: { type: Number },
    ponavljanja: { type: String, trim: true },
    kilaza: { type: String, trim: true },
    pauza: { type: Number },
    kreiraoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Korisnik' },
  },
  { timestamps: true }
);

vjezbaSchema.index({ kategorija: 1, razina: 1 });

const Vjezba = mongoose.model('Vjezba', vjezbaSchema);
export default Vjezba;
