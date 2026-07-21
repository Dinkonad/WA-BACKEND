import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const autentifikatorSchema = new mongoose.Schema({
  credentialID: { type: String, required: true },
  credentialPublicKey: { type: String, required: true },
  counter: { type: Number, required: true },
  deviceType: { type: String },
  backedUp: { type: Boolean },
  transports: [{ type: String }],
});

const splitSchema = new mongoose.Schema({
  km: { type: Number },
  trajanje: { type: Number },
  brzina: { type: Number },
  visinskaRazlika: { type: Number },
}, { _id: false });

const rekordSchema = new mongoose.Schema({
  naziv: { type: String },
  trajanje: { type: Number },
  rekord: { type: Number },
}, { _id: false });

const komentarSchema = new mongoose.Schema({
  korisnikId: { type: mongoose.Schema.Types.ObjectId, ref: 'Korisnik' },
  ime: { type: String },
  tekst: { type: String, required: true },
}, { timestamps: true });

const stravaAktivnostSchema = new mongoose.Schema({
  stravaId: { type: String, required: true },
  naziv: { type: String },
  tip: { type: String },
  datum: { type: Date },
  trajanje: { type: Number },
  udaljenost: { type: Number },
  visinskaRazlika: { type: Number },
  prosjecnaBrzina: { type: Number },
  maxBrzina: { type: Number },
  kalorije: { type: Number },
  karta: { type: String },
  polyline: { type: String },
  prosjecniPuls: { type: Number },
  maxPuls: { type: Number },
  elevMax: { type: Number },
  elevMin: { type: Number },
  uredjaj: { type: String },
  splits: [splitSchema],
  rekordi: [rekordSchema],
  detaljiUcitani: { type: Boolean, default: false },
  uFeedu: { type: Boolean, default: false },
  opis: { type: String, maxlength: 500 },
  lajkovi: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Korisnik' }],
  komentari: [komentarSchema],
}, { timestamps: true });

const korisnikSchema = new mongoose.Schema(
  {
    ime: { type: String, required: [true, 'Ime je obavezno'], trim: true },
    email: { type: String, required: [true, 'Email je obavezan'], unique: true, lowercase: true, trim: true },
    lozinka: { type: String, minlength: [6, 'Lozinka mora imati najmanje 6 znakova'] },
    uloga: { type: String, enum: ['korisnik', 'admin', 'knjigovodstvo', 'recepcija'], default: 'korisnik' },
    webauthnChallenge: { type: String },
    autentifikatori: [autentifikatorSchema],
    strava: {
      id: { type: String },
      accessToken: { type: String },
      refreshToken: { type: String },
      tokenIstice: { type: Date },
      profilnaSlika: { type: String },
      grad: { type: String },
      drzava: { type: String },
      spol: { type: String },
      statistike: {
        ukupnoTrcanje: { type: Number, default: 0 },
        ukupnoBicikl: { type: Number, default: 0 },
        ukupnoHodanje: { type: Number, default: 0 },
        zadnjaSync: { type: Date },
      },
    },
    aktivnosti: [stravaAktivnostSchema],
  },
  { timestamps: true }
);

korisnikSchema.index({ 'aktivnosti._id': 1 });

korisnikSchema.pre('save', async function () {
  if (!this.isModified('lozinka') || !this.lozinka) return;
  this.lozinka = await bcrypt.hash(this.lozinka, 12);
});

korisnikSchema.methods.provjeriLozinku = async function (unesenaLozinka) {
  return await bcrypt.compare(unesenaLozinka, this.lozinka);
};

const Korisnik = mongoose.model('Korisnik', korisnikSchema);
export default Korisnik;