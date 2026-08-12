import { JewelryCertificate } from '../types';

/**
 * Checks whether a jewelry certificate has a linked customer or is in inventory ("sem cliente vinculado").
 */
export const isCustomerLinkedToCertificate = (cert: JewelryCertificate | null | undefined): boolean => {
  if (!cert) return false;

  const ownerId = cert.ownerId?.trim();
  const ownerCpf = cert.ownerCpf?.trim();
  const ownerEmail = cert.ownerEmail?.trim();
  const ownerName = cert.currentOwnerName?.trim().toLowerCase();

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
 * If no real name is present (or name equals email), it displays the email without fabricating a fake name.
 */
export const formatUserGreeting = (user?: { name?: string; email?: string } | null): string => {
  if (!user) return '';

  const email = (user.email || '').trim();
  let rawName = (user.name || '').trim();

  // 1. Clean role descriptors, parenthetical tags, and titles
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

  // 2. Extract clean name or derive from email handle if missing or equal to email
  let extractedName = '';

  if (rawName && !rawName.includes('@') && (!email || rawName.toLowerCase() !== email.toLowerCase())) {
    extractedName = rawName;
  } else {
    // Derive name from email handle
    const emailToUse = email || (rawName.includes('@') ? rawName : '');
    if (emailToUse.includes('@')) {
      const handle = emailToUse.split('@')[0];
      extractedName = handle
        .replace(/[._-]+/g, ' ')
        .trim()
        .split(/\s+/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
  }

  // 3. Take only the first two words of the name
  const words = extractedName.split(/\s+/).filter(Boolean);
  const firstTwoWords = words
    .slice(0, 2)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const finalName = firstTwoWords || 'Usuário';

  // 4. Always place the name BEFORE the email if email exists
  if (email) {
    return `${finalName} (${email})`;
  }

  return finalName;
};

