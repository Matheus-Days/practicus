import { useState, useEffect } from "react";

interface ShareData {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

interface UseShareReturn {
  canShare: boolean;
  share: (data: ShareData) => Promise<void>;
}

export const useShare = (): UseShareReturn => {
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    // Verifica se a Web Share API está disponível
    const checkShareSupport = async () => {
      try {
        // Testa se pode compartilhar arquivos fazendo fetch do test.pdf
        const response = await fetch('/test.pdf');
        const blob = await response.blob();
        const testFile = new File([blob], 'test.pdf', { type: 'application/pdf' });
        
        const testShareData = {
          title: 'Teste de compartilhamento',
          text: 'Testando Web Share API',
          files: [testFile]
        };

        // Verifica se o navegador suporta compartilhamento de pdf
        if (navigator.canShare && navigator.canShare(testShareData)) {
          setCanShare(true);
        }
      } catch (error) {
        console.warn('Web Share API indisponível:', error);
        setCanShare(false);
      }
    };

    checkShareSupport();
  }, []);

  const share = async (data: ShareData): Promise<void> => {
    if (!canShare) {
      throw new Error('Web Share API não está disponível neste navegador');
    }
    await navigator.share(data);
  };

  return {
    canShare,
    share,
  };
};
