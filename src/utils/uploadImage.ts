import { fetchWithAuth } from './fetchWithAuth';

/**
 * Envia uma foto de joia para o Storage do Supabase e devolve a URL publica.
 *
 * O certificado guarda so essa URL. Antes as fotos iam em base64 dentro de
 * jewelry_certificates.images, o que fazia cada certificado pesar cerca de
 * 1 MB no banco e no backup.
 *
 * O upload passa pelo backend (que usa a service role key) em vez de ir
 * direto do navegador: assim o bucket nao precisa de politica de escrita
 * aberta e a rota continua exigindo login, como todo o resto da API.
 */
export async function uploadCertificateImage(dataUrl: string): Promise<string> {
  const response = await fetchWithAuth('/api/uploads/certificate-image', {
    method: 'POST',
    body: JSON.stringify({ dataUrl })
  });

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.success || !payload?.url) {
    throw new Error(payload?.message || `Falha ao enviar a imagem (HTTP ${response.status}).`);
  }

  return payload.url as string;
}
