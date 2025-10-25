/**
 * Utilitários para validação e formatação de telefone brasileiro
 */

import { removeNonNumeric } from './shared-utils';

/**
 * Valida se um DDD é válido (11-99)
 */
const isValidDDD = (ddd: string): boolean => {
  const dddNumber = parseInt(ddd);
  return dddNumber >= 11 && dddNumber <= 99;
};

/**
 * Valida se um telefone é válido segundo as regras brasileiras
 */
const isValidPhone = (phone: string): boolean => {
  const numericPhone = removeNonNumeric(phone);
  
  // Verifica se tem 10 ou 11 dígitos
  if (numericPhone.length !== 10 && numericPhone.length !== 11) {
    return false;
  }
  
  // Verifica se o DDD é válido
  const ddd = numericPhone.slice(0, 2);
  if (!isValidDDD(ddd)) {
    return false;
  }
  
  // Para celulares (11 dígitos), o nono dígito deve ser 9
  if (numericPhone.length === 11) {
    const ninthDigit = numericPhone[2];
    if (ninthDigit !== '9') {
      return false;
    }
  }
  
  // Verifica se não são todos os dígitos iguais
  if (/^(\d)\1+$/.test(numericPhone)) {
    return false;
  }
  
  return true;
};

/**
 * Valida telefone e retorna mensagem de erro se inválido
 */
export const validatePhone = (phone: string): string | null => {
  if (!phone || phone.trim() === '') {
    return 'Telefone é obrigatório';
  }
  
  const numericPhone = removeNonNumeric(phone);
  
  if (numericPhone.length < 10) {
    return 'Telefone deve ter pelo menos 10 dígitos';
  }
  
  if (numericPhone.length > 11) {
    return 'Telefone deve ter no máximo 11 dígitos';
  }
  
  if (numericPhone.length === 10) {
    // Telefone fixo
    const ddd = numericPhone.slice(0, 2);
    if (!isValidDDD(ddd)) {
      return 'DDD inválido';
    }
  } else if (numericPhone.length === 11) {
    // Celular
    const ddd = numericPhone.slice(0, 2);
    if (!isValidDDD(ddd)) {
      return 'DDD inválido';
    }
    
    const ninthDigit = numericPhone[2];
    if (ninthDigit !== '9') {
      return 'Celular deve começar com 9 após o DDD';
    }
  }
  
  if (!isValidPhone(phone)) {
    return 'Telefone inválido';
  }
  
  return null;
};

