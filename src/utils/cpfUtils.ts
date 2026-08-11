/**
 * Formats a raw digits string into standard CPF format: 999.999.999-99
 */
export const formatCPF = (value: string): string => {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

/**
 * Validates whether string is a formatted or raw CPF with 11 digits
 */
export const isValidCPF = (cpf: string): boolean => {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  // Basic check for all repetitive numbers (e.g. 111.111.111-11)
  if (/^(\d)\1{10}$/.test(digits)) return false;
  return true;
};
