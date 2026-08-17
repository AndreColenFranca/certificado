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

