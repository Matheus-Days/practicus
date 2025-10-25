import { useCallback, useRef } from 'react';

interface XlsxExportOptions {
  filename?: string;
  sheetName?: string;
}

interface XlsxExportHook {
  exportToXlsx: (data: Record<string, any>[], options?: XlsxExportOptions) => Promise<void>;
  isLoading: boolean;
}

export const useXlsxExport = (): XlsxExportHook => {
  const xlsxRef = useRef<typeof import('xlsx') | null>(null);
  const isLoadingRef = useRef<boolean>(false);

  const loadXlsxLibrary = useCallback(async () => {
    if (xlsxRef.current) {
      return xlsxRef.current;
    }

    try {
      isLoadingRef.current = true;
      const XLSX = await import('xlsx');
      xlsxRef.current = XLSX;
      return XLSX;
    } catch (error) {
      console.error('Erro ao carregar a biblioteca xlsx:', error);
      throw new Error('Falha ao carregar a biblioteca XLSX');
    } finally {
      isLoadingRef.current = false;
    }
  }, []);

  const exportToXlsx = useCallback(async (
    data: Record<string, any>[],
    options: XlsxExportOptions = {}
  ) => {
    try {
      const XLSX = await loadXlsxLibrary();
      
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Os dados devem ser um array não vazio');
      }

      const worksheet = XLSX.utils.json_to_sheet(data);
      
      const workbook = XLSX.utils.book_new();
      
      const sheetName = options.sheetName || 'Dados';
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      
      const excelBuffer = XLSX.write(workbook, { 
        bookType: 'xlsx', 
        type: 'array' 
      });
      
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const filename = options.filename || `export_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar para XLSX:', error);
      throw error;
    }
  }, [loadXlsxLibrary]);

  return {
    exportToXlsx,
    isLoading: isLoadingRef.current
  };
};
