import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/\s+/g, '');
const BUCKETS = ['certificates-public', 'certificates-private', 'logos'];

if (!SUPABASE_URL || !SUPABASE_KEY || !process.argv[2]) {
  console.error('Uso: npm run restaurar-fotos -- <pasta-de-backup>\nEx: npm run restaurar-fotos -- supabase/migrations/fotos_2026-08-19_18-35');
  process.exit(1);
}

const pastaBackup = process.argv[2];
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const uploadarRecursivo = async (bucket, pastaLocal, prefixo = '') => {
  const itens = readdirSync(pastaLocal);
  let n = 0;
  for (const item of itens) {
    const caminho = join(pastaLocal, item);
    const stat = statSync(caminho);
    const caminhoRemoto = prefixo ? prefixo + '/' + item : item;
    if (stat.isDirectory()) {
      n += await uploadarRecursivo(bucket, caminho, caminhoRemoto);
    } else {
      const buf = readFileSync(caminho);
      const { error } = await supabase.storage.from(bucket).upload(caminhoRemoto, buf, { upsert: true });
      if (error) console.log(`   ERRO ${caminhoRemoto}: ${error.message}`);
      else n++;
    }
  }
  return n;
};

(async () => {
  console.log(`Restaurando de: ${pastaBackup}\n`);
  let totalN = 0;
  for (const bucket of BUCKETS) {
    const pasta = join(pastaBackup, bucket);
    try {
      const n = await uploadarRecursivo(bucket, pasta);
      console.log(`${bucket.padEnd(22)} ${n} arquivo(s) enviado(s)`);
      totalN += n;
    } catch (e) {
      console.log(`${bucket.padEnd(22)} ERRO: ${e.message}`);
    }
  }
  console.log(`\nTotal: ${totalN} arquivo(s) restaurado(s)`);
  process.exit(totalN > 0 ? 0 : 1);
})();
