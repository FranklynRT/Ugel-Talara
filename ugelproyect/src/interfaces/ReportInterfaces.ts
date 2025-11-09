export interface AnexoReporte {
  id: number;
  nombre: string;
  url: string;
  tipo: string;
  descripcion?: string;
  fecha?: string | Date;
  tamaño?: number;
}

// Interfaz para datos de convocatoria usada en la automatización
export interface ConvocatoriaUsada {
  area?: string;
  puesto?: string;
  numero_cas?: string;
  expPublicaMin?: string;
  expPublicaMax?: string;
  licenciatura?: string;
}

// Interfaz para respuesta de automatización IA
export interface RespuestaAutomatizacionIA {
  success: boolean;
  postulanteId: number;
  convocatoriaId: number;
  totalAnexos: number;
  curriculum: any | null;
  analisis: string;
  score: number; // Nota de 1-100
  estado_evaluacion: "approved" | "rejected" | "pending";
  razones?: string[]; // Array de razones de la evaluación
  motivo_rechazo?: string; // Si fue rechazado automáticamente
  convocatoria_usada?: ConvocatoriaUsada;
}

export interface ReportePostulante {
  id: number;
  nombre_completo: string;
  puesto_postulado: string;
  email: string;
  experiencia_relevante: string;
  contenido?: string; // Informe completo
  userId?: number; // IDUSUARIO vinculado
  habilidades_clave: string[];
  calificacion: number; // Nota de 1-10 (derivada de score/10)
  estado_evaluacion: "pending" | "approved" | "rejected";
  cv_url: string | null;
  anexos: AnexoReporte[]; // Array of attachments
  // Campos adicionales de automatización
  score?: number; // Nota de 1-100 de la automatización
  razones?: string[]; // Razones de la evaluación automática
  motivo_rechazo?: string; // Motivo si fue rechazado
  convocatoria_usada?: ConvocatoriaUsada; // Datos de la convocatoria usada
  totalAnexos?: number; // Total de anexos verificados
  area?: string; // Área de la convocatoria
  numero_cas?: string; // Número CAS de la convocatoria
}
