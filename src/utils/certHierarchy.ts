import { JewelryCertificate } from '../types';

/**
 * Checks if a certificate is a Root/Parent (Joia Pai/Raiz).
 * Root certificates represent master catalog models and are NEVER linked to customers.
 */
export function isRootCert(cert: JewelryCertificate): boolean {
  // Treat as root if it has no parent, owner, or current owner
  return !cert.parentCertId && !cert.ownerId && !cert.currentOwnerName;
}

/**
 * Checks if a certificate is a Child (Joia Filha) assigned to a customer.
 */
export function isChildCert(cert: JewelryCertificate): boolean {
  return !isRootCert(cert);
}

/**
 * Retrieves all Child Certificates (Joias Filhas) belonging to a specific Parent Root certificate.
 */
export function getChildCertificatesForParent(
  parentCert: JewelryCertificate,
  allCertificates: JewelryCertificate[]
): JewelryCertificate[] {
  return allCertificates.filter(c => {
    if (isRootCert(c)) return false;
    if (c.parentCertId === parentCert.id) return true;
    return c.title.trim().toLowerCase() === parentCert.title.trim().toLowerCase();
  });
}
