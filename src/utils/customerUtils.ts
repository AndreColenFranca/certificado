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
 * Formats user greeting by removing "Cliente"/"Administrador", taking the first two words of the name,
 * and placing the name before the email: "Nome Sobrenome (email@domain.com)".
 */
export const formatUserGreeting = (user?: { name?: string; email?: string } | null): string => {
  if (!user) return '';

  const email = (user.email || '').trim();
  let rawName = (user.name || '').trim();

  // 1. Remove "Cliente", "CLiente", "administrador", "Administrador" (and variations)
  rawName = rawName
    .replace(/cliente/gi, '')
    .replace(/administrador/gi, '')
    .trim();

  // Strip leading/trailing parentheses if rawName was e.g. "(aa@aa.com)"
  if (rawName.startsWith('(') && rawName.endsWith(')')) {
    rawName = rawName.slice(1, -1).trim();
  }

  // Remove any nested parenthetical text
  rawName = rawName.replace(/\([^)]*\)/g, '').trim();

  // 2. If rawName is empty, or is an email, or contains '@', derive name from email handle
  if (!rawName || rawName.includes('@') || (email && rawName.toLowerCase() === email.toLowerCase())) {
    const emailToUse = email || (rawName.includes('@') ? rawName : '');
    if (emailToUse.includes('@')) {
      const handle = emailToUse.split('@')[0];
      rawName = handle
        .replace(/[._-]+/g, ' ')
        .trim()
        .split(/\s+/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    } else {
      rawName = 'Usuário';
    }
  }

  // 3. Take only the first two words of the name
  const words = rawName.split(/\s+/).filter(Boolean);
  const firstTwoWords = words.slice(0, 2).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  // 4. Place the name before the email
  if (email && !firstTwoWords.toLowerCase().includes(email.toLowerCase())) {
    return `${firstTwoWords} (${email})`;
  }

  return firstTwoWords;
};

