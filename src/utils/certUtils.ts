import { JewelryCertificate } from '../types';

/**
 * Extracts a certificate identifier (ID, serial number, or authenticity hash) from a string,
 * which may be a plain ID ("CERT-2026-001"), a URL ("https://domain.com/cert/CERT-2026-001"),
 * a query parameter ("?cert=CERT-2026-001"), or a hash ("#cert=CERT-2026-001").
 */
export const extractCertIdFromInput = (input: string | null | undefined): string | null => {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    // 1. Check if input contains a path parameter like /cert/:id or /passport/:id or /c/:id
    const pathMatch = trimmed.match(/(?:cert|passport|certificate|c)\/([^/?#]+)/i);
    if (pathMatch && pathMatch[1]) {
      return decodeURIComponent(pathMatch[1]).trim();
    }

    // 2. Check for query or hash parameters like cert=... or id=... or sn=...
    const paramMatch = trimmed.match(/(?:cert|id|sn)=([^&#]+)/i);
    if (paramMatch && paramMatch[1]) {
      return decodeURIComponent(paramMatch[1]).trim();
    }

    // 3. Check if it's a URL and extract pathname
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const url = new URL(trimmed);
      const urlCert = extractCertIdFromInput(url.pathname + url.search + url.hash);
      if (urlCert) return urlCert;
    }
  } catch (e) {
    console.error('Error parsing cert input:', e);
  }

  // Don't return URLs, paths, or invalid patterns
  if (trimmed.startsWith('/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return null;
  }

  // Don't return empty or whitespace-only strings
  if (!trimmed || !trimmed.trim()) {
    return null;
  }

  // Only return if it looks like a valid ID (contains alphanumeric, dash, underscore)
  if (/^[a-zA-Z0-9\-_]+$/.test(trimmed)) {
    return trimmed;
  }

  return null;
};

/**
 * Searches a list of certificates for a given query (ID, serial number, hash, or title).
 */
export const findCertificateByQuery = (
  certificates: JewelryCertificate[],
  query: string | null | undefined
): JewelryCertificate | null => {
  if (!query) return null;
  const cleanTarget = extractCertIdFromInput(query);
  if (!cleanTarget) return null;

  const targetUpper = cleanTarget.toUpperCase();

  // 1. Exact match on ID, serialNumber, or authenticityHash
  const exactMatch = certificates.find(
    c => (c.id && c.id.toUpperCase() === targetUpper) ||
         (c.serialNumber && c.serialNumber.toUpperCase() === targetUpper) ||
         (c.authenticityHash && c.authenticityHash.toUpperCase() === targetUpper)
  );

  if (exactMatch) return exactMatch;

  // 2. Partial match on ID, serialNumber, title, or ownerName
  const partialMatch = certificates.find(
    c => (c.id && c.id.toUpperCase().includes(targetUpper)) ||
         (c.serialNumber && c.serialNumber.toUpperCase().includes(targetUpper)) ||
         (c.title && c.title.toUpperCase().includes(targetUpper)) ||
         (c.currentOwnerName && c.currentOwnerName.toUpperCase().includes(targetUpper))
  );

  return partialMatch || null;
};
