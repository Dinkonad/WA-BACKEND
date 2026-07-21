import mongoose from 'mongoose';

const uvjetSchema = new mongoose.Schema({
  tip: { type: String, required: true },
  mjera: { type: String, enum: ['km', 'vrijeme', 'kalorije', 'broj', 'elevacija'], required: true },
  cilj: { type: Number, required: true },
  bodovi: { type: Number, required: true },
}, { _id: false });

const timSchema = new mongoose.Schema({
  naziv: { type: String, required: true, trim: true },
  kapetan: { type: mongoose.Schema.Types.ObjectId, ref: 'Korisnik', required: true },
  clanovi: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Korisnik' }],
}, { timestamps: true });

const sudionikSchema = new mongoose.Schema({
  korisnikId: { type: mongoose.Schema.Types.ObjectId, ref: 'Korisnik', required: true },
  timId: { type: mongoose.Schema.Types.ObjectId },
  datumPridruzivanja: { type: Date, default: Date.now },
  bodovi: { type: Number, default: 0 },
  status: { type: String, enum: ['aktivan', 'eliminiran'], default: 'aktivan' },
  eliminiranDatum: { type: Date, default: null },
}, { _id: false });

const izazovSchema = new mongoose.Schema(
  {
    naziv: { type: String, required: [true, 'Naziv je obavezan'], trim: true },
    opis: { type: String, trim: true },
    vrsta: { type: String, enum: ['solo', 'tim'], required: true },
    nacin: { type: String, enum: ['kumulativno', 'dnevno'], default: 'kumulativno' },
    pocetak: { type: Date, required: true },
    kraj: { type: Date, required: true },
    uvjeti: {
      type: [uvjetSchema],
      validate: { validator: v => v.length > 0, message: 'Izazov mora imati barem jedan uvjet.' },
    },
    timovi: [timSchema],
    sudionici: [sudionikSchema],
    ljestvicaAzurirana: { type: Date, default: null },
    kreiraoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Korisnik' },
  },
  { timestamps: true }
);

const Izazov = mongoose.model('Izazov', izazovSchema);
export default Izazov;
