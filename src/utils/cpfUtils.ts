export const cleanCPF = (value: string): string => {
  return (value || '').replace(/\D/g, '').slice(0, 11);
};

export const formatCPF = (value: string): string => {
  const digits = cleanCPF(value);
  if (!digits) return '';
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

export const isValidCPF = (cpf: string): boolean => {
  const digits = cleanCPF(cpf);
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;
  return true;
};
