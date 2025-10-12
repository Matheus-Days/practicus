/**
 * Utilitários para validação e formatação de CPF brasileiro
 */

import { removeNonNumeric } from './shared-utils';

/**
 * Valida se um CPF é válido segundo as regras brasileiras
 */
const isValidCPF = (cpf: string): boolean => {
  const numericCPF = removeNonNumeric(cpf);
  
  // Verifica se tem 11 dígitos
  if (numericCPF.length !== 11) {
    return false;
  }
  
  // Verifica se todos os dígitos são iguais (CPF inválido)
  if (/^(\d)\1+$/.test(numericCPF)) {
    return false;
  }
  
  // Calcula o primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numericCPF[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numericCPF[9])) return false;
  
  // Calcula o segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numericCPF[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numericCPF[10])) return false;
  
  return true;
};

/**
 * Valida CPF e retorna mensagem de erro se inválido
 */
export const validateCPF = (cpf: string): string | null => {
  if (!cpf || cpf.trim() === '') {
    return 'CPF é obrigatório';
  }
  
  const numericCPF = removeNonNumeric(cpf);
  
  if (numericCPF.length < 11) {
    return 'CPF deve ter 11 dígitos';
  }
  
  if (numericCPF.length > 11) {
    return 'CPF deve ter no máximo 11 dígitos';
  }
  
  if (!isValidCPF(cpf)) {
    return 'CPF inválido';
  }
  
  return null;
};

/**
 * Aplica máscara de CPF (000.000.000-00)
 */
export const formatCPF = (value: string): string => {
  const numericValue = removeNonNumeric(value);
  
  if (numericValue.length <= 3) {
    return numericValue;
  } else if (numericValue.length <= 6) {
    return `${numericValue.slice(0, 3)}.${numericValue.slice(3)}`;
  } else if (numericValue.length <= 9) {
    return `${numericValue.slice(0, 3)}.${numericValue.slice(3, 6)}.${numericValue.slice(6)}`;
  } else {
    return `${numericValue.slice(0, 3)}.${numericValue.slice(3, 6)}.${numericValue.slice(6, 9)}-${numericValue.slice(9, 11)}`;
  }
};

/**
 * Obfusca CPF mantendo apenas os 3 primeiros e 2 últimos dígitos
 * Formato: XXX.***.***-XX
 */
export const obfuscateCPF = (cpf: string): string => {
  const numericCPF = removeNonNumeric(cpf);
  
  if (numericCPF.length !== 11) {
    return '***.***.***-**';
  }
  
  const firstThree = numericCPF.slice(0, 3);
  const lastTwo = numericCPF.slice(-2);
  
  return `${firstThree}.***.***-${lastTwo}`;
};
