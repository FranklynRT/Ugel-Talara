import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};


export type ConvocatoriaStatus = 'Activa' | 'Inactiva';
export type LicenciaturaStatus = 'Sí' | 'No';

export interface Convocatoria {
  id: number;
  area: string;
  puesto: string;
  sueldo: string;
  requisitos: string;
  experiencia: string;
  licenciatura: LicenciaturaStatus;
  habilidades: string;
  fecha: string; // Formato YYYY-MM-DD
  estado: ConvocatoriaStatus;
}

// Tipo para los datos del formulario (omite campos que se generan automáticamente)
export type ConvocatoriaFormData = Omit<Convocatoria, 'id' | 'fecha' | 'estado'>;