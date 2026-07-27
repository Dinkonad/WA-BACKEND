import Izazov from '../models/izazov.js';
import { azurirajBodoveZaIzazov } from '../controllers/izazovController.js';

const SAT_POKRETANJA = 0;
const MINUTA_POKRETANJA = 5;

async function azurirajSveAktivneIzazove() {
  const izazovi = await Izazov.find({ kraj: { $gte: new Date() } });
  for (const izazov of izazovi) {
    try {
      await azurirajBodoveZaIzazov(izazov);
    } catch (err) {
      console.error(`Greška pri dnevnom osvježavanju izazova ${izazov._id}:`, err.message);
    }
  }
  console.log(`Dnevno osvježavanje izazova gotovo (${izazovi.length} izazova).`);
}

function msDoSljedecegPokretanja() {
  const sad = new Date();
  const sljedece = new Date(sad);
  sljedece.setHours(SAT_POKRETANJA, MINUTA_POKRETANJA, 0, 0);
  if (sljedece <= sad) sljedece.setDate(sljedece.getDate() + 1);
  return sljedece - sad;
}

export function pokreniDnevnoOsvjezavanjeIzazova() {
  const zakazi = () => {
    setTimeout(async () => {
      await azurirajSveAktivneIzazove().catch(err => console.error('Dnevno osvježavanje izazova nije uspjelo:', err));
      setInterval(() => {
        azurirajSveAktivneIzazove().catch(err => console.error('Dnevno osvježavanje izazova nije uspjelo:', err));
      }, 24 * 60 * 60 * 1000);
    }, msDoSljedecegPokretanja());
  };
  zakazi();
}
