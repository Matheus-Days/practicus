export const convertSvgToPng = async (svgUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', {
          alpha: true,
          desynchronized: false
        });
        
        if (!ctx) {
          reject(new Error('Não foi possível criar contexto do canvas'));
          return;
        }
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        const scaleFactor = 3;
        const baseWidth = img.width || 200;
        const baseHeight = img.height || 200;
        
        canvas.width = baseWidth * scaleFactor;
        canvas.height = baseHeight * scaleFactor;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const pngDataUrl = canvas.toDataURL('image/png', 1.0);
        resolve(pngDataUrl);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Falha ao carregar imagem SVG'));
    };
    
    img.src = svgUrl;
  });
};