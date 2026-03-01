import { useCallback } from "react";

interface UseCopyJSONReturn {
  copyJSON: (obj: unknown) => Promise<void>;
}

export const useCopyJSON = (): UseCopyJSONReturn => {
  const copyJSON = useCallback(async (obj: unknown): Promise<void> => {
    try {
      const jsonString = JSON.stringify(obj, null, 2);
      await navigator.clipboard.writeText(jsonString);
    } catch (error) {
      console.error("Erro ao copiar JSON para o clipboard:", error);
      throw new Error("Falha ao copiar JSON para o clipboard");
    }
  }, []);

  return {
    copyJSON,
  };
};
