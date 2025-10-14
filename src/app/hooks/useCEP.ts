import { useState, useCallback } from 'react';
import { validateCEP, fetchCEPInfo } from '../utils/cep-utils';

// Types for states and municipalities
export interface State {
  id: number;
  nome: string;
  sigla: string;
}

export interface Municipality {
  id: number;
  nome: string;
}

export interface CEPInfo {
  logradouro: string;
  localidade: string;
  uf: string;
}

export interface CEPState {
  cep: string;
  cepInfo: CEPInfo | null;
  cepError: string | null;
  cepLoading: boolean;
  cepSuccess: boolean;
}

export interface StatesState {
  states: State[];
  statesLoading: boolean;
  statesError: string | null;
}

export interface MunicipalitiesState {
  municipalities: Municipality[];
  municipalitiesLoading: boolean;
  municipalitiesError: string | null;
}

export const useCEP = () => {
  // States for CEP
  const [cepState, setCepState] = useState<CEPState>({
    cep: '',
    cepInfo: null,
    cepError: null,
    cepLoading: false,
    cepSuccess: false,
  });

  // States for states list
  const [statesState, setStatesState] = useState<StatesState>({
    states: [],
    statesLoading: false,
    statesError: null,
  });

  // States for municipalities list
  const [municipalitiesState, setMunicipalitiesState] = useState<MunicipalitiesState>({
    municipalities: [],
    municipalitiesLoading: false,
    municipalitiesError: null,
  });

  // Function to fetch CEP information
  const fetchCEPData = useCallback(async (cep: string) => {
    const numericCEP = cep.replace(/\D/g, '');
    
    if (numericCEP.length !== 8) {
      setCepState(prev => ({
        ...prev,
        cepError: null,
        cepSuccess: false,
        cepInfo: null,
      }));
      return;
    }

    setCepState(prev => ({
      ...prev,
      cepLoading: true,
      cepError: null,
      cepSuccess: false,
    }));

    try {
      const cepInfo = await fetchCEPInfo(cep);
      
      setCepState(prev => ({
        ...prev,
        cepInfo,
        cepSuccess: true,
        cepError: null,
        cepLoading: false,
      }));
      
      return cepInfo;
    } catch (error) {
      setCepState(prev => ({
        ...prev,
        cepError: "CEP não encontrado nos Correios",
        cepSuccess: false,
        cepLoading: false,
        cepInfo: null,
      }));
      throw error;
    }
  }, []);

  // Function to validate CEP
  const validateCEPInput = useCallback((cep: string) => {
    const validation = validateCEP(cep);
    setCepState(prev => ({
      ...prev,
      cepError: validation,
      cepSuccess: !validation && cep.replace(/\D/g, '').length === 8,
    }));
    return validation;
  }, []);

  // Function to fetch states list
  const fetchStates = useCallback(async () => {
    setStatesState(prev => ({
      ...prev,
      statesLoading: true,
      statesError: null,
    }));

    try {
      const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados');
      const states = await response.json();
      
      // Ordenar estados alfabeticamente
      const sortedStates = states.sort((a: State, b: State) => 
        a.nome.localeCompare(b.nome, 'pt-BR')
      );
      
      setStatesState({
        states: sortedStates,
        statesLoading: false,
        statesError: null,
      });
      
      return sortedStates;
    } catch (error) {
      setStatesState(prev => ({
        ...prev,
        statesLoading: false,
        statesError: "Erro ao buscar estados",
      }));
      throw error;
    }
  }, []);

  // Function to fetch municipalities by state
  const fetchMunicipalities = useCallback(async (stateCode: number) => {
    setMunicipalitiesState(prev => ({
      ...prev,
      municipalitiesLoading: true,
      municipalitiesError: null,
    }));

    try {
      const response = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateCode}/municipios`
      );
      const municipalities = await response.json();
      
      // Ordenar municípios alfabeticamente
      const sortedMunicipalities = municipalities.sort((a: Municipality, b: Municipality) => 
        a.nome.localeCompare(b.nome, 'pt-BR')
      );
      
      setMunicipalitiesState({
        municipalities: sortedMunicipalities,
        municipalitiesLoading: false,
        municipalitiesError: null,
      });
      
      return sortedMunicipalities;
    } catch (error) {
      setMunicipalitiesState(prev => ({
        ...prev,
        municipalitiesLoading: false,
        municipalitiesError: "Erro ao buscar municípios",
      }));
      throw error;
    }
  }, []);

  // Function to clear CEP state
  const clearCEP = useCallback(() => {
    setCepState({
      cep: '',
      cepInfo: null,
      cepError: null,
      cepLoading: false,
      cepSuccess: false,
    });
  }, []);

  const clearMunicipalities = useCallback(() => {
    setMunicipalitiesState({
      municipalities: [],
      municipalitiesLoading: false,
      municipalitiesError: null,
    });
  }, []);

  return {
    // States
    cepState,
    statesState,
    municipalitiesState,
    
    // Functions
    fetchCEPData,
    validateCEPInput,
    fetchStates,
    fetchMunicipalities,
    clearCEP,
    clearMunicipalities,
  };
};
