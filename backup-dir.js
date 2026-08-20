/**
 * Onde os backups moram.
 *
 * FORA DO REPOSITORIO, de proposito. Antes eles caiam em
 * supabase/migrations/, que e uma pasta versionada: todo formato novo de
 * backup nascia visivel para o git ate alguem lembrar de acrescenta-lo ao
 * .gitignore. Foi assim que 12 fotos de clientes acabaram num commit publico
 * em agosto de 2026. Gravar fora do repositorio elimina a categoria inteira
 * do problema, em vez de tapar caso a caso.
 *
 * Padrao: <pasta do usuario>/Downloads/certificado-backups
 * Para mudar, defina BACKUP_DIR no .env - nao precisa mexer em codigo.
 *
 * ATENCAO ao escolher: o Downloads nao e sincronizado com nuvem nenhuma, e
 * costuma ser a primeira pasta que se esvazia quando falta espaco. Se quiser
 * uma copia fora da maquina, aponte BACKUP_DIR para dentro do OneDrive.
 */
import { mkdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

export function pastaDeBackup() {
  const dir = process.env.BACKUP_DIR || join(homedir(), 'Downloads', 'certificado-backups');
  // Criar aqui e nao em cada script: quem chama so quer o caminho pronto.
  mkdirSync(dir, { recursive: true });
  return dir;
}
