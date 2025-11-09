// src/lib/pdfGenerator.ts
import { Convocatoria } from '../types';

export const generateConvocatoriasPDF = (convocatorias: Convocatoria[], title: string): void => {
  if (!convocatorias || convocatorias.length === 0) {
    alert('No hay convocatorias para exportar con los filtros seleccionados.');
    return;
  }
  
  // El resto del código de esta función no cambia.
  let htmlContent = `...`; // (El mismo HTML de antes)
  // ...
};