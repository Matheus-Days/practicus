/**
 * Utilitários para validação e formatação de CEP brasileiro
 */

import { removeNonNumeric } from './shared-utils';

/**
 * Valida se um CEP é válido segundo as regras brasileiras
 */
const isValidCEP = (cep: string): boolean => {
  const numericCEP = removeNonNumeric(cep);

  // Verifica se tem 8 dígitos
  if (numericCEP.length !== 8) {
    return false;
  }

  // Verifica se não são todos os dígitos iguais (CEP inválido)
  if (/^(\d)\1+$/.test(numericCEP)) {
    return false;
  }

  // Verifica se não é um CEP conhecido como inválido
  const invalidCEPs = [
    "00000000",
    "11111111",
    "22222222",
    "33333333",
    "44444444",
    "55555555",
    "66666666",
    "77777777",
    "88888888",
    "99999999",
  ];

  if (invalidCEPs.includes(numericCEP)) {
    return false;
  }

  return true;
};

/**
 * Valida CEP e retorna mensagem de erro se inválido
 */
export const validateCEP = (cep: string): string | null => {
  if (!cep || cep.trim() === "") {
    return "CEP é obrigatório";
  }

  const numericCEP = removeNonNumeric(cep);

  if (numericCEP.length < 8) {
    return "CEP deve ter 8 dígitos";
  }

  if (numericCEP.length > 8) {
    return "CEP deve ter no máximo 8 dígitos";
  }

  if (!isValidCEP(cep)) {
    return "CEP inválido";
  }

  return null;
};

/**
 * Busca informações do CEP via API
 */
export const fetchCEPInfo = async (
  cep: string
): Promise<{
  logradouro: string;
  localidade: string;
  uf: string;
}> => {
  const numericCEP = removeNonNumeric(cep);

  if (numericCEP.length !== 8) {
    throw new Error("CEP deve ter 8 dígitos");
  }

  try {
    // Usando a API ViaCEP (gratuita e confiável)
    const response = await fetch(
      `https://viacep.com.br/ws/${numericCEP}/json/`
    );
    const data = await response.json();

    if (data.erro) {
      throw new Error("CEP não encontrado");
    }

    return {
      logradouro: data.logradouro,
      localidade: data.localidade,
      uf: data.uf,
    };
  } catch (error) {
    throw new Error("Erro ao buscar informações do CEP");
  }
};

export const formatCEP = (cep?: string) => {
  if (!cep) return "Não informado";
  return cep.replace(/(\d{5})(\d{3})/, '$1-$2');
};