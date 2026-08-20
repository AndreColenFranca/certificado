import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { pastaDeBackup } from './backup-dir.js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/\s+/g, '');
const BUCKETS = ['certificates-public', 'certificates-private', 'logos'];

const stamp = () => new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Faltam SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function baixarBucket(bucket, pastaLocal) {
  let n = 0, bytes = 0;

  const listarRecursivo = async (prefixo = '') => {
    const { data, error } = await supabase.storage.from(bucket).list(prefixo, { limit: 1000 });
    if (error) throw error;
    for (const item of data || []) {
      const caminho = prefixo ? prefixo + '/' + item.name : item.name;
      if (!item.id) {
        await listarRecursivo(caminho);
      } else {
        const { data: arquivo, error: e } = await supabase.storage.from(bucket).download(caminho);
        if (e) throw e;
        const buf = await arquivo.arrayBuffer();
        const local = join(pastaLocal, caminho);
        mkdirSync(join(pastaLocal, prefixo), { recursive: true });
        writeFileSync(local, Buffer.from(buf));
        n++;
        bytes += buf.byteLength;
      }
    }
  };

  await listarRecursivo();
  return { n, bytes };
}

async function backup() {
  console.log('=== BACKUP DE FOTOS ===\n');
  const pastaRaiz = join(pastaDeBackup(), `fotos_${stamp()}`);
  mkdirSync(pastaRaiz, { recursive: true });

  let totalN = 0, totalBytes = 0;
  for (const bucket of BUCKETS) {
    const pasta = join(pastaRaiz, bucket);
    mkdirSync(pasta, { recursive: true });
    try {
      const { n, bytes } = await baixarBucket(bucket, pastaRaiz);
      console.log(`${bucket.padEnd(22)} ${n} arquivo(s)  ${(bytes / 1048576).toFixed(2)} MB`);
      totalN += n;
      totalBytes += bytes;
    } catch (e) {
      console.log(`${bucket.padEnd(22)} ERRO: ${e.message}`);
    }
  }

  console.log(`\nFotos salvas em: ${pastaRaiz}`);
  console.log(`Total: ${totalN} arquivo(s), ${(totalBytes / 1048576).toFixed(2)} MB`);
  process.exit(totalN > 0 ? 0 : 1);
}

backup();
