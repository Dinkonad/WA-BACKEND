import mongoose from 'mongoose';

export const poveziNaBazu = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Spojeno na MongoDB');
  } catch (error) {
    console.error('Greška pri spajanju na bazu:', error.message);
    process.exit(1);
  }
};