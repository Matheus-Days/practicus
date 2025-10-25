/**
 * Utilitários compartilhados entre diferentes módulos de validação
 */

/**
 * Remove caracteres não numéricos de uma string
 */
export const removeNonNumeric = (value: string): string => {
  return value.replace(/\D/g, '');
};
