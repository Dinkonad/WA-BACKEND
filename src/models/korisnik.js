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
}, { timestamps: true });

const korisnikSchema = new mongoose.Schema(
  {
    ime: { type: String, required: [true, 'Ime je obavezno'], trim: true },
    email: { type: String, required: [true, 'Email je obavezan'], unique: true, lowercase: true, trim: true },
    lozinka: { type: String, minlength: [6, 'Lozinka mora imati najmanje 6 znakova'] },
    uloga: { type: String, enum: ['korisnik', 'admin'], default: 'korisnik' },
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

korisnikSchema.pre('save', async function () {
  if (!this.isModified('lozinka') || !this.lozinka) return;
  this.lozinka = await bcrypt.hash(this.lozinka, 12);
});

korisnikSchema.methods.provjeriLozinku = async function (unesenaLozinka) {
  return await bcrypt.compare(unesenaLozinka, this.lozinka);
};

const Korisnik = mongoose.model('Korisnik', korisnikSchema);
export default Korisnik;