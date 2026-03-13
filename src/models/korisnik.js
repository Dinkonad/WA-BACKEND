import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const korisnikSchema = new mongoose.Schema(
  {
    ime: {
      type: String,
      required: [true, 'Ime je obavezno'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email je obavezan'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    lozinka: {
      type: String,
      required: [true, 'Lozinka je obavezna'],
      minlength: [6, 'Lozinka mora imati najmanje 6 znakova'],
    },
    uloga: {
      type: String,
      enum: ['korisnik', 'admin'],
      default: 'korisnik',
    },
  },
  { timestamps: true }
);

korisnikSchema.pre('save', async function () {
  if (!this.isModified('lozinka')) return;
  this.lozinka = await bcrypt.hash(this.lozinka, 12);
});

korisnikSchema.methods.provjeriLozinku = async function (unesenaLozinka) {
  return await bcrypt.compare(unesenaLozinka, this.lozinka);
};

const Korisnik = mongoose.model('Korisnik', korisnikSchema);

export default Korisnik;