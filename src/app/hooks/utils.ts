export const convertSvgToPng = async (svgUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", {
          alpha: true,
          desynchronized: false,
        });

        if (!ctx) {
          reject(new Error("Não foi possível criar contexto do canvas"));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        const scaleFactor = 3;
        const baseWidth = img.width || 200;
        const baseHeight = img.height || 200;

        canvas.width = baseWidth * scaleFactor;
        canvas.height = baseHeight * scaleFactor;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const pngDataUrl = canvas.toDataURL("image/png", 1.0);
        resolve(pngDataUrl);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error("Falha ao carregar imagem SVG"));
    };

    img.src = svgUrl;
  });
};

export const localizeDate = (dateString: string): string => {
  if (!dateString) return "";
  // Se a data vem no formato YYYY-MM-DD, precisamos tratá-la como timezone local
  // em vez de UTC para evitar problemas de conversão
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    // Criar a data no timezone local adicionando T00:00:00
    const localDate = new Date(dateString + "T00:00:00");
    return localDate.toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } else {
    // Para outros formatos, usar o comportamento padrão
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
};
