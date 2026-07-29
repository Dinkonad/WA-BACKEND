import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import WebSocket from 'ws';

if (!globalThis.WebSocket) globalThis.WebSocket = WebSocket;

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
  realtime: { transport: WebSocket },
});
const BUCKET = process.env.SUPABASE_BUCKET;

export async function uploadSliku(datoteka, mapa) {
  const ekstenzija = (datoteka.originalname.split('.').pop() || 'jpg').toLowerCase();
  const putanja = `${mapa}/${randomUUID()}.${ekstenzija}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(putanja, datoteka.buffer, { contentType: datoteka.mimetype });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(putanja);
  return data.publicUrl;
}
