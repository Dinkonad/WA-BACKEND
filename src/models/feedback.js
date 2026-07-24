import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    korisnikId: { type: mongoose.Schema.Types.ObjectId, ref: 'Korisnik', required: true },
    tekst: { type: String, required: true, trim: true, maxlength: 2000 },
    procitano: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Feedback = mongoose.model('Feedback', feedbackSchema);
export default Feedback;
