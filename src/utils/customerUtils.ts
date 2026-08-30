import { JewelryCertificate } from '../types';

/**
 * Checks whether a jewelry certificate has a linked customer or is in inventory ("sem cliente vinculado").
 */
export const isCustomerLinkedToCertificate = (cert: JewelryCertificate | null | undefined): boolean => {
  if (!cert) return false;

  const ownerId = typeof cert.ownerId === 'string' ? cert.ownerId.trim() : '';
  const ownerCpf = typeof cert.ownerCpf === 'string' ? cert.ownerCpf.trim() : '';
  const ownerEmail = typeof cert.ownerEmail === 'string' ? cert.ownerEmail.trim() : '';
  const ownerName = typeof cert.currentOwnerName === 'string' ? cert.currentOwnerName.trim().toLowerCase() : '';

  // If customer ID, CPF, or Email is present, a customer is linked
  if ((ownerId && ownerId.length > 0) || (ownerCpf && ownerCpf.length > 0) || (ownerEmail && ownerEmail.length > 0)) {
    return true;
  }

  // If no owner name is provided
  if (!ownerName || ownerName.length === 0) {
    return false;
  }

  // Known unlinked / in-inventory labels
  if (
    ownerName === 'sem proprietário' ||
    ownerName === 'ateliê central (em estoque)' ||
    ownerName === 'ateliê central' ||
    ownerName === 'em estoque' ||
    ownerName.includes('estoque')
  ) {
    return false;
  }

  return true;
};

/**
 * Formats user greeting using the customer's full name ("Nome Completo (Alfanumérico)"),
 * taking the first two words of the name, followed by the email in parentheses:
 * "Primeiro Segundo (email@dominio.com)".
 *
 * If no real registered full name is present (or name equals email / contains '@'),
 * it displays the email address cleanly without fabricating fake names from the email handle.
 */
export const formatUserGreeting = (user?: { name?: string; email?: string } | null): string => {
  if (!user) return '';

  const email = (user.email || '').trim();
  let rawName = (user.name || '').trim();

  // 1. Clean role descriptors, parenthetical tags, and honorifics
  rawName = rawName
    .replace(/\(Administrador Raiz\)/gi, '')
    .replace(/\(Administrador\)/gi, '')
    .replace(/\(Cliente\)/gi, '')
    .replace(/cliente/gi, '')
    .replace(/administrador/gi, '')
    .replace(/gestor/gi, '')
    .trim();

  // Strip parenthetical text e.g. "(something)"
  rawName = rawName.replace(/\([^)]*\)/g, '').trim();

  // Strip common honorific prefixes
  rawName = rawName.replace(/^(dra\.|dr\.|sr\.|sra\.)\s+/gi, '').trim();

  // 2. Check if rawName is a valid "Nome Completo" (not an email, not empty, not equal to email)
  const isRealFullName =
    rawName.length > 0 &&
    !rawName.includes('@') &&
    (!email || rawName.toLowerCase() !== email.toLowerCase());

  if (isRealFullName) {
    // Take only the first two words of the "Nome Completo"
    const words = rawName.split(/\s+/).filter(Boolean);
    const firstTwoWords = words
      .slice(0, 2)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    return firstTwoWords;
  }

  // 3. Fallback: If no registered "Nome Completo" exists, display email directly
  // NEVER fabricate or derive fake names from the email handle (e.g. 'aa' from 'aa@aa.com')
  return email || rawName || 'Usuário';
};


const textoNormalizado = (v?: string | null): string =>
  typeof v === 'string' ? v.trim().toLowerCase() : '';

const somenteDigitos = (v?: string | number | null): string =>
  v === null || v === undefined ? '' : String(v).replace(/\D/g, '');

export interface CertificateOwnerFields {
  ownerId?: string;
  ownerCpf?: string;
  ownerEmail?: string;
  currentOwnerName?: string;
}

export interface OwnerCandidate {
  id?: string;
  name?: string;
  cpf?: string;
  email?: string;
}

/** O certificado declara algum dono atual, por qualquer um dos quatro campos? */
export const certificateHasOwnerIdentity = (cert?: CertificateOwnerFields | null): boolean => {
  if (!cert) return false;
  return Boolean(
    textoNormalizado(cert.ownerId) ||
    textoNormalizado(cert.ownerEmail) ||
    somenteDigitos(cert.ownerCpf) ||
    textoNormalizado(cert.currentOwnerName)
  );
};

/**
 * O certificado pertence a este candidato a dono?
 *
 * Cascata de prioridade, e nao um OU entre os quatro campos: o identificador
 * mais forte que o certificado tiver DECIDE sozinho, e os de baixo nem sao
 * consultados.
 *
 *   ownerId     o mais preciso, mas nem todo registro antigo tem.
 *   ownerEmail  credencial de login; nao se repete dentro da org.
 *   ownerCpf    documento; comparado so por digitos, que a mascara varia.
 *   nome        ultimo recurso, so para certificado sem nenhum dos tres.
 *
 * O OU era o bug: depois de transferir, o certificado ficava com o nome do
 * novo dono e casava com QUALQUER cadastro homonimo - inclusive o de quem
 * cedeu - e a peca aparecia vinculada aos dois. Nome nao e credencial aqui,
 * pela mesma razao que a rota de exclusao ja se recusa a apagar por nome.
 */
export const certificateBelongsTo = (
  cert?: CertificateOwnerFields | null,
  candidate?: OwnerCandidate | null
): boolean => {
  if (!cert || !candidate) return false;

  const certOwnerId = textoNormalizado(cert.ownerId);
  if (certOwnerId) return certOwnerId === textoNormalizado(candidate.id);

  const certEmail = textoNormalizado(cert.ownerEmail);
  if (certEmail) return certEmail === textoNormalizado(candidate.email);

  const certCpf = somenteDigitos(cert.ownerCpf);
  if (certCpf) return certCpf === somenteDigitos(candidate.cpf);

  const certName = textoNormalizado(cert.currentOwnerName);
  if (certName) return certName === textoNormalizado(candidate.name);

  return false;
};

/**
 * Alguem aparece como cliente no historico de manutencao da peca?
 *
 * So serve para certificado sem nenhum campo de dono preenchido. O historico
 * guarda dono PASSADO: o registro de emissao carrega o CPF e o e-mail do
 * primeiro titular para sempre, entao usa-lo como prova de posse devolvia a
 * peca a quem ja tinha transferido.
 */
export const maintenanceHistoryBelongsTo = (
  history: Array<{ customerId?: string; customerName?: string; customerCpf?: string; customerEmail?: string }> | undefined,
  candidate?: OwnerCandidate | null
): boolean =>
  (history || []).some(m =>
    certificateBelongsTo(
      {
        ownerId: m.customerId,
        ownerEmail: m.customerEmail,
        ownerCpf: m.customerCpf,
        currentOwnerName: m.customerName
      },
      candidate
    )
  );
