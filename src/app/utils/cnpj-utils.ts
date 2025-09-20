/**
 * Utilitários para validação e formatação de CNPJ
 */

import { removeNonNumeric } from './shared-utils';

/**
 * Valida se um CNPJ é válido segundo as regras brasileiras
 */
const isValidCNPJ = (cnpj: string): boolean => {
  const numericCNPJ = removeNonNumeric(cnpj);
  
  // Verifica se tem 14 dígitos
  if (numericCNPJ.length !== 14) {
    return false;
  }
  
  // Verifica se todos os dígitos são iguais (CNPJ inválido)
  if (/^(\d)\1+$/.test(numericCNPJ)) {
    return false;
  }
  
  // Calcula o primeiro dígito verificador
  let sum = 0;
  let weight = 5;
  
  for (let i = 0; i < 12; i++) {
    sum += parseInt(numericCNPJ[i]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  
  const firstDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  
  if (parseInt(numericCNPJ[12]) !== firstDigit) {
    return false;
  }
  
  // Calcula o segundo dígito verificador
  sum = 0;
  weight = 6;
  
  for (let i = 0; i < 13; i++) {
    sum += parseInt(numericCNPJ[i]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  
  const secondDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  
  return parseInt(numericCNPJ[13]) === secondDigit;
};

/**
 * Valida CNPJ e retorna mensagem de erro se inválido
 */
export const validateCNPJ = (cnpj: string): string | null => {
  if (!cnpj || cnpj.trim() === '') {
    return 'CNPJ é obrigatório';
  }
  
  const numericCNPJ = removeNonNumeric(cnpj);
  
  if (numericCNPJ.length < 14) {
    return 'CNPJ deve ter 14 dígitos';
  }
  
  if (!isValidCNPJ(cnpj)) {
    return 'CNPJ inválido';
  }
  
  return null;
};
