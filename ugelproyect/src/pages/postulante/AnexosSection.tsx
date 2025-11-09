import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { IconFileText, IconUser, IconSchool, IconBriefcase, IconPlus, IconTrash, IconDeviceFloppy, IconCertificate, IconLanguage, IconInfoCircle, IconPhone, IconMail, IconHome, IconCheck, IconMapPin, IconEdit } from '@tabler/icons-react';
import ubigeo from 'ubigeo-peru';
import { Location } from '@/data/peruLocations';
import { API_BASE_URL } from '@/lib/api'; // Import API_BASE_URL

// Funciones helper para usar ubigeo-peru con el formato Location
const getDepartamentos = (): Location[] => {
  try {
    const data = ubigeo.reniec || ubigeo.inei || [];
    
    // Obtener departamentos únicos (donde provincia y distrito son "00")
    const departamentosMap = new Map<string, Location>();
    
    data.forEach((item: any) => {
      if (item.provincia === '00' && item.distrito === '00') {
        const code = item.departamento;
        if (!departamentosMap.has(code)) {
          departamentosMap.set(code, {
            id: code,
            name: item.nombre,
            code: code
          });
        }
      }
    });
    
    return Array.from(departamentosMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error al obtener departamentos:', error);
    return [];
  }
};

const getProvinciasByDepartamento = (departamentoId: string): Location[] => {
  try {
    if (!departamentoId) return [];
    
    const data = ubigeo.reniec || ubigeo.inei || [];
    
    // Obtener provincias del departamento (donde distrito es "00" pero provincia no)
    const provinciasMap = new Map<string, Location>();
    
    data.forEach((item: any) => {
      if (item.departamento === departamentoId && item.distrito === '00' && item.provincia !== '00') {
        const code = `${item.departamento}${item.provincia}`;
        if (!provinciasMap.has(code)) {
          provinciasMap.set(code, {
            id: code,
            name: item.nombre,
            code: code
          });
        }
      }
    });
    
    return Array.from(provinciasMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error al obtener provincias:', error);
    return [];
  }
};

const getDistritosByProvincia = (departamentoId: string, provinciaId: string): Location[] => {
  try {
    if (!departamentoId || !provinciaId) return [];
    
    const data = ubigeo.reniec || ubigeo.inei || [];
    
    // El provinciaId puede venir como "0101" (departamento + provincia) o solo "01" (solo provincia)
    // Necesitamos extraer solo la parte de provincia
    let provinciaCode: string;
    if (provinciaId.length === 4) {
      // Formato "0101" - extraer los últimos 2 dígitos
      provinciaCode = provinciaId.substring(2, 4);
    } else if (provinciaId.length === 2) {
      // Formato "01" - usar directamente
      provinciaCode = provinciaId;
    } else {
      // Intentar extraer de cualquier manera
      provinciaCode = provinciaId.length > 2 ? provinciaId.substring(provinciaId.length - 2) : provinciaId;
    }
    
    // Obtener distritos de la provincia (donde distrito no es "00")
    const distritosMap = new Map<string, Location>();
    
    data.forEach((item: any) => {
      if (item.departamento === departamentoId && 
          item.provincia === provinciaCode && 
          item.distrito !== '00') {
        const code = `${item.departamento}${item.provincia}${item.distrito}`;
        if (!distritosMap.has(code)) {
          distritosMap.set(code, {
            id: code,
            name: item.nombre,
            code: code
          });
        }
      }
    });
    
    return Array.from(distritosMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error al obtener distritos:', error);
    return [];
  }
};

// --- INTERFACES PARA ANEXO 01 --- 
interface PersonalData {
  codigo: string;
  nombrePuesto: string;
  tipoDocumento: 'DNI' | 'CARNET DE EXTRANJERÍA';
  dni: string;
  carnetExtranjeria: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombres: string;
  genero: 'F' | 'M';
  direccion: string;
  provincia: string;
  departamento: string;
  distrito: string;
  // IDs para ubicaciones dependientes
  departamentoId: string;
  provinciaId: string;
  distritoId: string;
  referenciaDireccion: string;
  fechaNacimiento: string; // DD/MM/AAAA
  lugarNacimiento: string; // DISTRITO/PROVINCIA/DEPARTAMENTO
  // IDs para lugar de nacimiento dependientes
  lugarNacimientoDepartamentoId: string;
  lugarNacimientoProvinciaId: string;
  lugarNacimientoDistritoId: string;
  lugarNacimientoDepartamento: string;
  lugarNacimientoProvincia: string;
  lugarNacimientoDistrito: string;
  correoElectronico: string;
  telefonoDomicilio: string;
  telefonoCelular1: string;
  telefonoCelular2: string;
  correoElectronicoAlterno: string;
  conadis: 'SI' | 'NO';
  nCarnetConadis: string;
  codigoConadis: string;
  fuerzasArmadas: 'SI' | 'NO';
  nCarnetFuerzasArmadas: string;
  codigoFuerzasArmadas: string;
  asistenciaEspecial: string;
  tiempoSectorPublico: string; // DD/MM/AAAA
  tiempoSectorPrivado: string; // DD/MM/AAAA
  // New fields for Colegio Profesional
  colegioProfesional: string; // E.g., "Colegio de Ingenieros del Perú"
  colegioProfesionalHabilitado: 'SI' | 'NO';
  nColegiatura: string;
  fechaVencimientoColegiatura: string; // DD/MM/AAAA
  numeroCas: string; // Added new field
}

interface AcademicFormationItem {
  nivelEducativo: 'PRIMARIA' | 'SECUNDARIA' | 'TÉCNICA SUPERIOR' | 'UNIVERSITARIO' | 'MAESTRÍA' | 'DOCTORADO' | 'FORMACIÓN BÁSICA' | 'OTROS (ESPECIFICAR)';
  gradoAcademico: string;
  nombreCarrera: string;
  institucion: string;
  anoDesde: string; // YYYY
  anoHasta: string; // YYYY
  otrosNivelEspecificar?: string; // Campo para especificar cuando se selecciona "OTROS (ESPECIFICAR)"
}

interface LanguageSkill {
  idiomaDialecto: string;
  nivel: 'Básico' | 'Intermedio' | 'Avanzado';
}

interface OfficeSkill {
  materia: string; // Ej: PROCESADOR DE TEXTO, HOJAS DE CALCULO, PROGRAMA DE PRESENTACIONES, ETC.
  nivel: 'Básico' | 'Intermedio' | 'Avanzado';
}

interface SpecializationStudy {
  tipoEstudio: string; // CURSO, DIPLOMA, PROGRAMA DE ESPECIALIZACIÓN
  nombreEstudio: string;
  periodoInicio: string; // YYYY
  periodoFin: string; // YYYY
  horas: string;
  centroEstudio: string;
}

interface WorkExperienceItem {
  empresaInstitucion: string;
  sectorGiroNegocio: string;
  puestoCargo: string;
  periodoDesde: string; // MM/AAAA
  periodoHasta: string; // MM/AAAA
  funcionPrincipal1: string;
  funcionPrincipal2: string;
  funcionPrincipal3: string;
  funcionPrincipal4: string;
  funcionPrincipal5: string;
}

interface LaborReferenceItem {
  empresaEntidad: string;
  direccion: string;
  cargoPostulante: string;
  nombreCargoJefe: string;
  telefonos: string;
  correoElectronico: string;
}

interface RelativesInUGEL {
  gradoParentesco: string;
  areaTrabajo: string;
  apellidos: string;
  nombres: string;
}

interface Declarations {
  infoVerdadera: boolean;
  fechaDeclaracion: string; // DD/MM/AAAA
  // New declaration fields
  leyProteccionDatos: boolean;
  datosConsignadosVerdaderos: boolean;
  // New detailed declarations
  plenosDerechosCiviles: boolean;
  cumploRequisitosMinimos: boolean;
  noCondenaDolosa: boolean;
  noInhabilitacion: boolean;
  noSentenciaCondenatoria: boolean;
  noAntecedentesPenales: boolean;
  noAntecedentesPoliciales: boolean;
  noAntecedentesJudiciales: boolean;
  noParientesUGEL: boolean;
  // Declaración de parientes en UGEL
  tieneParientesUGEL: 'SI' | 'NO';
  // firma: string; // This would typically be handled as an upload or digital signature on submission
}

interface AnexosFormData {
  personalData: PersonalData;
  academicFormation: AcademicFormationItem[];
  languageSkills: LanguageSkill[];
  officeSkills: OfficeSkill[];
  specializationStudies: SpecializationStudy[];
  workExperience: WorkExperienceItem[];
  laborReferences: LaborReferenceItem[];
  declarations: Declarations;
  relativesInUGEL: RelativesInUGEL[];
}

// --- PROPS ---
interface AnexosSectionProps {
  convocatoriaSeleccionada: any;
  navigate: (path: string, options?: { state?: any }) => void; // Add navigate prop
  authToken: string | null; // Add authToken prop
  darkMode: boolean; // Add darkMode prop
  textClasses?: string; // Add textClasses prop
  textSecondaryClasses?: string; // Add textSecondaryClasses prop
  currentSectionIndex?: number; // Índice de la sección actual a mostrar (0-8)
  showOnlyCurrentSection?: boolean; // Si es true, solo muestra la sección actual
  onSectionSave?: () => Promise<void>; // Callback para guardar cuando se completa una sección
  onValidateSection?: () => { isValid: boolean; missingFields: string[] }; // Callback para validar la sección actual
  getFormData?: () => AnexosFormData; // Callback para obtener los datos del formulario
  validationErrors?: { [fieldName: string]: boolean }; // Errores de validación por nombre de campo
  showCompletedAnexos?: boolean; // Si es false, oculta la sección de anexos completados (por defecto true)
}

// --- COMPONENTES DE FORMULARIO MEJORADOS ---
const FormSection = ({ title, icon, children, subtitle, darkMode = true, required = false }: { title: string; icon: React.ReactNode; children: React.ReactNode; subtitle?: string; darkMode?: boolean; required?: boolean }) => (
    <motion.fieldset 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("border rounded-lg p-6 mt-8 first:mt-0 w-full max-w-full", darkMode
            ? "border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-purple-500/5"
            : "border-gray-300 bg-white")}
        style={{ width: '100%', maxWidth: '100%' }}
    >
        <legend className={cn("text-2xl font-bold mb-2 flex items-center gap-3 px-4 w-full", darkMode
            ? "text-white"
            : "text-gray-800")}>
            <div className={cn("p-2 rounded-lg flex items-center justify-center", darkMode ? "bg-indigo-500/20" : "bg-gray-100")}>
                <span className={cn(darkMode ? "text-indigo-400" : "text-indigo-600")}>
                    {icon}
                </span>
            </div>
            <span className={darkMode ? "text-white" : "text-gray-800"}>{title}</span>
            {required && <span className="text-red-500 font-bold ml-1">*</span>}
        </legend>
        {subtitle && <p className={cn("text-sm mb-6 px-4 w-full", darkMode ? "text-neutral-400" : "text-gray-600")}>{subtitle}</p>}
        <div className="px-4 w-full max-w-full">{children}</div>
    </motion.fieldset>
);

const InputField = ({ label, type = 'text', name, value, onChange, colSpan = 'lg:col-span-1', icon, readOnly = false, disabled = false, required = true, darkMode = true, hasError = false }: { label: string; type?: string; name: string; value: string; onChange: (e: any) => void; colSpan?: string; icon?: React.ReactNode; readOnly?: boolean; disabled?: boolean; required?: boolean; darkMode?: boolean; hasError?: boolean }) => (
    <div className={cn('flex flex-col group', colSpan)}>
        <label className={cn("text-sm font-semibold mb-2 flex items-center gap-2", hasError ? "text-red-600" : darkMode ? "text-neutral-200" : "text-gray-700")}>
            {icon && <span className={cn(hasError ? "text-red-500" : darkMode ? "text-indigo-400" : "text-gray-600")}>{icon}</span>}
            {label}
            {required && !readOnly && !disabled && <span className={cn("text-red-500 font-bold ml-1")}>*</span>}
            {hasError && <span className="ml-2 text-xs text-red-600 font-bold animate-pulse">⚠️ Requerido</span>}
        </label>
        <input 
            type={type} 
            name={name} 
            value={value || ''} 
            onChange={onChange} 
            readOnly={readOnly}
            disabled={disabled}
            required={required && !readOnly && !disabled}
            className={cn("w-full p-3 rounded-lg border transition-all text-base", hasError
                ? darkMode 
                    ? "bg-red-950/30 border-red-500 text-white placeholder-red-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 animate-pulse"
                    : "bg-red-50 border-red-400 text-gray-900 placeholder-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 font-medium"
                : darkMode 
                    ? "bg-neutral-800/80 border-neutral-600/70 text-white placeholder-neutral-400 focus:ring-2 focus:ring-indigo-500/70 focus:border-indigo-500 hover:border-neutral-500 focus:bg-neutral-800"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-gray-400 focus:border-gray-500 hover:border-gray-400 focus:bg-white font-medium")}
        />
    </div>
);

const SelectField = ({ label, name, value, onChange, children, colSpan = 'lg:col-span-1', icon, required = true, darkMode = true, hasError = false }: { label: string; name: string; value: string; onChange: (e: any) => void; children: React.ReactNode; colSpan?: string; icon?: React.ReactNode; required?: boolean; darkMode?: boolean; hasError?: boolean }) => (
    <div className={cn('flex flex-col group', colSpan)}>
        <label className={cn("text-sm font-semibold mb-2 flex items-center gap-2", hasError ? "text-red-600" : darkMode ? "text-neutral-200" : "text-gray-700")}>
            {icon && <span className={cn(hasError ? "text-red-500" : darkMode ? "text-indigo-400" : "text-gray-600")}>{icon}</span>}
            {label}
            {required && <span className={cn("text-red-500 font-bold ml-1")}>*</span>}
            {hasError && <span className="ml-2 text-xs text-red-600 font-bold animate-pulse">⚠️ Requerido</span>}
        </label>
        <select 
            name={name} 
            value={value} 
            onChange={onChange}
            required={required}
            className={cn("w-full p-3 rounded-lg border transition-all text-base font-medium", hasError
                ? darkMode
                    ? "bg-red-950/30 border-red-500 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 animate-pulse"
                    : "bg-red-50 border-red-400 text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                : darkMode
                    ? "bg-neutral-800/80 border-neutral-600/70 text-white focus:ring-2 focus:ring-indigo-500/70 focus:border-indigo-500 hover:border-neutral-500 focus:bg-neutral-800"
                    : "bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-400 focus:border-gray-500 hover:border-gray-400 focus:bg-white")}
        >
            {children}
        </select>
    </div>
);

const RadioField = ({ label, name, value, options, onChange, colSpan = 'lg:col-span-1', required = true, darkMode = true }: { label: string; name: string; value: string; options: { label: string; value: string; }[]; onChange: (e: any) => void; colSpan?: string; required?: boolean; darkMode?: boolean }) => (
    // 'w-full' es correcto
    <div className={cn('flex flex-col group w-full', colSpan)}> 
        <label className={cn("text-sm font-semibold mb-2 flex items-center gap-2", darkMode ? "text-neutral-200" : "text-gray-700")}>
            {label}
            {required && <span className={cn("text-red-500 font-bold ml-1")}>*</span>}
        </label>
        
        <div className="flex flex-col gap-4">
            {options.map(option => (
                <label 
                    key={option.value} 
                    // 'items-start' y 'w-full' son correctos
                    className={cn(
                        "flex items-start gap-3 text-base font-medium cursor-pointer transition-colors w-full", 
                        darkMode ? "text-neutral-200 hover:text-white" : "text-gray-800 hover:text-gray-900"
                    )}
                >
                    <input
                        type="radio"
                        name={name}
                        value={option.value}
                        checked={value === option.value}
                        onChange={onChange}
                        required={required}
                        // 'mt-1', 'shrink-0' y 'flex-shrink-0' son correctos
                        className={cn("mt-1 w-5 h-5 focus:ring-2 shrink-0 flex-shrink-0", darkMode
                            ? "text-indigo-500 focus:ring-indigo-500 border-neutral-500 bg-neutral-800"
                            : "text-gray-600 focus:ring-gray-500 border-gray-400 bg-white")}
                    />
                    {/* ESTA ES LA CLAVE: 'min-w-0' 
                        Esto fuerza al texto a "romperse" (hacer wrap) 
                        correctamente. ¡Y ya lo tienes!
                    */}
                    <p className="flex-1 leading-relaxed min-w-0 w-full"> 
                        {option.label}
                    </p>
                </label>
            ))}
        </div>
    </div>
);

// New CheckboxField component
interface CheckboxFieldProps {
  label: string;
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  colSpan?: string;
}

const CheckboxField: React.FC<CheckboxFieldProps & { darkMode?: boolean; required?: boolean }> = ({ label, name, checked, onChange, colSpan = 'lg:col-span-1', required = true, darkMode = true }) => (
    <div className={cn('flex flex-col group w-full', colSpan)}>
        <label className={cn("text-sm font-semibold mb-2 flex items-start gap-3 cursor-pointer transition-colors w-full", darkMode ? "text-neutral-200 hover:text-white" : "text-gray-900 hover:text-gray-950")}>
            <input
                type="checkbox"
                name={name}
                checked={checked}
                onChange={onChange}
                required={required}
                className={cn("mt-1 w-5 h-5 focus:ring-2 shrink-0 flex-shrink-0", darkMode
                    ? "text-indigo-500 focus:ring-indigo-500 border-neutral-500 bg-neutral-800"
                    : "text-blue-600 focus:ring-blue-500 border-blue-400 bg-white")}
            />
            <p className={cn("flex-1 leading-relaxed min-w-0 w-full", darkMode ? "text-neutral-200" : "text-gray-900")}>
                {label}
                {required && <span className={cn("text-red-500 font-bold ml-1")}>*</span>}
            </p>
        </label>
    </div>
);

// New Notification Component
interface NotificationProps {
  message: string;
  type: 'success' | 'error' | null;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  if (!message || !type) return null;

  const bgColor = type === 'success' ? 'bg-emerald-600' : 'bg-red-600';
  const textColor = 'text-white';

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-lg z-50 flex items-center justify-between gap-4 max-w-md w-full",
        bgColor,
        textColor
      )}
    >
      <p className="font-medium">{message}</p>
      <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
        &times;
      </button>
    </motion.div>
  );
};

// Helper to format dates for backend (DD/MM/AAAA to YYYY-MM-DD)
const formatDateForBackend = (dateString: string): string => {
  if (!dateString) return '';
  const parts = dateString.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateString; // Return as is if format is not DD/MM/AAAA
};

// Helper to generate HTML content for the PDF
const generateAnexoHtmlContent = (formData: AnexosFormData) => {
    const { personalData, academicFormation, languageSkills, officeSkills, 
            specializationStudies, workExperience, laborReferences, declarations, relativesInUGEL } = formData;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Anexo - Formato de Datos Personales</title>
        <style>
          @page {
            size: A4;
            margin: 0;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          html {
            width: 100%;
            max-width: 100%;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.4;
            color: #000000;
            background: white;
            width: 100%;
            max-width: 100%;
            min-width: 100%;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
            display: block;
            overflow: visible;
          }
          
          .container {
            max-width: 100%;
            min-width: 100%;
            width: 100%;
            margin: 0 auto;
            box-sizing: border-box;
            display: block;
          }
          
          .header {
            background: #4a5568;
            color: white;
            padding: 20px;
            margin-bottom: 20px;
            text-align: center;
            border: 1px solid #000;
          }
          
          .header h1 {
            font-size: 18pt;
            margin-bottom: 5px;
            font-weight: bold;
          }
          
          .header p {
            font-size: 10pt;
          }
          
          .codigo-badge {
            display: inline-block;
            background: rgba(255,255,255,0.2);
            padding: 5px 12px;
            margin-top: 8px;
            font-weight: bold;
            border: 1px solid rgba(255,255,255,0.3);
          }
          
          .section {
            margin-bottom: 20px;
          }
          
          .section-title {
            background: #4a5568;
            color: white;
            padding: 10px 15px;
            font-size: 12pt;
            font-weight: bold;
            margin-bottom: 12px;
            border: 1px solid #000;
          }
          
          .section-icon {
            margin-right: 10px;
            font-size: 16pt;
          }
          
          .data-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            background: #f5f5f5;
            padding: 20px;
            border: 1px solid #ccc;
          }
          
          .data-item {
            background: white;
            padding: 8px 10px;
            border: 1px solid #ddd;
          }
          
          .data-item.full-width {
            grid-column: 1 / -1;
          }
          
          .data-label {
            font-size: 9pt;
            color: #6c757d;
            text-transform: uppercase;
            font-weight: 600;
            margin-bottom: 5px;
            letter-spacing: 0.5px;
          }
          
          .data-value {
            font-size: 11pt;
            color: #2c3e50;
            font-weight: 500;
            line-height: 1.4;
          }
          
          .table-container {
            overflow-x: auto;
            margin-top: 12px;
            border-radius: 6px;
            /* box-shadow: 0 2px 4px rgba(0,0,0,0.05); */ /* Removed shadow */
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            background: white;
          }
          
          thead {
            background: #4a5568;
            color: white;
          }
          
          th {
            padding: 10px 8px;
            text-align: left;
            font-size: 9pt;
            font-weight: bold;
            border: 1px solid #000;
          }
          
          td {
            padding: 8px;
            border: 1px solid #ccc;
            font-size: 9pt;
            line-height: 1.3;
          }
          
          tbody tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          
          .experience-card {
            background: white;
            padding: 12px;
            margin-bottom: 12px;
            border: 1px solid #ccc;
          }
          
          .experience-header {
            border-bottom: 1px solid #000;
            padding-bottom: 8px;
            margin-bottom: 10px;
          }
          
          .experience-title {
            font-size: 11pt;
            font-weight: bold;
            color: #000;
            margin-bottom: 3px;
          }
          
          .experience-subtitle {
            font-size: 9pt;
            color: #333;
          }
          
          .functions-list {
            margin-top: 8px;
          }
          
          .function-item {
            padding: 4px 0;
            padding-left: 15px;
            position: relative;
            font-size: 9pt;
          }
          
          .function-item:before {
            content: "-";
            position: absolute;
            left: 0;
            color: #000;
            font-weight: bold;
          }
          
          .declarations-box {
            background: #f0f0f0;
            border: 1px solid #000;
            padding: 15px;
            margin-top: 12px;
          }
          
          .declaration-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 10px;
            font-size: 9pt;
            line-height: 1.4;
          }
          
          .declaration-item:last-child {
            margin-bottom: 0;
          }
          
          .check-icon {
            color: #000;
            font-weight: bold;
            margin-right: 8px;
            font-size: 10pt;
            min-width: 15px;
            display: inline-block;
            text-align: center;
          }
          
          .check-icon.unchecked {
            color: #666;
          }
          
          .signature-section {
            margin-top: 30px;
            text-align: center;
          }
          
          .signature-line {
            border-top: 1px solid #000;
            width: 250px;
            margin: 40px auto 8px;
          }

          .warning-box {
            background-color: #fff9e6;
            border: 1px solid #ccc;
            color: #000;
            padding: 12px;
            margin-top: 15px;
            font-size: 8pt;
          }
          
          .footer {
            margin-top: 25px;
            padding-top: 12px;
            border-top: 1px solid #ccc;
            text-align: center;
            font-size: 8pt;
            color: #333;
          }
          
          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            
            .section {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FORMATO DE DATOS PERSONALES</h1>
            <p>Anexo - Información del Postulante</p>
            <div class="codigo-badge">Código: ${personalData.codigo || 'N/A'}</div>
            <div class="codigo-badge">N° CAS: ${personalData.numeroCas || 'N/A'}</div>
          </div>

          <!-- Título Ficha - Anexos 05 -->
          <div style="text-align: center; margin: 20px 0; font-size: 16pt; font-weight: bold;">
            Ficha - Anexos 05
          </div>

          <!-- Título FICHA DE DATOS PERSONALES -->
          <div style="text-align: center; margin: 15px 0 20px 0; font-size: 14pt; font-weight: bold;">
            FICHA DE DATOS PERSONALES
          </div>

          <!-- DATOS PERSONALES -->
          <div class="section">
            <div class="section-title">
              <span class="section-icon">👤</span>
              I. DATOS PERSONALES
            </div>
            <div class="data-grid">
              <div class="data-item full-width">
                <div class="data-label">Puesto al que Postula</div>
                <div class="data-value">${personalData.nombrePuesto}</div>
              </div>
              <div class="data-item">
                <div class="data-label">Tipo de Documento</div>
                <div class="data-value">${personalData.tipoDocumento}</div>
              </div>
              <div class="data-item">
                <div class="data-label">${personalData.tipoDocumento === 'DNI' ? 'DNI' : 'Carnet de Extranjería'}</div>
                <div class="data-value">${personalData.tipoDocumento === 'DNI' ? personalData.dni : personalData.carnetExtranjeria}</div>
              </div>
              <div class="data-item">
                <div class="data-label">Apellido Paterno</div>
                <div class="data-value">${personalData.apellidoPaterno}</div>
              </div>
              <div class="data-item">
                <div class="data-label">Apellido Materno</div>
                <div class="data-value">${personalData.apellidoMaterno}</div>
              </div>
              <div class="data-item full-width">
                <div class="data-label">Nombres</div>
                <div class="data-value">${personalData.nombres}</div>
              </div>
              <div class="data-item">
                <div class="data-label">Género</div>
                <div class="data-value">${personalData.genero === 'M' ? 'Masculino' : 'Femenino'}</div>
              </div>
              <div class="data-item">
                <div class="data-label">Fecha de Nacimiento</div>
                <div class="data-value">${personalData.fechaNacimiento}</div>
              </div>
              <div class="data-item full-width">
                <div class="data-label">Lugar de Nacimiento</div>
                <div class="data-value">${personalData.lugarNacimiento}</div>
              </div>
              <div class="data-item full-width">
                <div class="data-label">Dirección</div>
                <div class="data-value">${personalData.direccion}</div>
              </div>
              <div class="data-item">
                <div class="data-label">Distrito</div>
                <div class="data-value">${personalData.distrito}</div>
              </div>
              <div class="data-item">
                <div class="data-label">Provincia</div>
                <div class="data-value">${personalData.provincia}</div>
              </div>
              <div class="data-item">
                <div class="data-label">Departamento</div>
                <div class="data-value">${personalData.departamento}</div>
              </div>
              <div class="data-item">
                <div class="data-label">Referencia</div>
                <div class="data-value">${personalData.referenciaDireccion}</div>
              </div>
              <div class="data-item">
                <div class="data-label">Correo Electrónico</div>
                <div class="data-value">${personalData.correoElectronico}</div>
              </div>
              <div class="data-item">
                <div class="data-label">Correo Alternativo</div>
                <div class="data-value">${personalData.correoElectronicoAlterno}</div>
              </div>
              <div class="data-item">
                <div class="data-label">Teléfono Domicilio</div>
                <div class="data-value">${personalData.telefonoDomicilio}</div>
              </div>
              <div class="data-item">
                <div class="data-label">Celular 1</div>
                <div class="data-value">${personalData.telefonoCelular1}</div>
              </div>
              <div class="data-item">
                <div class="data-label">Celular 2</div>
                <div class="data-value">${personalData.telefonoCelular2 || 'N/A'}</div>
              </div>
              <div class="data-item">
                <div class="data-label">CONADIS</div>
                <div class="data-value">${personalData.conadis}</div>
              </div>
              ${personalData.conadis === 'SI' ? `
                <div class="data-item">
                  <div class="data-label">N° Carnet CONADIS</div>
                  <div class="data-value">${personalData.nCarnetConadis}</div>
                </div>
                <div class="data-item">
                  <div class="data-label">Código CONADIS</div>
                  <div class="data-value">${personalData.codigoConadis}</div>
                </div>
              ` : ''}
              <div class="data-item">
                <div class="data-label">Fuerzas Armadas</div>
                <div class="data-value">${personalData.fuerzasArmadas}</div>
              </div>
              ${personalData.fuerzasArmadas === 'SI' ? `
                <div class="data-item">
                  <div class="data-label">N° Carnet FF.AA.</div>
                  <div class="data-value">${personalData.nCarnetFuerzasArmadas}</div>
                </div>
                <div class="data-item">
                  <div class="data-label">Código FF.AA.</div>
                  <div class="data-value">${personalData.codigoFuerzasArmadas}</div>
                </div>
              ` : ''}
              <div class="data-item full-width">
                <div class="data-label">Asistencia Especial</div>
                <div class="data-value">${personalData.asistenciaEspecial}</div>
              </div>
              <div class="data-item">
                <div class="data-label">Tiempo Sector Público</div>
                <div class="data-value">${personalData.tiempoSectorPublico}</div>
              </div>
              <div class="data-item">
                <div class="data-label">Tiempo Sector Privado</div>
                <div class="data-value">${personalData.tiempoSectorPrivado}</div>
              </div>
            </div>
          </div>

          <!-- COLEGIO PROFESIONAL -->
          <div class="section">
            <div class="section-title">
              <span class="section-icon">🎓</span>
              COLEGIO PROFESIONAL
            </div>
            <div class="data-grid">
              ${personalData.colegioProfesionalHabilitado === 'SI' ? `
                <div class="data-item full-width">
                  <div class="data-label">Colegio Profesional</div>
                  <div class="data-value">${personalData.colegioProfesional}</div>
                </div>
                <div class="data-item">
                  <div class="data-label">Habilitado</div>
                  <div class="data-value">${personalData.colegioProfesionalHabilitado}</div>
                </div>
                <div class="data-item">
                  <div class="data-label">N° Colegiatura</div>
                  <div class="data-value">${personalData.nColegiatura}</div>
                </div>
                <div class="data-item full-width">
                  <div class="data-label">Fecha de Vencimiento</div>
                  <div class="data-value">${personalData.fechaVencimientoColegiatura}</div>
                </div>
              ` : `
                <div class="data-item full-width">
                  <div class="data-label">Habilitado</div>
                  <div class="data-value">${personalData.colegioProfesionalHabilitado}</div>
                </div>
                <div class="data-item full-width">
                  <div class="data-label">Información de colegiatura no aplica</div>
                  <div class="data-value">El postulante no está habilitado o no aplica.</div>
                </div>
              `}
            </div>
          </div>

          <!-- FORMACIÓN ACADÉMICA -->
          <div class="section">
            <div class="section-title">
              <span class="section-icon">📚</span>
              II. FORMACIÓN ACADÉMICA
            </div>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nivel Educativo</th>
                    <th>Grado Académico</th>
                    <th>Carrera/Especialidad</th>
                    <th>Institución</th>
                    <th>Periodo</th>
                  </tr>
                </thead>
                <tbody>
                  ${academicFormation.map(item => `
                    <tr>
                      <td>${item.nivelEducativo === 'OTROS (ESPECIFICAR)' && item.otrosNivelEspecificar ? `${item.nivelEducativo}: ${item.otrosNivelEspecificar}` : item.nivelEducativo}</td>
                      <td>${item.gradoAcademico}</td>
                      <td>${item.nombreCarrera}</td>
                      <td>${item.institucion}</td>
                      <td>${item.anoDesde} - ${item.anoHasta}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- IDIOMAS -->
          <div class="section">
            <div class="section-title">
              <span class="section-icon">🌐</span>
              III. CONOCIMIENTO DE IDIOMAS
            </div>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Idioma/Dialecto</th>
                    <th>Nivel de Dominio</th>
                  </tr>
                </thead>
                <tbody>
                  ${languageSkills.map(skill => `
                    <tr>
                      <td>${skill.idiomaDialecto}</td>
                      <td>${skill.nivel}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- CONOCIMIENTOS DE OFIMÁTICA -->
          <div class="section">
            <div class="section-title">
              <span class="section-icon">💻</span>
              IV. CONOCIMIENTOS DE OFIMÁTICA
            </div>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Materia</th>
                    <th>Nivel de Dominio</th>
                  </tr>
                </thead>
                <tbody>
                  ${officeSkills.map(skill => `
                    <tr>
                      <td>${skill.materia}</td>
                      <td>${skill.nivel}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- ESTUDIOS DE ESPECIALIZACIÓN -->
          <div class="section">
            <div class="section-title">
              <span class="section-icon">🏆</span>
              V. ESTUDIOS DE ESPECIALIZACIÓN
            </div>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>NOMBRE DEL (CURSO, DIPLOMA, PROGRAMA DE ESPECIALIZACIÓN)</th>
                    <th>Centro de Estudio</th>
                    <th>Periodo</th>
                    <th>Horas</th>
                  </tr>
                </thead>
                <tbody>
                  ${specializationStudies.map(study => `
                    <tr>
                      <td>${study.tipoEstudio}</td>
                      <td>${study.nombreEstudio}</td>
                      <td>${study.centroEstudio}</td>
                      <td>${study.periodoInicio} - ${study.periodoFin}</td>
                      <td>${study.horas}h</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- EXPERIENCIA LABORAL -->
          <div class="section">
            <div class="section-title">
              <span class="section-icon">💼</span>
              VI. EXPERIENCIA LABORAL
            </div>
            ${workExperience.map(exp => `
              <div class="experience-card">
                <div class="experience-header">
                  <div class="experience-title">${exp.puestoCargo}</div>
                  <div class="experience-subtitle">${exp.empresaInstitucion} - ${exp.sectorGiroNegocio}</div>
                  <div class="experience-subtitle">Periodo: ${exp.periodoDesde} - ${exp.periodoHasta}</div>
                </div>
                <div class="functions-list">
                  <strong style="font-size: 10pt; color: #667eea;">Funciones Principales:</strong>
                  ${exp.funcionPrincipal1 ? `<div class="function-item">${exp.funcionPrincipal1}</div>` : ''}
                  ${exp.funcionPrincipal2 ? `<div class="function-item">${exp.funcionPrincipal2}</div>` : ''}
                  ${exp.funcionPrincipal3 ? `<div class="function-item">${exp.funcionPrincipal3}</div>` : ''}
                  ${exp.funcionPrincipal4 ? `<div class="function-item">${exp.funcionPrincipal4}</div>` : ''}
                  ${exp.funcionPrincipal5 ? `<div class="function-item">${exp.funcionPrincipal5}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>

          <!-- REFERENCIAS LABORALES -->
          <div class="section">
            <div style="text-align: center; margin: 20px 0 15px 0; font-size: 14pt; font-weight: bold;">
              Referencias Laborales
            </div>
            <div class="section-title">
              <span class="section-icon">📞</span>
              REFERENCIAS LABORALES
            </div>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Empresa / Entidad</th>
                    <th>Dirección</th>
                    <th>Cargo del Postulante</th>
                    <th>Nombre y Cargo del Jefe</th>
                    <th>Teléfonos</th>
                    <th>Correo Electrónico</th>
                  </tr>
                </thead>
                <tbody>
                  ${laborReferences && laborReferences.length > 0 ? laborReferences.map(ref => `
                    <tr>
                      <td>${ref.empresaEntidad || ''}</td>
                      <td>${ref.direccion || ''}</td>
                      <td>${ref.cargoPostulante || ''}</td>
                      <td>${ref.nombreCargoJefe || ''}</td>
                      <td>${ref.telefonos || ''}</td>
                      <td>${ref.correoElectronico || ''}</td>
                    </tr>
                  `).join('') : '<tr><td colspan="6" style="text-align: center; padding: 20px;">No hay referencias laborales registradas</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>

          <!-- DECLARACIONES -->
          <div class="section">
            <!-- Formato 02 - Declaración Jurada E -->
            <div style="text-align: center; margin: 20px 0 15px 0; font-size: 14pt; font-weight: bold;">
              Formato 02 - Declaración Jurada E: Delaración Jurada de Datos Personales
            </div>
            
            <!-- Tabla de Advertencia -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #ccc;">
              <tbody>
                <tr>
                  <td style="padding: 12px; background-color: #fff9e6; border: 1px solid #ccc; width: 150px; vertical-align: top; font-weight: bold;">
                    Advertencia:
                  </td>
                  <td style="padding: 12px; background-color: #fff9e6; border: 1px solid #ccc; font-size: 9pt;">
                    <p style="margin: 0 0 8px 0; line-height: 1.4;">
                      Artículo 34° numeral 34.3 del Texto Único Ordenado de la Ley N° 27444 – Ley del Procedimiento Administrativo General, aprobado por Decreto Supremo N° 004-2019-JUS.
                    </p>
                    <p style="margin: 0; line-height: 1.4;">
                      <strong>TEXTO:</strong> En caso de comprobar fraude o falsedad en la declaración, información o en la documentación presentada por el administrado, la entidad considerará no satisfecha la exigencia respectiva para todos sus efectos, procediendo a declarar la nulidad del acto administrativo sustentado en dicha declaración, información o documento; e imponer a quien haya empleado esa declaración, información o documento una multa en favor de la entidad de entre cinco (5) y diez (10) Unidades Impositivas Tributarias vigentes a la fecha de pago; y, además, si la conducta se adecua a los supuestos previstos en el Título XIX Delitos contra la Fe Pública del Código Penal, ésta deberá ser comunicada al Ministerio Público para que interponga la acción penal correspondiente.
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>

            <div class="section-title">
              <span class="section-icon">✓</span>
              DECLARACIONES JURADAS
            </div>
            <div class="declarations-box">
              <!-- Formato 02 - Declaración Jurada A -->
              <div style="margin: 15px 0 10px 0; font-size: 12pt; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 5px;">
                Formato 02 - Declaración Jurada A
              </div>
              <div style="margin-bottom: 10px; font-size: 11pt; font-weight: bold;">
                DECLARACIONES JURADAS ADICIONALES
              </div>
              
              <div class="declaration-item">
                <span class="check-icon ${declarations.datosConsignadosVerdaderos ? '' : 'unchecked'}">${declarations.datosConsignadosVerdaderos ? '✓' : '☐'}</span>
                <div>
                  <strong>Declaro bajo juramento que los datos consignados en este formulario expresan la verdad.</strong>
                </div>
              </div>
              <div class="declaration-item">
                <span class="check-icon ${declarations.leyProteccionDatos ? '' : 'unchecked'}">${declarations.leyProteccionDatos ? '✓' : '☐'}</span>
                <div>
                  <strong>Ley de Protección de Datos Personales:</strong> De conformidad con lo establecido en la Ley N° 29733 - Ley de Protección de Datos Personales - y su Reglamento, UGEL TALARA queda informado y da su consentimiento libre, previo, expreso, inequívoco e informado, para el tratamiento de sus datos; esto es, para la recopilación, registro, almacenamiento, conservación, utilización, transferencia nacional e internacional o cualquier otra forma de procesamiento de los datos personales de los cuales es titular y que han sido consignados en este Formulario.
                </div>
              </div>
              <div class="declaration-item">
                <span class="check-icon ${declarations.infoVerdadera ? '' : 'unchecked'}">${declarations.infoVerdadera ? '✓' : '☐'}</span>
                <div>
                  <strong>Veracidad de Datos:</strong> Declaro que la información proporcionada respecto a lo requerido por el perfil del puesto es verdadera y podrá ser verificada por la entidad.
                </div>
              </div>
              <div class="declaration-item">
                <span class="check-icon ${declarations.plenosDerechosCiviles ? '' : 'unchecked'}">${declarations.plenosDerechosCiviles ? '✓' : '☐'}</span>
                <div>
                  <strong>ESTAR EN EJERCICIO Y EN PLENO GOCE DE MIS DERECHOS CIVILES.</strong>
                </div>
              </div>
              <div class="declaration-item">
                <span class="check-icon ${declarations.cumploRequisitosMinimos ? '' : 'unchecked'}">${declarations.cumploRequisitosMinimos ? '✓' : '☐'}</span>
                <div>
                  <strong>CUMPLO CON LOS REQUISITOS MÍNIMOS ESTABLECIDOS EN LA CONVOCATORIA.</strong>
                </div>
              </div>
              <div class="declaration-item">
                <span class="check-icon ${declarations.noCondenaDolosa ? '' : 'unchecked'}">${declarations.noCondenaDolosa ? '✓' : '☐'}</span>
                <div>
                  <strong>NO TENGO CONDENA DOLOSA.</strong>
                </div>
              </div>
              <div class="declaration-item">
                <span class="check-icon ${declarations.noInhabilitacion ? '' : 'unchecked'}">${declarations.noInhabilitacion ? '✓' : '☐'}</span>
                <div>
                  <strong>NO TENGO INHABILITACIÓN PARA EL EJERCICIO DE LA FUNCIÓN PÚBLICA.</strong>
                </div>
              </div>
              <div class="declaration-item">
                <span class="check-icon ${declarations.noSentenciaCondenatoria ? '' : 'unchecked'}">${declarations.noSentenciaCondenatoria ? '✓' : '☐'}</span>
                <div>
                  <strong>NO TENGO SENTENCIA CONDENATORIA.</strong>
                </div>
              </div>
              
              <!-- Formato 02 - Declaración Jurada B -->
              <div style="margin: 20px 0 10px 0; font-size: 12pt; font-weight: bold; border-top: 1px solid #ccc; padding-top: 15px; border-bottom: 1px solid #000; padding-bottom: 5px;">
                Formato 02 - Declaración Jurada B
              </div>
              <div style="margin-bottom: 10px; font-size: 11pt; font-weight: bold;">
                DECLARACIÓN DE ANTECEDENTES
              </div>
              
              <div class="declaration-item">
                <span class="check-icon ${declarations.noAntecedentesPenales ? '' : 'unchecked'}">${declarations.noAntecedentesPenales ? '✓' : '☐'}</span>
                <div>
                  <strong>DECLARO BAJO JURAMENTO, no registrar antecedentes penales, a efecto de postular a una vacante según lo dispuesto por la Ley N° 29607, publicada el 26 de octubre de 2010 en el Diario Oficial "El Peruano". Autorizo a su Entidad a efectuar la comprobación de la veracidad de la presente declaración jurada solicitando tales antecedentes al Registro Nacional de Condenas del Poder Judicial. Asimismo, me comprometo a reemplazar la presente declaración jurada por los certificados originales, según sean requeridos.</strong>
                </div>
              </div>
              <div class="declaration-item">
                <span class="check-icon ${declarations.noAntecedentesPoliciales ? '' : 'unchecked'}">${declarations.noAntecedentesPoliciales ? '✓' : '☐'}</span>
                <div>
                  <strong>DECLARO BAJO JURAMENTO: No registrar antecedentes policiales y No registrar antecedentes judiciales, a nivel nacional. Asimismo, tomo conocimiento que en caso de resultar falsa la información que proporciono, autorizo a la UGEL Talara, a efectuar la comprobación de la veracidad de la presente Declaración Jurada; según lo establecido en el Artículo 411° del Código Penal y Delito contra la Fe Pública - Título XIX del Código Penal, acorde al artículo 32° de la Ley N° 27444, Ley del Procedimiento Administrativo General. Asimismo, me comprometo a reemplazar la presente declaración jurada por los certificados originales, según sean requeridos.</strong>
                </div>
              </div>
              <div class="declaration-item">
                <span class="check-icon ${declarations.noAntecedentesJudiciales ? '' : 'unchecked'}">${declarations.noAntecedentesJudiciales ? '✓' : '☐'}</span>
                <div>
                  <strong>NO TENGO ANTECEDENTES JUDICIALES.</strong>
                </div>
              </div>
              
              <!-- Formato 02 - Declaración Jurada D -->
              <div style="margin: 20px 0 10px 0; font-size: 12pt; font-weight: bold; border-top: 1px solid #ccc; padding-top: 15px; border-bottom: 1px solid #000; padding-bottom: 5px;">
                Formato 02 - Declaración Jurada D
              </div>
              <div style="margin-bottom: 10px; font-size: 11pt; font-weight: bold;">
                DECLARACIÓN DE PARIENTES EN UGEL TALARA
              </div>
              
              <div class="declaration-item">
                <span class="check-icon ${declarations.noParientesUGEL ? '' : 'unchecked'}">${declarations.noParientesUGEL ? '✓' : '☐'}</span>
                <div>
                  <strong>NO tengo pariente(s) o cónyuge con facultad directa o indirectamente para contratar en UGEL Talara.</strong>
                </div>
              </div>
              ${declarations.tieneParientesUGEL === 'SI' && relativesInUGEL && relativesInUGEL.length > 0 ? `
                <div style="margin: 15px 0;">
                  <strong>SI tengo pariente(s) o cónyuge que preste(n) servicios en UGEL Talara, cuyos datos señalo a continuación:</strong>
                  <div class="table-container" style="margin-top: 10px;">
                    <table>
                      <thead>
                        <tr>
                          <th>Grado o Relación de Parentesco</th>
                          <th>Área de Trabajo</th>
                          <th>Apellidos</th>
                          <th>Nombres</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${relativesInUGEL.map(relative => `
                          <tr>
                            <td>${relative.gradoParentesco || ''}</td>
                            <td>${relative.areaTrabajo || ''}</td>
                            <td>${relative.apellidos || ''}</td>
                            <td>${relative.nombres || ''}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                </div>
              ` : ''}
            </div>

            <div class="signature-section">
              <div class="signature-line"></div>
              <p style="font-weight: 600; font-size: 10pt;">${personalData.nombres} ${personalData.apellidoPaterno} ${personalData.apellidoMaterno}</p>
              <p style="font-size: 9pt; color: #6c757d;">${personalData.tipoDocumento}: ${personalData.tipoDocumento === 'DNI' ? personalData.dni : personalData.carnetExtranjeria}</p>
            </div>
          </div>

          <div class="footer">
            <p>Documento generado el ${new Date().toLocaleDateString('es-PE', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric' 
            })}</p>
            <p style="margin-top: 5px;">Este documento tiene carácter de Declaración Jurada</p>
          </div>
        </div>
      </body>
      </html>
    `;
};
    
export const AnexosSection = ({
  convocatoriaSeleccionada,
  navigate, // Destructure navigate prop
  authToken, // Destructure authToken prop
  darkMode,
  textClasses = "text-slate-100",
  textSecondaryClasses = "text-slate-300",
  currentSectionIndex = -1, // Por defecto muestra todas
  showOnlyCurrentSection = false, // Por defecto muestra todas
  onSectionSave, // Callback opcional para guardar sección
  validationErrors = {}, // Errores de validación por nombre de campo
  showCompletedAnexos = true, // Por defecto muestra la sección de anexos completados
}: AnexosSectionProps) => {
  
  // Mapeo de índices a secciones (0 = Datos Personales, 1 = Colegio Profesional, etc.)
  const sectionIndexMap: { [key: number]: string } = {
    0: 'datos-personales', // Datos Personales
    1: 'colegio-profesional', // Colegio Profesional
    2: 'formacion-academica', // Formación Académica
    3: 'idiomas', // Idiomas y/o Dialecto
    4: 'ofimatica', // Conocimientos de Ofimática
    5: 'especializacion', // Estudios de Especialización
    6: 'experiencia', // Experiencia Laboral
    7: 'declaraciones', // Declaración Jurada (ahora viene después de Experiencia Laboral)
    // 8: 'referencias', // Referencias Laborales - Movido fuera del flujo principal
  };
  
  const shouldShowSection = (sectionId: string): boolean => {
    if (!showOnlyCurrentSection || currentSectionIndex === -1) {
      return true; // Mostrar todas las secciones
    }
    return sectionIndexMap[currentSectionIndex] === sectionId;
  };

  const [anexosFormData, setAnexosFormData] = useState<AnexosFormData>({
    personalData: {
      codigo: '',
      nombrePuesto: '',
      tipoDocumento: 'DNI',
      dni: '',
      carnetExtranjeria: '',
      apellidoPaterno: '',
      apellidoMaterno: '',
      nombres: '',
      genero: 'M',
      direccion: '',
      provincia: '',
      departamento: '',
      distrito: '',
      // Initialize location IDs
      departamentoId: '',
      provinciaId: '',
      distritoId: '',
      referenciaDireccion: '',
      fechaNacimiento: '',
      lugarNacimiento: '',
      // Inicializar campos de lugar de nacimiento
      lugarNacimientoDepartamentoId: '',
      lugarNacimientoProvinciaId: '',
      lugarNacimientoDistritoId: '',
      lugarNacimientoDepartamento: '',
      lugarNacimientoProvincia: '',
      lugarNacimientoDistrito: '',
      correoElectronico: '',
      telefonoDomicilio: '',
      telefonoCelular1: '',
      telefonoCelular2: '',
      correoElectronicoAlterno: '',
      conadis: 'NO',
      nCarnetConadis: '',
      codigoConadis: '',
      fuerzasArmadas: 'NO',
      nCarnetFuerzasArmadas: '',
      codigoFuerzasArmadas: '',
      asistenciaEspecial: '',
      tiempoSectorPublico: '',
      tiempoSectorPrivado: '',
      // Initialize new fields
      colegioProfesional: '',
      colegioProfesionalHabilitado: 'NO',
      nColegiatura: '',
      fechaVencimientoColegiatura: '',
      numeroCas: '', // Added new field
    },
    academicFormation: [],
    languageSkills: [],
    officeSkills: [],
    specializationStudies: [],
    workExperience: [],
    laborReferences: [],
    declarations: {
      infoVerdadera: false,
      fechaDeclaracion: '',
      leyProteccionDatos: false,
      datosConsignadosVerdaderos: false,
      // New detailed declarations
      plenosDerechosCiviles: false,
      cumploRequisitosMinimos: false,
      noCondenaDolosa: false,
      noInhabilitacion: false,
      noSentenciaCondenatoria: false,
      noAntecedentesPenales: false,
      noAntecedentesPoliciales: false,
      noAntecedentesJudiciales: false,
      noParientesUGEL: false,
      tieneParientesUGEL: 'NO',
    },
    relativesInUGEL: [] as RelativesInUGEL[],
  });

  // Estados para manejar las opciones de ubicación
  const [departamentos, setDepartamentos] = useState<Location[]>([]);
  const [provincias, setProvincias] = useState<Location[]>([]);
  const [distritos, setDistritos] = useState<Location[]>([]);
  
  // Estados para lugar de nacimiento
  const [lugarNacimientoDepartamentos, setLugarNacimientoDepartamentos] = useState<Location[]>([]);
  const [lugarNacimientoProvincias, setLugarNacimientoProvincias] = useState<Location[]>([]);
  const [lugarNacimientoDistritos, setLugarNacimientoDistritos] = useState<Location[]>([]);

  // State for notifications
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // State for confirmation modal
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  // State para controlar si se debe guardar borrador
  const [shouldSaveDraft, setShouldSaveDraft] = useState(true);
  
  // State para indicar que se está guardando
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  
  // State para el último timestamp de guardado
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  
  // State para rastrear si hay un borrador guardado en la API
  const [hasDraftSaved, setHasDraftSaved] = useState(false);
  
  // State para la fecha de última actualización del borrador
  const [draftLastUpdated, setDraftLastUpdated] = useState<string | null>(null);
  
  // State para anexos completos guardados
  const [anexosCompletos, setAnexosCompletos] = useState<any[]>([]);
  const [loadingAnexosCompletos, setLoadingAnexosCompletos] = useState(false);
  const [showAnexosCompletos, setShowAnexosCompletos] = useState(true); // Mostrar por defecto
  
  // State para el anexo que se está editando
  const [editingAnexoId, setEditingAnexoId] = useState<number | null>(null);

  // Effect to auto-hide notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000); // Hide after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Effect para verificar si el curriculum ya fue subido
  useEffect(() => {
    const checkCurriculumStatus = async () => {
      if (!authToken) return;
      
      try {
        const response = await fetch(`${API_BASE_URL}/documentos/has-curriculum`, {
          headers: { 
            'Authorization': `Bearer ${authToken}`,
            'ngrok-skip-browser-warning': 'true'
          }
        });
        const hasCvData = await response.json().catch(() => ({ hasCurriculum: false }));
        
        // Si ya tiene curriculum subido, no guardar borradores
        if (hasCvData?.hasCurriculum) {
          setShouldSaveDraft(false);
          // Limpiar borrador si existe desde la API
          try {
            const convocatoriaId = convocatoriaSeleccionada?.id || null;
            await fetch(
              `${API_BASE_URL}/documentos/anexos/draft?convocatoriaId=${convocatoriaId || ''}`,
              {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${authToken}`,
                  'Content-Type': 'application/json',
                  'ngrok-skip-browser-warning': 'true'
                },
              }
            );
          } catch (error) {
            console.error('Error al limpiar borrador:', error);
          }
        }
      } catch (error) {
        console.error('Error al verificar curriculum:', error);
      }
    };
    
    checkCurriculumStatus();
  }, [authToken]);

  // Estado para rastrear si ya se cargó el borrador (por convocatoria)
  const [draftLoadedForConvocatoria, setDraftLoadedForConvocatoria] = useState<string | null>(null);
  const [savedAnexoLoaded, setSavedAnexoLoaded] = useState(false);

  // Effect para cargar anexo guardado (si existe) antes de cargar borrador
  useEffect(() => {
    if (!authToken) {
      return;
    }

    const loadSavedAnexo = async () => {
      try {
        // Primero obtener la lista de anexos del usuario
        const anexosResponse = await fetch(`${API_BASE_URL}/anexos`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
        });

        if (!anexosResponse.ok) {
          return;
        }

        const anexos = await anexosResponse.json();
        const anexosArray = Array.isArray(anexos) ? anexos : [anexos];
        
        let anexoGuardado = null;
        
        // IMPORTANTE: Cada convocatoria debe tener su propio anexo independiente
        // NO reutilizar datos de anexos de otras convocatorias
        
        if (convocatoriaSeleccionada?.id) {
          // Buscar SOLO anexos que coincidan exactamente con esta convocatoria
          const convocatoriaIdNum = Number(convocatoriaSeleccionada.id);
          anexoGuardado = anexosArray.find((a: any) => {
            const anexoConvocatoriaId = a.IDCONVOCATORIA ? Number(a.IDCONVOCATORIA) : null;
            return anexoConvocatoriaId === convocatoriaIdNum;
          });
          
          if (anexoGuardado && anexoGuardado.IDANEXO) {
            console.log('✅ Encontrado anexo específico para esta convocatoria:', {
              anexoId: anexoGuardado.IDANEXO,
              convocatoriaId: anexoGuardado.IDCONVOCATORIA,
              convocatoriaSeleccionada: convocatoriaSeleccionada.id
            });
          } else {
            console.log('ℹ️ No se encontró anexo para esta convocatoria específica. Se creará un nuevo anexo independiente.');
            // NO buscar anexos de otras convocatorias ni sin convocatoria
            // Cada convocatoria debe tener su propio anexo
            return; // Salir sin cargar ningún anexo
          }
        } else {
          // Si no hay convocatoria seleccionada, buscar el último anexo sin convocatoria (solo para registro general)
          const anexosSinConvocatoria = anexosArray
            .filter((a: any) => !a.IDCONVOCATORIA || a.IDCONVOCATORIA === null)
            .sort((a: any, b: any) => {
              const fechaA = new Date(a.fechaCreacion || 0).getTime();
              const fechaB = new Date(b.fechaCreacion || 0).getTime();
              return fechaB - fechaA; // Más reciente primero
            });
          
          if (anexosSinConvocatoria.length > 0) {
            anexoGuardado = anexosSinConvocatoria[0];
            console.log('📋 Encontrado anexo del registro (sin convocatoria), cargando automáticamente...');
          } else {
            console.log('ℹ️ No se encontró anexo sin convocatoria.');
            return; // Salir sin cargar ningún anexo
          }
        }

        if (!anexoGuardado || !anexoGuardado.IDANEXO) {
          console.log('ℹ️ No se encontró ningún anexo guardado para cargar');
          return;
        }

        // Obtener datos completos del anexo guardado
        const completoResponse = await fetch(
          `${API_BASE_URL}/anexos/${anexoGuardado.IDANEXO}/completo`,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true'
            },
          }
        );

        if (!completoResponse.ok) {
          return;
        }

        const anexoCompleto = await completoResponse.json();
        console.log('📥 Cargando anexo guardado completo:', anexoCompleto);

        // Restaurar todos los datos del anexo guardado
        if (anexoCompleto.formData) {
          console.log('📋 Restaurando datos completos del anexo:', {
            personalData: Object.keys(anexoCompleto.formData.personalData || {}).length,
            academicFormation: anexoCompleto.formData.academicFormation?.length || 0,
            languageSkills: anexoCompleto.formData.languageSkills?.length || 0,
            officeSkills: anexoCompleto.formData.officeSkills?.length || 0,
            specializationStudies: anexoCompleto.formData.specializationStudies?.length || 0,
            workExperience: anexoCompleto.formData.workExperience?.length || 0,
            laborReferences: anexoCompleto.formData.laborReferences?.length || 0,
            relativesInUGEL: anexoCompleto.formData.relativesInUGEL?.length || 0,
            declarations: Object.keys(anexoCompleto.formData.declarations || {}).length,
          });

          // Preparar datos personales, actualizando campos de convocatoria si hay una seleccionada
          const personalDataRestored = {
            ...anexoCompleto.formData.personalData,
          };
          
          // IMPORTANTE: Asegurar que los campos de la convocatoria estén actualizados
          // con los datos de la convocatoria seleccionada (si hay una)
          if (convocatoriaSeleccionada?.id) {
            // Actualizar siempre con los datos de la convocatoria seleccionada
            // para mantener la consistencia
            personalDataRestored.codigo = convocatoriaSeleccionada.id.toString() || personalDataRestored.codigo || '';
            personalDataRestored.nombrePuesto = convocatoriaSeleccionada.puesto || personalDataRestored.nombrePuesto || '';
            personalDataRestored.numeroCas = convocatoriaSeleccionada.numero_cas || convocatoriaSeleccionada.numeroCAS || personalDataRestored.numeroCas || '';
            console.log('✅ Anexo cargado para convocatoria específica. Datos de convocatoria actualizados:', {
              codigo: personalDataRestored.codigo,
              nombrePuesto: personalDataRestored.nombrePuesto,
              numeroCas: personalDataRestored.numeroCas,
              anexoConvocatoriaId: anexoGuardado.IDCONVOCATORIA,
              convocatoriaSeleccionada: convocatoriaSeleccionada.id
            });
          }

          // Reemplazar completamente los datos (no hacer merge)
          setAnexosFormData({
            personalData: personalDataRestored,
            academicFormation: anexoCompleto.formData.academicFormation || [],
            languageSkills: anexoCompleto.formData.languageSkills || [],
            officeSkills: anexoCompleto.formData.officeSkills || [],
            specializationStudies: anexoCompleto.formData.specializationStudies || [],
            workExperience: anexoCompleto.formData.workExperience || [],
            laborReferences: anexoCompleto.formData.laborReferences || [],
            relativesInUGEL: anexoCompleto.formData.relativesInUGEL || [],
            declarations: anexoCompleto.formData.declarations || {
              veracidadDatos: false,
              cumplirRequisitos: false,
              noEstarSancionado: false,
              noEstarInhabilitado: false,
              noTenerVinculoLaboral: false,
              noTenerProcesoJudicial: false,
              noTenerProcesoDisciplinario: false,
            },
          });

          // Cargar ubicaciones si existen
          if (anexoCompleto.formData.personalData?.departamentoId) {
            const provinciasData = getProvinciasByDepartamento(anexoCompleto.formData.personalData.departamentoId);
            setProvincias(provinciasData);
            
            if (anexoCompleto.formData.personalData?.provinciaId) {
              const distritosData = getDistritosByProvincia(
                anexoCompleto.formData.personalData.departamentoId,
                anexoCompleto.formData.personalData.provinciaId
              );
              setDistritos(distritosData);
            }
          }

          if (anexoCompleto.formData.personalData?.lugarNacimientoDepartamentoId) {
            const lugarProvinciasData = getProvinciasByDepartamento(anexoCompleto.formData.personalData.lugarNacimientoDepartamentoId);
            setLugarNacimientoProvincias(lugarProvinciasData);
            
            if (anexoCompleto.formData.personalData?.lugarNacimientoProvinciaId) {
              const lugarDistritosData = getDistritosByProvincia(
                anexoCompleto.formData.personalData.lugarNacimientoDepartamentoId,
                anexoCompleto.formData.personalData.lugarNacimientoProvinciaId
              );
              setLugarNacimientoDistritos(lugarDistritosData);
            }
          }

          setSavedAnexoLoaded(true);
          console.log('✅ Anexo guardado cargado exitosamente');
        }
      } catch (error) {
        console.error('❌ Error al cargar anexo guardado:', error);
      }
    };

    loadSavedAnexo();
  }, [authToken, convocatoriaSeleccionada?.id]);
  
  // Effect para cargar datos del anexo anterior cuando cambia la convocatoria
  // Esto asegura que cada convocatoria tenga su propio anexo independiente
  // pero permite reutilizar los datos del anexo anterior
  useEffect(() => {
    if (convocatoriaSeleccionada?.id) {
      // Verificar si hay un anexo guardado para esta convocatoria
      const anexoParaEstaConvocatoria = anexosCompletos.find((a: any) => 
        a.IDCONVOCATORIA && Number(a.IDCONVOCATORIA) === Number(convocatoriaSeleccionada.id)
      );
      
      if (anexoParaEstaConvocatoria) {
        // Si ya existe un anexo para esta convocatoria, cargarlo
        console.log('✅ Encontrado anexo para esta convocatoria, cargándolo:', {
          anexoId: anexoParaEstaConvocatoria.IDANEXO_COMPLETO || anexoParaEstaConvocatoria.IDANEXO,
          convocatoriaId: convocatoriaSeleccionada.id
        });
        setEditingAnexoId(anexoParaEstaConvocatoria.IDANEXO_COMPLETO || anexoParaEstaConvocatoria.IDANEXO);
        // Cargar los datos del anexo
        loadAnexoForEdit(anexoParaEstaConvocatoria);
      } else if (editingAnexoId) {
        // Si hay un editingAnexoId pero no corresponde a esta convocatoria
        const anexoCorresponde = anexosCompletos.find((a: any) => 
          (a.IDANEXO_COMPLETO === editingAnexoId || a.IDANEXO === editingAnexoId) &&
          a.IDCONVOCATORIA && Number(a.IDCONVOCATORIA) === Number(convocatoriaSeleccionada.id)
        );
        
        if (!anexoCorresponde) {
          // El anexo no corresponde a esta convocatoria
          // Buscar el anexo más reciente para cargar sus datos
          const anexosOrdenados = [...anexosCompletos].sort((a: any, b: any) => {
            const fechaA = a.fechaActualizacion || a.fechaCreacion;
            const fechaB = b.fechaActualizacion || b.fechaCreacion;
            const timestampA = fechaA ? new Date(fechaA).getTime() : 0;
            const timestampB = fechaB ? new Date(fechaB).getTime() : 0;
            return timestampB - timestampA;
          });
          
          if (anexosOrdenados.length > 0) {
            const anexoMasReciente = anexosOrdenados[0];
            console.log('🔄 Cambio de convocatoria detectado. Cargando datos del anexo más reciente para reutilizar:', {
              anexoId: anexoMasReciente.IDANEXO_COMPLETO || anexoMasReciente.IDANEXO,
              convocatoriaAnterior: anexoMasReciente.IDCONVOCATORIA,
              convocatoriaActual: convocatoriaSeleccionada.id
            });
            
            // Limpiar el ID de edición para que se cree un nuevo anexo
            setEditingAnexoId(null);
            
            // Cargar los datos del anexo más reciente en el formulario
            // Esto permitirá reutilizar la información para la nueva convocatoria
            loadAnexoForEdit(anexoMasReciente);
          } else {
            // No hay anexos anteriores, solo limpiar el ID
            setEditingAnexoId(null);
          }
        }
      } else {
        // No hay editingAnexoId, buscar el anexo más reciente para cargar sus datos
        const anexosOrdenados = [...anexosCompletos].sort((a: any, b: any) => {
          const fechaA = a.fechaActualizacion || a.fechaCreacion;
          const fechaB = b.fechaActualizacion || b.fechaCreacion;
          const timestampA = fechaA ? new Date(fechaA).getTime() : 0;
          const timestampB = fechaB ? new Date(fechaB).getTime() : 0;
          return timestampB - timestampA;
        });
        
        if (anexosOrdenados.length > 0) {
          const anexoMasReciente = anexosOrdenados[0];
          console.log('📋 Cargando datos del anexo más reciente para nueva convocatoria:', {
            anexoId: anexoMasReciente.IDANEXO_COMPLETO || anexoMasReciente.IDANEXO,
            convocatoriaAnterior: anexoMasReciente.IDCONVOCATORIA,
            convocatoriaActual: convocatoriaSeleccionada.id
          });
          
          // Cargar los datos del anexo más reciente en el formulario
          loadAnexoForEdit(anexoMasReciente);
        }
      }
    } else if (!convocatoriaSeleccionada?.id && editingAnexoId) {
      // Si no hay convocatoria seleccionada, mantener el editingAnexoId
      // (podría ser un anexo sin convocatoria)
    }
  }, [convocatoriaSeleccionada?.id, anexosCompletos]);

  // Effect para rellenar automáticamente codigo, nombrePuesto y numeroCas cuando se selecciona una convocatoria
  useEffect(() => {
    if (convocatoriaSeleccionada && convocatoriaSeleccionada.id) {
      console.log('🔄 Actualizando campos de convocatoria:', {
        id: convocatoriaSeleccionada.id,
        puesto: convocatoriaSeleccionada.puesto,
        numero_cas: convocatoriaSeleccionada.numero_cas || convocatoriaSeleccionada.numeroCAS
      });

      const codigo = convocatoriaSeleccionada.id?.toString() || '';
      const nombrePuesto = convocatoriaSeleccionada.puesto || '';
      const numeroCas = convocatoriaSeleccionada.numero_cas || convocatoriaSeleccionada.numeroCAS || '';

      setAnexosFormData(prevData => {
        // Siempre actualizar los campos con los datos de la convocatoria seleccionada
        // Esto asegura que los campos se rellenen automáticamente cuando se selecciona una convocatoria
        const currentCodigo = prevData.personalData.codigo || '';
        const currentPuesto = prevData.personalData.nombrePuesto || '';
        const currentCas = prevData.personalData.numeroCas || '';

        // Actualizar si están vacíos O si la convocatoria cambió (codigo diferente)
        const shouldUpdateCodigo = !currentCodigo || currentCodigo !== codigo;
        const shouldUpdatePuesto = !currentPuesto || shouldUpdateCodigo; // Si cambió el código, actualizar puesto
        const shouldUpdateCas = !currentCas || shouldUpdateCodigo; // Si cambió el código, actualizar CAS

        if (shouldUpdateCodigo || shouldUpdatePuesto || shouldUpdateCas) {
          console.log('✅ Actualizando campos de convocatoria:', {
            codigo: shouldUpdateCodigo ? codigo : currentCodigo,
            nombrePuesto: shouldUpdatePuesto ? nombrePuesto : currentPuesto,
            numeroCas: shouldUpdateCas ? numeroCas : currentCas,
            motivo: {
              codigo: shouldUpdateCodigo ? 'vacío o convocatoria cambió' : 'sin cambios',
              puesto: shouldUpdatePuesto ? 'vacío o convocatoria cambió' : 'sin cambios',
              cas: shouldUpdateCas ? 'vacío o convocatoria cambió' : 'sin cambios'
            }
          });

          return {
            ...prevData,
            personalData: {
              ...prevData.personalData,
              codigo: shouldUpdateCodigo ? codigo : prevData.personalData.codigo,
              nombrePuesto: shouldUpdatePuesto ? nombrePuesto : prevData.personalData.nombrePuesto,
              numeroCas: shouldUpdateCas ? numeroCas : prevData.personalData.numeroCas,
            }
          };
        }

        return prevData;
      });
    }
  }, [convocatoriaSeleccionada?.id, convocatoriaSeleccionada?.puesto, convocatoriaSeleccionada?.numero_cas, convocatoriaSeleccionada?.numeroCAS]);

  // Effect para cargar borrador al inicio (después de que se carguen los datos del usuario y el anexo guardado)
  useEffect(() => {
    if (!authToken || !shouldSaveDraft) {
      console.log('⚠️ No se puede cargar borrador:', { authToken: !!authToken, shouldSaveDraft });
      return;
    }

    // Si ya se cargó un anexo guardado, no cargar borrador
    if (savedAnexoLoaded) {
      console.log('⏭️ Ya hay un anexo guardado, no cargar borrador');
      return;
    }
    
    const convocatoriaIdStr = convocatoriaSeleccionada?.id?.toString() || 'null';
    
    // Si ya se cargó el borrador para esta convocatoria, no volver a cargar
    if (draftLoadedForConvocatoria === convocatoriaIdStr) {
      console.log('⏭️ Borrador ya cargado para esta convocatoria:', convocatoriaIdStr);
      return;
    }
    
    const loadDraft = async () => {
      // Esperar más tiempo para que se carguen primero los datos del usuario y la convocatoria
      // Esperar 3 segundos para asegurar que los datos del usuario se carguen primero
      console.log('⏳ Esperando 3 segundos antes de cargar borrador...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('🔄 Iniciando carga de borrador desde la API...', {
        convocatoriaId: convocatoriaSeleccionada?.id || null,
        authToken: !!authToken
      });
      
      try {
        const convocatoriaId = convocatoriaSeleccionada?.id || null;
        
        // Cargar borrador desde la API
        const response = await fetch(
          `${API_BASE_URL}/documentos/anexos/draft?convocatoriaId=${convocatoriaId || ''}`,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true'
            },
          }
        );
        
        // Si el response no es ok, no es un error crítico - simplemente no hay borrador
        if (!response.ok && response.status !== 404) {
          throw new Error(`Error al cargar borrador: ${response.statusText}`);
        }
        
        if (response.status === 404) {
          // No hay borrador guardado, esto es normal - no es un error
          console.log('ℹ️ No se encontró borrador guardado para esta convocatoria (esto es normal si es la primera vez)');
          setHasDraftSaved(false);
          setDraftLastUpdated(null);
          setDraftLoadedForConvocatoria(convocatoriaIdStr); // Marcar como cargado para esta convocatoria
          return;
        }
        
        if (!response.ok) {
          throw new Error(`Error al cargar borrador: ${response.statusText}`);
        }
        
        const draftData = await response.json();
        
        console.log('📦 Datos del borrador recibidos de la API:', {
          id: draftData.id,
          convocatoriaId: draftData.convocatoriaId,
          fechaActualizacion: draftData.fechaActualizacion,
          tieneFormData: !!draftData.formData,
          tipoFormData: typeof draftData.formData,
          keysFormData: draftData.formData ? Object.keys(draftData.formData) : []
        });
        
        // Verificar que formData existe y es válido
        if (!draftData.formData) {
          console.error('❌ El borrador no tiene formData válido');
          setDraftLoadedForConvocatoria(convocatoriaIdStr);
          return;
        }
        
        // Actualizar estado de borrador guardado
        setHasDraftSaved(true);
        if (draftData.fechaActualizacion) {
          const fecha = new Date(draftData.fechaActualizacion);
          setDraftLastUpdated(fecha.toLocaleDateString('es-PE') + ' a las ' + fecha.toLocaleTimeString('es-PE'));
        }
        
        const restoredData = draftData.formData;
        
        // Verificar que el borrador sea de la convocatoria actual
        // Normalizar tipos: convertir ambos a número para comparar
        const draftConvocatoriaId = draftData.convocatoriaId != null ? Number(draftData.convocatoriaId) : null;
        const currentConvocatoriaId = convocatoriaSeleccionada?.id != null ? Number(convocatoriaSeleccionada.id) : null;
        
        if (convocatoriaSeleccionada && draftConvocatoriaId === currentConvocatoriaId) {
          
          // Restaurar datos del formulario - EL BORRADOR TIENE PRIORIDAD ABSOLUTA
          // IMPORTANTE: Usar el borrador completo, no mergear con datos del usuario
          // PERO: Asegurar que los campos de la convocatoria estén actualizados
          const codigoFromConvocatoria = convocatoriaSeleccionada?.id?.toString() || '';
          const puestoFromConvocatoria = convocatoriaSeleccionada?.puesto || '';
          const casFromConvocatoria = convocatoriaSeleccionada?.numero_cas || convocatoriaSeleccionada?.numeroCAS || '';
          
          console.log('📥 Restaurando borrador completo (reemplazando todo):', {
            totalCampos: Object.keys(restoredData).length,
            personalData: Object.keys(restoredData.personalData || {}).length,
            academicFormation: restoredData.academicFormation?.length || 0,
            languageSkills: restoredData.languageSkills?.length || 0,
            officeSkills: restoredData.officeSkills?.length || 0,
            specializationStudies: restoredData.specializationStudies?.length || 0,
            workExperience: restoredData.workExperience?.length || 0,
            laborReferences: restoredData.laborReferences?.length || 0,
            relativesInUGEL: restoredData.relativesInUGEL?.length || 0,
          });
          
          // RESTAURAR EL BORRADOR COMPLETO - NO MERGEAR
          // Verificar que restoredData tiene la estructura correcta
          if (!restoredData || typeof restoredData !== 'object') {
            console.error('❌ restoredData no es un objeto válido:', restoredData);
            setDraftLoadedForConvocatoria(convocatoriaIdStr);
            return;
          }
          
          console.log('🔄 Aplicando borrador al formulario...');
          
          // Asegurar que todos los campos existan en el borrador
          const completeDraft: AnexosFormData = {
            personalData: {
              ...restoredData.personalData,
              // Actualizar campos de convocatoria con los valores actuales de la convocatoria seleccionada
              codigo: codigoFromConvocatoria || restoredData.personalData?.codigo || '',
              nombrePuesto: puestoFromConvocatoria || restoredData.personalData?.nombrePuesto || '',
              numeroCas: casFromConvocatoria || restoredData.personalData?.numeroCas || '',
            },
            academicFormation: Array.isArray(restoredData.academicFormation) ? restoredData.academicFormation : [],
            languageSkills: Array.isArray(restoredData.languageSkills) ? restoredData.languageSkills : [],
            officeSkills: Array.isArray(restoredData.officeSkills) ? restoredData.officeSkills : [],
            specializationStudies: Array.isArray(restoredData.specializationStudies) ? restoredData.specializationStudies : [],
            workExperience: Array.isArray(restoredData.workExperience) ? restoredData.workExperience : [],
            laborReferences: Array.isArray(restoredData.laborReferences) ? restoredData.laborReferences : [],
            relativesInUGEL: Array.isArray(restoredData.relativesInUGEL) ? restoredData.relativesInUGEL : [],
            declarations: {
              ...restoredData.declarations,
            }
          };
          
          setAnexosFormData(completeDraft);
          setDraftLoadedForConvocatoria(convocatoriaIdStr);
          
          console.log('✅ Borrador aplicado al formulario:', {
            personalData: Object.keys(completeDraft.personalData).length,
            academicFormation: completeDraft.academicFormation.length,
            languageSkills: completeDraft.languageSkills.length,
            workExperience: completeDraft.workExperience.length,
            convocatoriaId: convocatoriaIdStr,
          });
          
          // Restaurar estados de dropdowns dependientes para ubicación
          if (restoredData.personalData.departamentoId) {
            const provinciasData = getProvinciasByDepartamento(restoredData.personalData.departamentoId);
            setProvincias(provinciasData);
            if (restoredData.personalData.provinciaId) {
              const distritosData = getDistritosByProvincia(restoredData.personalData.departamentoId, restoredData.personalData.provinciaId);
              setDistritos(distritosData);
            }
          }
          
          // Restaurar estados de dropdowns dependientes para lugar de nacimiento
          if (restoredData.personalData.lugarNacimientoDepartamentoId) {
            const lugarProvinciasData = getProvinciasByDepartamento(restoredData.personalData.lugarNacimientoDepartamentoId);
            setLugarNacimientoProvincias(lugarProvinciasData);
            if (restoredData.personalData.lugarNacimientoProvinciaId) {
              const lugarDistritosData = getDistritosByProvincia(restoredData.personalData.lugarNacimientoDepartamentoId, restoredData.personalData.lugarNacimientoProvinciaId);
              setLugarNacimientoDistritos(lugarDistritosData);
            }
          }
          
          setNotification({ 
            message: '✅ Se encontró un borrador guardado. Todos tus datos se han restaurado correctamente.', 
            type: 'success' 
          });
          
          console.log('✅ Borrador restaurado exitosamente');
        } else if (!convocatoriaSeleccionada) {
          // Si no hay convocatoria seleccionada, cargar el borrador de todos modos
          const restoredData = draftData.formData;
          
          console.log('📥 Restaurando borrador completo (sin convocatoria, reemplazando todo):', {
            totalCampos: Object.keys(restoredData).length,
            personalData: Object.keys(restoredData.personalData || {}).length,
            academicFormation: restoredData.academicFormation?.length || 0,
            languageSkills: restoredData.languageSkills?.length || 0,
            officeSkills: restoredData.officeSkills?.length || 0,
            specializationStudies: restoredData.specializationStudies?.length || 0,
            workExperience: restoredData.workExperience?.length || 0,
            laborReferences: restoredData.laborReferences?.length || 0,
            relativesInUGEL: restoredData.relativesInUGEL?.length || 0,
          });
          
          // RESTAURAR EL BORRADOR COMPLETO - NO MERGEAR
          // Asegurar que todos los campos existan en el borrador
          const completeDraft: AnexosFormData = {
            personalData: {
              ...restoredData.personalData,
            },
            academicFormation: Array.isArray(restoredData.academicFormation) ? restoredData.academicFormation : [],
            languageSkills: Array.isArray(restoredData.languageSkills) ? restoredData.languageSkills : [],
            officeSkills: Array.isArray(restoredData.officeSkills) ? restoredData.officeSkills : [],
            specializationStudies: Array.isArray(restoredData.specializationStudies) ? restoredData.specializationStudies : [],
            workExperience: Array.isArray(restoredData.workExperience) ? restoredData.workExperience : [],
            laborReferences: Array.isArray(restoredData.laborReferences) ? restoredData.laborReferences : [],
            relativesInUGEL: Array.isArray(restoredData.relativesInUGEL) ? restoredData.relativesInUGEL : [],
            declarations: {
              ...restoredData.declarations,
            }
          };
          
          setAnexosFormData(completeDraft);
          setDraftLoadedForConvocatoria('null');
          
          console.log('✅ Borrador aplicado al formulario (sin convocatoria):', {
            personalData: Object.keys(completeDraft.personalData).length,
            academicFormation: completeDraft.academicFormation.length,
            languageSkills: completeDraft.languageSkills.length,
            workExperience: completeDraft.workExperience.length,
          });
          
          // Restaurar estados de dropdowns dependientes
          if (restoredData.personalData.departamentoId) {
            const provinciasData = getProvinciasByDepartamento(restoredData.personalData.departamentoId);
            setProvincias(provinciasData);
            if (restoredData.personalData.provinciaId) {
              const distritosData = getDistritosByProvincia(restoredData.personalData.departamentoId, restoredData.personalData.provinciaId);
              setDistritos(distritosData);
            }
          }
          
          if (restoredData.personalData.lugarNacimientoDepartamentoId) {
            const lugarProvinciasData = getProvinciasByDepartamento(restoredData.personalData.lugarNacimientoDepartamentoId);
            setLugarNacimientoProvincias(lugarProvinciasData);
            if (restoredData.personalData.lugarNacimientoProvinciaId) {
              const lugarDistritosData = getDistritosByProvincia(restoredData.personalData.lugarNacimientoDepartamentoId, restoredData.personalData.lugarNacimientoProvinciaId);
              setLugarNacimientoDistritos(lugarDistritosData);
            }
          }
          
          setNotification({ 
            message: '✅ Se encontró un borrador guardado. Todos tus datos se han restaurado correctamente.', 
            type: 'success' 
          });
          
          console.log('✅ Borrador restaurado exitosamente (sin convocatoria)');
        } else {
          // Si hay convocatoria pero no coincide con el borrador
          console.log('⚠️ Borrador encontrado pero es de otra convocatoria:', {
            borradorConvocatoriaId: draftData.convocatoriaId,
            convocatoriaActual: convocatoriaSeleccionada?.id
          });
          setDraftLoadedForConvocatoria(convocatoriaIdStr); // Marcar como cargado para esta convocatoria
        }
      } catch (error) {
        console.error('Error al cargar borrador desde la API:', error);
        // No mostrar error si es 404 (no hay borrador)
        if (error instanceof Error && !error.message.includes('404')) {
          console.warn('⚠️ No se pudo cargar el borrador desde la API:', error.message);
        }
      }
    };
    
    loadDraft();
  }, [authToken, shouldSaveDraft, convocatoriaSeleccionada?.id]); // Cargar cuando cambia authToken, shouldSaveDraft o convocatoria

  // Función para guardar borrador (extraída para reutilizar)
  const saveDraftToAPI = async (silent = false) => {
    // Obtener token desde prop o localStorage
    const token = authToken || localStorage.getItem('token');
    if (!token || !shouldSaveDraft) {
      if (!silent) {
        console.log('⚠️ No se puede guardar borrador: token o shouldSaveDraft no disponible');
      }
      return;
    }
    
    // Evitar guardar si ya se está guardando
    if (isSavingDraft) {
      return;
    }
    
    try {
      setIsSavingDraft(true);
      
      const convocatoriaId = convocatoriaSeleccionada?.id || null;
      
      // Preparar datos del formulario para guardar - INCLUIR TODOS LOS CAMPOS
      const formDataToSave: AnexosFormData = {
        // Datos personales completos
        personalData: {
          ...anexosFormData.personalData,
          // Asegurar que todos los campos estén presentes
          codigo: anexosFormData.personalData.codigo || '',
          nombrePuesto: anexosFormData.personalData.nombrePuesto || '',
          tipoDocumento: anexosFormData.personalData.tipoDocumento || 'DNI',
          dni: anexosFormData.personalData.dni || '',
          carnetExtranjeria: anexosFormData.personalData.carnetExtranjeria || '',
          apellidoPaterno: anexosFormData.personalData.apellidoPaterno || '',
          apellidoMaterno: anexosFormData.personalData.apellidoMaterno || '',
          nombres: anexosFormData.personalData.nombres || '',
          genero: anexosFormData.personalData.genero || 'M',
          direccion: anexosFormData.personalData.direccion || '',
          provincia: anexosFormData.personalData.provincia || '',
          departamento: anexosFormData.personalData.departamento || '',
          distrito: anexosFormData.personalData.distrito || '',
          // Incluir todos los campos de ubicación
          departamentoId: anexosFormData.personalData.departamentoId || '',
          provinciaId: anexosFormData.personalData.provinciaId || '',
          distritoId: anexosFormData.personalData.distritoId || '',
          referenciaDireccion: anexosFormData.personalData.referenciaDireccion || '',
          fechaNacimiento: anexosFormData.personalData.fechaNacimiento || '',
          lugarNacimiento: anexosFormData.personalData.lugarNacimiento || '',
          // Incluir todos los campos de lugar de nacimiento
          lugarNacimientoDepartamentoId: anexosFormData.personalData.lugarNacimientoDepartamentoId || '',
          lugarNacimientoProvinciaId: anexosFormData.personalData.lugarNacimientoProvinciaId || '',
          lugarNacimientoDistritoId: anexosFormData.personalData.lugarNacimientoDistritoId || '',
          lugarNacimientoDepartamento: anexosFormData.personalData.lugarNacimientoDepartamento || '',
          lugarNacimientoProvincia: anexosFormData.personalData.lugarNacimientoProvincia || '',
          lugarNacimientoDistrito: anexosFormData.personalData.lugarNacimientoDistrito || '',
          correoElectronico: anexosFormData.personalData.correoElectronico || '',
          telefonoDomicilio: anexosFormData.personalData.telefonoDomicilio || '',
          telefonoCelular1: anexosFormData.personalData.telefonoCelular1 || '',
          telefonoCelular2: anexosFormData.personalData.telefonoCelular2 || '',
          correoElectronicoAlterno: anexosFormData.personalData.correoElectronicoAlterno || '',
          conadis: anexosFormData.personalData.conadis || 'NO',
          nCarnetConadis: anexosFormData.personalData.nCarnetConadis || '',
          codigoConadis: anexosFormData.personalData.codigoConadis || '',
          fuerzasArmadas: anexosFormData.personalData.fuerzasArmadas || 'NO',
          nCarnetFuerzasArmadas: anexosFormData.personalData.nCarnetFuerzasArmadas || '',
          codigoFuerzasArmadas: anexosFormData.personalData.codigoFuerzasArmadas || '',
          asistenciaEspecial: anexosFormData.personalData.asistenciaEspecial || '',
          tiempoSectorPublico: anexosFormData.personalData.tiempoSectorPublico || '',
          tiempoSectorPrivado: anexosFormData.personalData.tiempoSectorPrivado || '',
          colegioProfesional: anexosFormData.personalData.colegioProfesional || '',
          colegioProfesionalHabilitado: anexosFormData.personalData.colegioProfesionalHabilitado || 'NO',
          nColegiatura: anexosFormData.personalData.nColegiatura || '',
          fechaVencimientoColegiatura: anexosFormData.personalData.fechaVencimientoColegiatura || '',
          numeroCas: anexosFormData.personalData.numeroCas || '',
        },
        // Asegurar que todos los arrays estén presentes - TODAS LAS TABLAS
        academicFormation: Array.isArray(anexosFormData.academicFormation) ? anexosFormData.academicFormation : [],
        languageSkills: Array.isArray(anexosFormData.languageSkills) ? anexosFormData.languageSkills : [],
        officeSkills: Array.isArray(anexosFormData.officeSkills) ? anexosFormData.officeSkills : [],
        specializationStudies: Array.isArray(anexosFormData.specializationStudies) ? anexosFormData.specializationStudies : [],
        workExperience: Array.isArray(anexosFormData.workExperience) ? anexosFormData.workExperience : [],
        laborReferences: Array.isArray(anexosFormData.laborReferences) ? anexosFormData.laborReferences : [],
        relativesInUGEL: Array.isArray(anexosFormData.relativesInUGEL) ? anexosFormData.relativesInUGEL : [],
        // Asegurar que todas las declaraciones estén presentes
        declarations: {
          ...anexosFormData.declarations,
          infoVerdadera: anexosFormData.declarations?.infoVerdadera || false,
          fechaDeclaracion: anexosFormData.declarations?.fechaDeclaracion || '',
          leyProteccionDatos: anexosFormData.declarations?.leyProteccionDatos || false,
          datosConsignadosVerdaderos: anexosFormData.declarations?.datosConsignadosVerdaderos || false,
          plenosDerechosCiviles: anexosFormData.declarations?.plenosDerechosCiviles || false,
          cumploRequisitosMinimos: anexosFormData.declarations?.cumploRequisitosMinimos || false,
          noCondenaDolosa: anexosFormData.declarations?.noCondenaDolosa || false,
          noInhabilitacion: anexosFormData.declarations?.noInhabilitacion || false,
          noSentenciaCondenatoria: anexosFormData.declarations?.noSentenciaCondenatoria || false,
          noAntecedentesPenales: anexosFormData.declarations?.noAntecedentesPenales || false,
          noAntecedentesPoliciales: anexosFormData.declarations?.noAntecedentesPoliciales || false,
          noAntecedentesJudiciales: anexosFormData.declarations?.noAntecedentesJudiciales || false,
          noParientesUGEL: anexosFormData.declarations?.noParientesUGEL || false,
          tieneParientesUGEL: anexosFormData.declarations?.tieneParientesUGEL || 'NO',
        },
      };
      
      // Guardar borrador en la API
      const response = await fetch(
        `${API_BASE_URL}/documentos/anexos/draft`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          body: JSON.stringify({
            formDataJson: formDataToSave,
            convocatoriaId: convocatoriaId,
          }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`Error al guardar borrador: ${response.statusText}`);
      }
      
      const result = await response.json();
      const savedTime = new Date().toLocaleTimeString('es-PE');
      const savedDate = new Date().toLocaleDateString('es-PE');
      const draftTimestamp = `${savedDate} a las ${savedTime}`;
      
      setLastSavedTime(savedTime);
      setHasDraftSaved(true);
      setDraftLastUpdated(draftTimestamp);
      
      // Calcular resumen completo de datos guardados
      const totalCampos = Object.keys(formDataToSave.personalData).length;
      const totalItems = 
        formDataToSave.academicFormation.length +
        formDataToSave.languageSkills.length +
        formDataToSave.officeSkills.length +
        formDataToSave.specializationStudies.length +
        formDataToSave.workExperience.length +
        formDataToSave.laborReferences.length +
        formDataToSave.relativesInUGEL.length;
      
      console.log('✅ Borrador guardado exitosamente en la API:', {
        id: result.id,
        timestamp: draftTimestamp,
        resumen: {
          totalCamposPersonales: totalCampos,
          totalItemsEnTablas: totalItems,
          detalle: {
            datosPersonales: `${totalCampos} campos`,
            formacionAcademica: `${formDataToSave.academicFormation.length} registros`,
            idiomas: `${formDataToSave.languageSkills.length} registros`,
            ofimatica: `${formDataToSave.officeSkills.length} registros`,
            especializacion: `${formDataToSave.specializationStudies.length} registros`,
            experiencia: `${formDataToSave.workExperience.length} registros`,
            referencias: `${formDataToSave.laborReferences.length} registros`,
            parientes: `${formDataToSave.relativesInUGEL.length} registros`,
          }
        }
      });
      
      setIsSavingDraft(false);
    } catch (error) {
      console.error('❌ Error al guardar borrador en la API:', error);
      setIsSavingDraft(false);
    }
  };

  // Exponer datos del formulario para validación externa
  useEffect(() => {
    // Exponer los datos del formulario globalmente para que el componente padre pueda acceder
    (window as any).__getAnexosFormData = () => anexosFormData;
  }, [anexosFormData]);

  // Limpiar errores de validación cuando el usuario completa los campos
  useEffect(() => {
    if (Object.keys(validationErrors).length > 0 && currentSectionIndex === 0) {
      // Para la sección de Datos Personales, verificar si los campos con error ahora están completos
      const clearErrors = () => {
        const formData = anexosFormData.personalData;
        const fieldsToClear: string[] = [];
        
        // Verificar campos que tenían error - verificar si están completos ahora
        if (validationErrors['Fecha de Nacimiento'] && formData.fechaNacimiento?.trim()) {
          fieldsToClear.push('Fecha de Nacimiento');
        }
        if (validationErrors['Departamento (Lugar de Nacimiento)'] && formData.lugarNacimientoDepartamentoId) {
          fieldsToClear.push('Departamento (Lugar de Nacimiento)');
        }
        if (validationErrors['Provincia (Lugar de Nacimiento)'] && formData.lugarNacimientoProvinciaId) {
          fieldsToClear.push('Provincia (Lugar de Nacimiento)');
        }
        if (validationErrors['Distrito (Lugar de Nacimiento)'] && formData.lugarNacimientoDistritoId) {
          fieldsToClear.push('Distrito (Lugar de Nacimiento)');
        }
        if (validationErrors['Dirección Completa'] && formData.direccion?.trim()) {
          fieldsToClear.push('Dirección Completa');
        }
        
        // Si hay campos que se completaron, limpiar esos errores
        if (fieldsToClear.length > 0) {
          // Notificar al componente padre que debe limpiar estos errores
          if ((window as any).__clearValidationErrors) {
            (window as any).__clearValidationErrors(fieldsToClear);
          }
          
          // Si todos los errores fueron corregidos, limpiar también el mensaje de error
          const remainingErrors = Object.keys(validationErrors).filter(field => !fieldsToClear.includes(field));
          if (remainingErrors.length === 0 && (window as any).__clearValidationMessage) {
            (window as any).__clearValidationMessage();
          }
        }
      };
      
      // Usar un debounce para no hacer demasiadas verificaciones
      const timer = setTimeout(clearErrors, 800);
      return () => clearTimeout(timer);
    }
  }, [anexosFormData.personalData.fechaNacimiento, anexosFormData.personalData.lugarNacimientoDepartamentoId, anexosFormData.personalData.lugarNacimientoProvinciaId, anexosFormData.personalData.lugarNacimientoDistritoId, anexosFormData.personalData.direccion, validationErrors, currentSectionIndex]);

  // Effect para guardar borrador automáticamente cuando cambien los datos
  // DESACTIVADO: El guardado ahora se hace solo en el backend al enviar el formulario
  // useEffect(() => {
  //   if (!authToken || !shouldSaveDraft) return;
  //   
  //   // Debounce mejorado: aumentar a 2 segundos para evitar demasiadas llamadas
  //   // Solo guardar si hay cambios significativos
  //   const saveTimer = setTimeout(async () => {
  //     // Verificar que no estemos en medio de una carga inicial
  //     if (draftLoadedForConvocatoria === null) {
  //       // Esperar un poco más si aún se está cargando el borrador
  //       return;
  //     }
  //     
  //     await saveDraftToAPI(true); // Guardar en modo silencioso
  //     // Si hay callback de guardado, ejecutarlo después de guardar
  //     if (onSectionSave) {
  //       try {
  //         await onSectionSave();
  //       } catch (error) {
  //         console.error('Error en callback de guardado:', error);
  //       }
  //     }
  //   }, 2000); // Guardar después de 2 segundos de inactividad (más eficiente)
  //   
  //   return () => clearTimeout(saveTimer);
  // }, [anexosFormData, authToken, convocatoriaSeleccionada?.id, shouldSaveDraft, onSectionSave, draftLoadedForConvocatoria]);

  // Effect para guardar antes de salir de la página
  // DESACTIVADO: El guardado ahora se hace solo en el backend al enviar el formulario
  // useEffect(() => {
  //   if (!shouldSaveDraft) return;
  //   
  //   const handleBeforeUnload = () => {
  //     // Intentar guardar antes de salir usando fetch con keepalive
  //     const token = authToken || localStorage.getItem('token');
  //     if (token) {
  //       const convocatoriaId = convocatoriaSeleccionada?.id || null;
  //       const formDataToSave = {
  //         ...anexosFormData,
  //         academicFormation: anexosFormData.academicFormation || [],
  //         languageSkills: anexosFormData.languageSkills || [],
  //         officeSkills: anexosFormData.officeSkills || [],
  //         specializationStudies: anexosFormData.specializationStudies || [],
  //         workExperience: anexosFormData.workExperience || [],
  //         laborReferences: anexosFormData.laborReferences || [],
  //         relativesInUGEL: anexosFormData.relativesInUGEL || [],
  //         personalData: {
  //           ...anexosFormData.personalData,
  //           departamentoId: anexosFormData.personalData.departamentoId || '',
  //           provinciaId: anexosFormData.personalData.provinciaId || '',
  //           distritoId: anexosFormData.personalData.distritoId || '',
  //           lugarNacimientoDepartamentoId: anexosFormData.personalData.lugarNacimientoDepartamentoId || '',
  //           lugarNacimientoProvinciaId: anexosFormData.personalData.lugarNacimientoProvinciaId || '',
  //           lugarNacimientoDistritoId: anexosFormData.personalData.lugarNacimientoDistritoId || '',
  //           lugarNacimientoDepartamento: anexosFormData.personalData.lugarNacimientoDepartamento || '',
  //           lugarNacimientoProvincia: anexosFormData.personalData.lugarNacimientoProvincia || '',
  //           lugarNacimientoDistrito: anexosFormData.personalData.lugarNacimientoDistrito || '',
  //         },
  //         declarations: {
  //           ...anexosFormData.declarations,
  //         },
  //       };
  //       
  //       // Usar fetch con keepalive para guardar antes de cerrar (no bloquea la salida)
  //       fetch(`${API_BASE_URL}/documentos/anexos/draft`, {
  //         method: 'POST',
  //         headers: {
  //           'Authorization': `Bearer ${token}`,
  //           'Content-Type': 'application/json',
  //           'ngrok-skip-browser-warning': 'true'
  //         },
  //         body: JSON.stringify({
  //           formDataJson: formDataToSave,
  //           convocatoriaId: convocatoriaId,
  //         }),
  //         keepalive: true // Permite que la solicitud continúe después de cerrar la página
  //       }).catch(err => console.error('Error al guardar borrador antes de salir:', err));
  //     }
  //   };
  //   
  //   const handleVisibilityChange = () => {
  //     // Guardar cuando la página se oculta (usuario cambia de pestaña o minimiza)
  //     if (document.hidden) {
  //       saveDraftToAPI();
  //     }
  //   };
  //   
  //   const handlePageHide = () => {
  //     // Guardar cuando la página se oculta completamente
  //       saveDraftToAPI();
  //   };
  //   
  //   window.addEventListener('beforeunload', handleBeforeUnload);
  //   window.addEventListener('pagehide', handlePageHide);
  //   document.addEventListener('visibilitychange', handleVisibilityChange);
  //   
  //   return () => {
  //     window.removeEventListener('beforeunload', handleBeforeUnload);
  //     window.removeEventListener('pagehide', handlePageHide);
  //     document.removeEventListener('visibilitychange', handleVisibilityChange);
  //     // Guardar antes de desmontar el componente
  //     if (shouldSaveDraft) {
  //       saveDraftToAPI();
  //     }
  //   };
  // }, [anexosFormData, authToken, convocatoriaSeleccionada?.id, shouldSaveDraft]);

  // Effect to load departamentos on component mount
  useEffect(() => {
    const departamentosData = getDepartamentos();
    setDepartamentos(departamentosData);
    setLugarNacimientoDepartamentos(departamentosData);
  }, []);

  // Effect to load user data from backend
  useEffect(() => {
    const loadUserData = async () => {
      // Intentar obtener el token desde el prop o desde localStorage
      const token = authToken || localStorage.getItem('token');
      
      if (!token) {
        console.warn('⚠️ No hay authToken disponible para cargar datos del usuario');
        return;
      }
      
      console.log('🔑 Token encontrado, procediendo a cargar datos del usuario...');
      
      try {
        // Decodificar el token para obtener el ID del usuario
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          console.error('❌ Token inválido: no tiene 3 partes');
          return;
        }
        
        const payload = JSON.parse(atob(tokenParts[1]));
        const userId = payload?.id || payload?.IDUSUARIO;
        
        console.log('🔍 Decodificando token:', { userId, payloadKeys: Object.keys(payload) });
        
        if (!userId) {
          console.error('❌ No se encontró userId en el token:', payload);
          return;
        }
        
        console.log(`📡 Cargando datos del usuario ID: ${userId} desde ${API_BASE_URL}/users/${userId}`);
        
        // Obtener datos del usuario desde el backend
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true'
          },
        });
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          console.error('❌ Error al cargar datos del usuario:', response.status, response.statusText, errorText);
          return;
        }
        
        const userData = await response.json();
        console.log('✅ Datos del usuario recibidos:', userData);
        
        // Mapear datos del usuario a personalData
        if (userData) {
          // Construir nombre completo - intentar todas las posibles variantes
          let nombreCompleto = '';
          
          // Prioridad 1: nombreCompleto directamente (intentar con diferentes casos)
          if (userData.nombreCompleto && String(userData.nombreCompleto).trim() !== '') {
            nombreCompleto = String(userData.nombreCompleto).trim();
          } 
          // Alternativa: nombreCompleto con diferente capitalización
          else if (userData.nombrecompleto && String(userData.nombrecompleto).trim() !== '') {
            nombreCompleto = String(userData.nombrecompleto).trim();
          }
          // Prioridad 2: construir desde partes del nombre (sin apellidos)
          else if (userData.nombres && String(userData.nombres).trim() !== '') {
            nombreCompleto = String(userData.nombres).trim();
          }
          // Prioridad 3: campo nombre
          else if (userData.nombre && String(userData.nombre).trim() !== '') {
            nombreCompleto = String(userData.nombre).trim();
          }
          // Prioridad 4: construir desde nombreCompleto del token si está disponible
          else {
            try {
              const tokenParts = token.split('.');
              if (tokenParts.length === 3) {
                const tokenPayload = JSON.parse(atob(tokenParts[1]));
                if (tokenPayload?.nombreCompleto) {
                  nombreCompleto = String(tokenPayload.nombreCompleto).trim();
                }
              }
            } catch (e) {
              console.error('Error al obtener nombre del token:', e);
            }
          }
          
          console.log('🔍 Datos del usuario cargados:', {
            nombreCompletoFinal: nombreCompleto,
            nombreCompletoFromDB: userData.nombreCompleto,
            nombresFromDB: userData.nombres,
            nombreFromDB: userData.nombre,
            userDataKeys: Object.keys(userData)
          });
          
          // IMPORTANTE: Si ya hay borrador cargado, NO sobrescribir con datos del usuario
          // Solo cargar datos del usuario si NO hay un borrador guardado
          setAnexosFormData(prevData => {
            // Verificar si ya hay datos del borrador cargados (más estricto)
            const hasDraftData = hasDraftSaved && draftLoadedForConvocatoria !== null && (
              prevData.personalData.nombres ||
              prevData.personalData.dni ||
              prevData.academicFormation?.length > 0 ||
              prevData.languageSkills?.length > 0 ||
              prevData.workExperience?.length > 0 ||
              prevData.officeSkills?.length > 0 ||
              prevData.specializationStudies?.length > 0 ||
              prevData.laborReferences?.length > 0
            );
            
            if (hasDraftData) {
              console.log('⚠️ Datos del usuario OMITIDOS porque hay borrador guardado y cargado');
              console.log('📊 Estado actual del formulario:', {
                tieneNombres: !!prevData.personalData.nombres,
                tieneDNI: !!prevData.personalData.dni,
                formacionAcademica: prevData.academicFormation?.length || 0,
                idiomas: prevData.languageSkills?.length || 0,
                experiencia: prevData.workExperience?.length || 0,
                ofimatica: prevData.officeSkills?.length || 0,
                especializacion: prevData.specializationStudies?.length || 0,
                referencias: prevData.laborReferences?.length || 0,
                draftLoadedForConvocatoria: draftLoadedForConvocatoria,
                hasDraftSaved: hasDraftSaved
              });
              // NO MODIFICAR NADA - El borrador ya tiene prioridad
              return prevData;
            }
            
            // Si no hay borrador, cargar todos los datos del usuario normalmente
            console.log('✅ No hay borrador guardado, cargando datos del usuario');
            return {
              ...prevData,
              personalData: {
                ...prevData.personalData,
                // Datos básicos del usuario
                tipoDocumento: (userData.tipoDocumento || 'DNI').toUpperCase() === 'DNI' ? 'DNI' : 'CARNET DE EXTRANJERÍA',
                dni: userData.documento || userData.dni || '',
                apellidoPaterno: userData.apellidoPaterno || '',
                apellidoMaterno: userData.apellidoMaterno || '',
                nombres: nombreCompleto || prevData.personalData.nombres || '',
                correoElectronico: userData.correo || userData.email || '',
                telefonoCelular1: userData.telefono || userData.celular || '',
                // Mantener otros campos que ya existen si no vienen del usuario
                carnetExtranjeria: prevData.personalData.carnetExtranjeria || (userData.tipoDocumento?.toUpperCase() !== 'DNI' ? userData.documento : ''),
                direccion: prevData.personalData.direccion || userData.direccion || '',
                departamento: prevData.personalData.departamento || userData.departamento || '',
                provincia: prevData.personalData.provincia || userData.provincia || '',
                distrito: prevData.personalData.distrito || userData.distrito || '',
                telefonoCelular2: prevData.personalData.telefonoCelular2 || '',
                correoElectronicoAlterno: prevData.personalData.correoElectronicoAlterno || '',
                fechaNacimiento: prevData.personalData.fechaNacimiento || userData.fechaNacimiento || '',
                lugarNacimiento: prevData.personalData.lugarNacimiento || userData.lugarNacimiento || '',
                genero: prevData.personalData.genero || (userData.genero?.toUpperCase() === 'F' ? 'F' : 'M'),
              },
            };
          });
        }
      } catch (error) {
        console.error('❌ Error al cargar datos del usuario:', error);
        // Mostrar un mensaje en la consola para debugging
        if (error instanceof Error) {
          console.error('Detalles del error:', error.message, error.stack);
        }
      }
    };
    
    loadUserData();
  }, [authToken]); // Solo ejecutar cuando cambia el token, el borrador se carga por separado

  // Effect to auto-populate fields from convocatoriaSeleccionada
  useEffect(() => {
    if (convocatoriaSeleccionada) {
      setAnexosFormData(prevData => ({
        ...prevData,
        personalData: {
          ...prevData.personalData,
          codigo: convocatoriaSeleccionada.id?.toString() || '',
          nombrePuesto: convocatoriaSeleccionada.puesto || '',
          numeroCas: convocatoriaSeleccionada.numero_cas || '',
        },
      }));
    }
  }, [convocatoriaSeleccionada]);

  // Función helper para obtener solo el último anexo modificado
  const obtenerUltimoAnexoModificado = (anexosArray: any[]): any[] => {
    if (!Array.isArray(anexosArray) || anexosArray.length === 0) {
      return [];
    }
    
    // Ordenar por fecha de modificación/actualización (más reciente primero)
    // Prioridad: fechaActualizacion > fechaCreacion
    const anexosOrdenados = [...anexosArray].sort((a: any, b: any) => {
      // Obtener fecha de actualización o creación (la más reciente)
      const fechaA = a.fechaActualizacion || a.fechaCreacion;
      const fechaB = b.fechaActualizacion || b.fechaCreacion;
      
      // Convertir a timestamps
      const timestampA = fechaA ? new Date(fechaA).getTime() : 0;
      const timestampB = fechaB ? new Date(fechaB).getTime() : 0;
      
      // Si las fechas son iguales, priorizar el que tiene fechaActualizacion
      if (timestampA === timestampB) {
        const tieneActualizacionA = a.fechaActualizacion ? 1 : 0;
        const tieneActualizacionB = b.fechaActualizacion ? 1 : 0;
        return tieneActualizacionB - tieneActualizacionA;
      }
      
      return timestampB - timestampA; // Orden descendente (más reciente primero)
    });
    
    // Tomar solo el más reciente (el primero después de ordenar)
    return anexosOrdenados.length > 0 ? [anexosOrdenados[0]] : [];
  };

  // Effect para cargar anexos completos guardados
  useEffect(() => {
    const loadAnexosCompletos = async () => {
      if (!authToken) return;
      
      setLoadingAnexosCompletos(true);
      try {
        const response = await fetch(`${API_BASE_URL}/documentos/anexos-completos`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
        });

        if (response.ok) {
          const data = await response.json();
          const anexosArray = Array.isArray(data) ? data : [];
          
          // Log para debugging
          console.log('📋 Anexos completos recibidos:', anexosArray.length, 'anexos');
          anexosArray.forEach((anexo: any, idx: number) => {
            console.log(`  Anexo ${idx + 1}:`, {
              id: anexo.IDANEXO_COMPLETO || anexo.IDANEXO,
              fechaCreacion: anexo.fechaCreacion,
              fechaActualizacion: anexo.fechaActualizacion,
              nombrePuesto: anexo.nombrePuesto || anexo.personalData?.nombrePuesto
            });
          });
          
          const ultimoAnexo = obtenerUltimoAnexoModificado(anexosArray);
          console.log('✅ Último anexo modificado seleccionado:', ultimoAnexo.length > 0 ? {
            id: ultimoAnexo[0].IDANEXO_COMPLETO || ultimoAnexo[0].IDANEXO,
            fechaCreacion: ultimoAnexo[0].fechaCreacion,
            fechaActualizacion: ultimoAnexo[0].fechaActualizacion
          } : 'Ninguno');
          
          setAnexosCompletos(ultimoAnexo);
        } else {
          console.error('Error al cargar anexos completos:', response.statusText);
          setAnexosCompletos([]);
        }
      } catch (error) {
        console.error('Error al cargar anexos completos:', error);
        setAnexosCompletos([]);
      } finally {
        setLoadingAnexosCompletos(false);
      }
    };

    loadAnexosCompletos();
  }, [authToken]);

  // Función helper para obtener valor de campo desde múltiples fuentes
  const getFieldValue = (anexo: any, pd: any, fieldName: string, defaultValue: any = '') => {
    // Buscar en: personalData, anexo directo, y con diferentes variaciones
    return pd?.[fieldName] 
      || anexo?.[fieldName] 
      || pd?.[fieldName.toLowerCase()]
      || anexo?.[fieldName.toLowerCase()]
      || defaultValue;
  };

  // Función helper para formatear fecha desde YYYY-MM-DD a DD/MM/YYYY o mantener formato
  const formatDateForForm = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    
    // Si ya está en formato DD/MM/YYYY, retornarlo
    if (typeof dateStr === 'string' && dateStr.includes('/')) {
      return dateStr;
    }
    
    // Si está en formato YYYY-MM-DD, convertir a DD/MM/YYYY
    try {
      // Convertir a string si es necesario
      let dateStrToParse: string;
      if (typeof dateStr === 'string') {
        dateStrToParse = dateStr;
      } else if (dateStr && typeof dateStr === 'object' && 'getTime' in dateStr) {
        // Es un objeto Date
        dateStrToParse = (dateStr as any).toISOString().split('T')[0];
      } else {
        return '';
      }
      
      // Intentar parsear como YYYY-MM-DD
      let date: Date;
      if (dateStrToParse.match(/^\d{4}-\d{2}-\d{2}/)) {
        date = new Date(dateStrToParse);
      } else {
        // Intentar parsear como fecha general
        date = new Date(dateStrToParse);
      }
      
      if (isNaN(date.getTime())) {
        console.warn('⚠️ Fecha inválida:', dateStr);
        return '';
      }
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (e) {
      console.warn('⚠️ Error al formatear fecha:', dateStr, e);
      return typeof dateStr === 'string' ? dateStr : '';
    }
  };

  // Función helper para formatear fecha a YYYY-MM-DD (para inputs type="date")
  const formatDateForDateInput = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    
    // Si ya está en formato YYYY-MM-DD, retornarlo
    if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
      return dateStr;
    }
    
    // Si está en formato DD/MM/YYYY, convertir a YYYY-MM-DD
    try {
      let dateStrToParse: string;
      if (typeof dateStr === 'string') {
        dateStrToParse = dateStr;
      } else if (dateStr && typeof dateStr === 'object' && 'getTime' in dateStr) {
        // Es un objeto Date
        dateStrToParse = (dateStr as any).toISOString().split('T')[0];
      } else {
        return '';
      }
      
      // Si está en formato DD/MM/YYYY
      if (dateStrToParse.match(/^\d{2}\/\d{2}\/\d{4}/)) {
        const [day, month, year] = dateStrToParse.split('/');
        return `${year}-${month}-${day}`;
      }
      
      // Intentar parsear como fecha general
      const date = new Date(dateStrToParse);
      if (isNaN(date.getTime())) {
        console.warn('⚠️ Fecha inválida para date input:', dateStr);
        return '';
      }
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${year}-${month}-${day}`;
    } catch (e) {
      console.warn('⚠️ Error al formatear fecha para date input:', dateStr, e);
      return typeof dateStr === 'string' ? dateStr : '';
    }
  };

  // Función para cargar un anexo en el formulario para edición
  // Si el anexo es de otra convocatoria, carga los datos pero limpia editingAnexoId para crear uno nuevo
  const loadAnexoForEdit = async (anexo: any, esParaNuevaConvocatoria: boolean = false) => {
    try {
      console.log('📋 Cargando anexo para edición:', anexo, { esParaNuevaConvocatoria });
      
      // Verificar si el anexo pertenece a la convocatoria actual
      let perteneceAConvocatoriaActual = false;
      if (convocatoriaSeleccionada?.id) {
        const anexoConvocatoriaId = anexo.IDCONVOCATORIA ? Number(anexo.IDCONVOCATORIA) : null;
        const convocatoriaActualId = Number(convocatoriaSeleccionada.id);
        perteneceAConvocatoriaActual = anexoConvocatoriaId === convocatoriaActualId;
      }
      
      // Si el anexo NO pertenece a la convocatoria actual, limpiar editingAnexoId
      // para que al guardar se cree un nuevo anexo
      if (!perteneceAConvocatoriaActual && convocatoriaSeleccionada?.id) {
        console.log('🔄 El anexo pertenece a otra convocatoria. Se cargarán los datos pero se creará un nuevo anexo al guardar:', {
          anexoConvocatoriaId: anexo.IDCONVOCATORIA,
          convocatoriaActualId: convocatoriaSeleccionada.id
        });
        setEditingAnexoId(null); // Limpiar para crear nuevo anexo
      } else if (perteneceAConvocatoriaActual) {
        // Si pertenece a la convocatoria actual, establecer el ID para actualizar
        setEditingAnexoId(anexo.IDANEXO_COMPLETO || anexo.IDANEXO);
      }
      
      // Si el anexo viene directamente de anexos_completos (tiene los arrays JSON parseados)
      // Intentar usar esos datos primero
      if (anexo.formacionAcademica || anexo.idiomas || anexo.ofimatica || anexo.especializacion || anexo.experienciaLaboral || anexo.referenciasLaborales) {
        console.log('📦 Usando datos directamente de anexos_completos');
        
        // Parsear arrays JSON si vienen como string
        const parseJsonArray = (value: any) => {
          if (!value) return [];
          if (typeof value === 'string') {
            try {
              return JSON.parse(value);
            } catch (e) {
              return [];
            }
          }
          return Array.isArray(value) ? value : [];
        };

        // Preparar datos desde anexos_completos
        const formacionAcademicaRaw = parseJsonArray(anexo.formacionAcademica);
        const idiomasRaw = parseJsonArray(anexo.idiomas);
        const ofimaticaRaw = parseJsonArray(anexo.ofimatica);
        const especializacionRaw = parseJsonArray(anexo.especializacion);
        const experienciaLaboralRaw = parseJsonArray(anexo.experienciaLaboral);
        const referenciasLaboralesRaw = parseJsonArray(anexo.referenciasLaborales);

        // Mapear los datos directamente desde anexos_completos al formato del formulario
        anexo.academicFormation = formacionAcademicaRaw.map((item: any) => ({
          nivelEducativo: item.nivelEducativo || '',
          gradoAcademico: item.nombreGrado || item.gradoAcademico || '',
          nombreCarrera: item.nombreGrado || item.nombreCarrera || '',
          institucion: item.nombreInstitucion || item.institucion || '',
          anoDesde: item.fechaInicio ? (typeof item.fechaInicio === 'string' && item.fechaInicio.length === 4 ? item.fechaInicio : new Date(item.fechaInicio).getFullYear().toString()) : (item.anoDesde || ''),
          anoHasta: item.fechaFin ? (typeof item.fechaFin === 'string' && item.fechaFin.length === 4 ? item.fechaFin : new Date(item.fechaFin).getFullYear().toString()) : (item.anoHasta || ''),
          otrosNivelEspecificar: item.otrosNivelEspecificar || '',
        }));

        anexo.languageSkills = idiomasRaw.map((item: any) => ({
          idiomaDialecto: item.idioma || item.idiomaDialecto || '',
          nivel: item.nivel || 'Básico',
        }));

        anexo.officeSkills = ofimaticaRaw.map((item: any) => ({
          materia: item.programa || item.materia || '',
          nivel: item.nivel || 'Básico',
        }));

        anexo.specializationStudies = especializacionRaw.map((item: any) => ({
          tipoEstudio: item.tipoEstudio || '',
          nombreEstudio: item.nombreEspecializacion || item.nombreEstudio || '',
          periodoInicio: item.fechaInicio ? (typeof item.fechaInicio === 'string' && item.fechaInicio.length === 4 ? item.fechaInicio : new Date(item.fechaInicio).getFullYear().toString()) : (item.periodoInicio || ''),
          periodoFin: item.fechaFin ? (typeof item.fechaFin === 'string' && item.fechaFin.length === 4 ? item.fechaFin : new Date(item.fechaFin).getFullYear().toString()) : (item.periodoFin || ''),
          horas: item.horasAcademicas || item.horas || '',
          centroEstudio: item.institucion || item.centroEstudio || '',
        }));

        anexo.workExperience = experienciaLaboralRaw.map((item: any) => {
          const fechaInicio = item.fechaInicio ? new Date(item.fechaInicio) : null;
          const fechaFin = item.fechaFin ? new Date(item.fechaFin) : null;
          const funciones = item.funciones || '';
          const funcionesArray = typeof funciones === 'string' ? funciones.split('\n').filter((f: string) => f.trim()) : [];

          return {
            empresaInstitucion: item.empresaEntidad || item.empresaInstitucion || '',
            sectorGiroNegocio: item.sector || item.sectorGiroNegocio || '',
            puestoCargo: item.cargo || item.puestoCargo || '',
            periodoDesde: item.periodoDesde || (fechaInicio && !isNaN(fechaInicio.getTime()) ? `${String(fechaInicio.getMonth() + 1).padStart(2, '0')}/${fechaInicio.getFullYear()}` : ''),
            periodoHasta: item.periodoHasta || (fechaFin && !isNaN(fechaFin.getTime()) ? `${String(fechaFin.getMonth() + 1).padStart(2, '0')}/${fechaFin.getFullYear()}` : ''),
            funcionPrincipal1: funcionesArray[0] || item.funcionPrincipal1 || '',
            funcionPrincipal2: funcionesArray[1] || item.funcionPrincipal2 || '',
            funcionPrincipal3: funcionesArray[2] || item.funcionPrincipal3 || '',
            funcionPrincipal4: funcionesArray[3] || item.funcionPrincipal4 || '',
            funcionPrincipal5: funcionesArray[4] || item.funcionPrincipal5 || '',
          };
        });

        anexo.laborReferences = referenciasLaboralesRaw;

        console.log('✅ Datos mapeados desde anexos_completos:', {
          academicFormation: anexo.academicFormation?.length || 0,
          languageSkills: anexo.languageSkills?.length || 0,
          officeSkills: anexo.officeSkills?.length || 0,
          specializationStudies: anexo.specializationStudies?.length || 0,
          workExperience: anexo.workExperience?.length || 0,
          laborReferences: anexo.laborReferences?.length || 0,
          'workExperience array completo': anexo.workExperience,
          'academicFormation array completo': anexo.academicFormation,
          'languageSkills array completo': anexo.languageSkills,
        });
        
        // También asignar a formData para compatibilidad
        if (!anexo.formData) {
          anexo.formData = {};
        }
        anexo.formData.academicFormation = anexo.academicFormation;
        anexo.formData.languageSkills = anexo.languageSkills;
        anexo.formData.officeSkills = anexo.officeSkills;
        anexo.formData.specializationStudies = anexo.specializationStudies;
        anexo.formData.workExperience = anexo.workExperience;
        anexo.formData.laborReferences = anexo.laborReferences;
      }
      
      // Siempre intentar obtener el anexo completo desde la API para asegurar que tenemos todos los datos
      // Primero intentar usar IDANEXO (que es el que requiere el endpoint)
      const anexoIdParaCargar = anexo.IDANEXO || anexo.id;
      
      if (anexoIdParaCargar) {
        try {
          console.log('📥 Obteniendo anexo completo desde API usando IDANEXO:', anexoIdParaCargar);
          const response = await fetch(`${API_BASE_URL}/documentos/anexos/${anexoIdParaCargar}/completo`, {
            headers: {
              'Authorization': `Bearer ${authToken || localStorage.getItem('token')}`,
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true'
            },
          });
          
          if (response.ok) {
            const anexoCompleto = await response.json();
            console.log('✅ Anexo completo obtenido desde API:', anexoCompleto);
            
            // El endpoint devuelve formData con todos los datos estructurados
            if (anexoCompleto.formData) {
              console.log('📋 formData recibido desde API:', {
                academicFormation: anexoCompleto.formData.academicFormation?.length || 0,
                languageSkills: anexoCompleto.formData.languageSkills?.length || 0,
                officeSkills: anexoCompleto.formData.officeSkills?.length || 0,
                specializationStudies: anexoCompleto.formData.specializationStudies?.length || 0,
                workExperience: anexoCompleto.formData.workExperience?.length || 0,
                laborReferences: anexoCompleto.formData.laborReferences?.length || 0,
                'workExperience raw': anexoCompleto.formData.workExperience,
              });
              
              // Función para convertir fecha a formato YYYY o mantener formato original
              const formatDateToYear = (dateStr: string) => {
                if (!dateStr) return '';
                try {
                  const date = new Date(dateStr);
                  if (!isNaN(date.getTime())) {
                    return String(date.getFullYear());
                  }
                } catch (e) {
                  // Si ya es un año (4 dígitos), devolverlo tal cual
                  if (/^\d{4}$/.test(dateStr)) {
                    return dateStr;
                  }
                }
                return dateStr;
              };

              // Función para convertir fecha a formato MM/AAAA
              const formatDateToMonthYear = (dateStr: string) => {
                if (!dateStr) return '';
                try {
                  const date = new Date(dateStr);
                  if (!isNaN(date.getTime())) {
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const year = date.getFullYear();
                    return `${month}/${year}`;
                  }
                } catch (e) {
                  // Si ya está en formato MM/AAAA, devolverlo tal cual
                  if (/^\d{2}\/\d{4}$/.test(dateStr)) {
                    return dateStr;
                  }
                }
                return dateStr;
              };

              // Mapear Formación Académica: convertir campos de API a formato del formulario
              const academicFormationMapped = (anexoCompleto.formData.academicFormation || []).map((item: any) => ({
                nivelEducativo: item.nivelEducativo || '',
                gradoAcademico: item.nombreGrado || item.gradoAcademico || '',
                nombreCarrera: item.nombreGrado || item.nombreCarrera || '',
                institucion: item.nombreInstitucion || item.institucion || '',
                anoDesde: formatDateToYear(item.fechaInicio || item.anoDesde || ''),
                anoHasta: formatDateToYear(item.fechaFin || item.anoHasta || ''),
                otrosNivelEspecificar: item.otrosNivelEspecificar || '',
              }));

              // Mapear Idiomas: convertir campos de API a formato del formulario
              const languageSkillsMapped = (anexoCompleto.formData.languageSkills || []).map((item: any) => ({
                idiomaDialecto: item.idioma || item.idiomaDialecto || '',
                nivel: item.nivel || 'Básico',
              }));

              // Mapear Ofimática: convertir campos de API a formato del formulario
              const officeSkillsMapped = (anexoCompleto.formData.officeSkills || []).map((item: any) => ({
                materia: item.programa || item.materia || '',
                nivel: item.nivel || 'Básico',
              }));

              // Mapear Especialización: convertir campos de API a formato del formulario
              const specializationStudiesMapped = (anexoCompleto.formData.specializationStudies || []).map((item: any) => ({
                tipoEstudio: item.tipoEstudio || '',
                nombreEstudio: item.nombreEspecializacion || item.nombreEstudio || '',
                periodoInicio: formatDateToYear(item.fechaInicio || item.periodoInicio || ''),
                periodoFin: formatDateToYear(item.fechaFin || item.periodoFin || ''),
                horas: item.horasAcademicas || item.horas || '',
                centroEstudio: item.institucion || item.centroEstudio || '',
              }));

              // Mapear Experiencia Laboral: convertir campos de API a formato del formulario
              const workExperienceMapped = (anexoCompleto.formData.workExperience || []).map((item: any) => ({
                empresaInstitucion: item.empresaEntidad || item.empresaInstitucion || '',
                sectorGiroNegocio: item.sector || item.sectorGiroNegocio || '',
                puestoCargo: item.cargo || item.puestoCargo || '',
                periodoDesde: formatDateToMonthYear(item.fechaInicio || item.periodoDesde || ''),
                periodoHasta: formatDateToMonthYear(item.fechaFin || item.periodoHasta || ''),
                funcionPrincipal1: (item.funciones && typeof item.funciones === 'string' ? item.funciones.split('\n')[0] : '') || item.funcionPrincipal1 || '',
                funcionPrincipal2: (item.funciones && typeof item.funciones === 'string' ? item.funciones.split('\n')[1] : '') || item.funcionPrincipal2 || '',
                funcionPrincipal3: (item.funciones && typeof item.funciones === 'string' ? item.funciones.split('\n')[2] : '') || item.funcionPrincipal3 || '',
                funcionPrincipal4: (item.funciones && typeof item.funciones === 'string' ? item.funciones.split('\n')[3] : '') || item.funcionPrincipal4 || '',
                funcionPrincipal5: (item.funciones && typeof item.funciones === 'string' ? item.funciones.split('\n')[4] : '') || item.funcionPrincipal5 || '',
              }));

              // Mapear Referencias Laborales: asegurar que todos los campos estén mapeados correctamente
              const laborReferencesMapped = (anexoCompleto.formData.laborReferences || []).map((item: any) => ({
                empresaEntidad: item.empresaEntidad || item.empresa || '',
                direccion: item.direccion || '',
                cargoPostulante: item.cargoPostulante || item.cargo || '',
                nombreCargoJefe: item.nombreCargoJefe || item.nombreJefe || '',
                telefonos: item.telefonos || item.telefono || '',
                correoElectronico: item.correoElectronico || item.correo || '',
              }));

              // Asignar los datos mapeados directamente a anexo, asegurando que se preserven
              anexo = {
                ...anexo, // Preservar propiedades originales como IDANEXO_COMPLETO
                ...anexoCompleto, // Datos del endpoint completo
                // Propiedades directas mapeadas (prioridad alta)
                academicFormation: academicFormationMapped,
                languageSkills: languageSkillsMapped,
                officeSkills: officeSkillsMapped,
                specializationStudies: specializationStudiesMapped,
                workExperience: workExperienceMapped,
                laborReferences: laborReferencesMapped,
                // También en formData para compatibilidad
                formData: {
                  ...anexoCompleto.formData,
                  academicFormation: academicFormationMapped,
                  languageSkills: languageSkillsMapped,
                  officeSkills: officeSkillsMapped,
                  specializationStudies: specializationStudiesMapped,
                  workExperience: workExperienceMapped,
                  laborReferences: laborReferencesMapped,
                },
              };
              console.log('✅ Anexo mapeado con TODOS los datos:', {
                academicFormation: anexo.academicFormation?.length || 0,
                languageSkills: anexo.languageSkills?.length || 0,
                officeSkills: anexo.officeSkills?.length || 0,
                specializationStudies: anexo.specializationStudies?.length || 0,
                workExperience: anexo.workExperience?.length || 0,
                laborReferences: anexo.laborReferences?.length || 0,
                academicFormationData: anexo.academicFormation,
                languageSkillsData: anexo.languageSkills,
                officeSkillsData: anexo.officeSkills,
                specializationStudiesData: anexo.specializationStudies,
                workExperienceData: anexo.workExperience,
                workExperienceMapped: workExperienceMapped,
                laborReferencesData: anexo.laborReferences,
              });
              
              // Verificar explícitamente que workExperience esté asignado
              if (workExperienceMapped && workExperienceMapped.length > 0) {
                console.log('✅ Verificando workExperienceMapped:', workExperienceMapped);
                console.log('✅ anexo.workExperience después de asignación:', anexo.workExperience);
                // Forzar asignación nuevamente para asegurar
                anexo.workExperience = workExperienceMapped;
                if (anexo.formData) {
                  anexo.formData.workExperience = workExperienceMapped;
                }
              }
            }
          } else {
            console.warn('⚠️ No se pudo obtener el anexo completo desde la API, status:', response.status);
          }
        } catch (error) {
          console.warn('⚠️ Error al obtener anexo completo desde API, usando datos disponibles:', error);
        }
      } else {
        console.warn('⚠️ No se encontró IDANEXO para cargar el anexo completo');
      }
      
      // Log para debugging - mostrar qué datos tenemos disponibles
      console.log('🔍 Datos del anexo disponibles ANTES de construir formData:', {
        'anexo.formData': anexo.formData,
        'anexo.formData?.workExperience': anexo.formData?.workExperience,
        'anexo.formData?.workExperience length': anexo.formData?.workExperience?.length,
        'anexo.academicFormation': anexo.academicFormation,
        'anexo.formacionAcademica': anexo.formacionAcademica,
        'anexo.languageSkills': anexo.languageSkills,
        'anexo.idiomas': anexo.idiomas,
        'anexo.workExperience': anexo.workExperience,
        'anexo.workExperience length': anexo.workExperience?.length,
        'anexo.workExperience tipo': typeof anexo.workExperience,
        'anexo.workExperience es array': Array.isArray(anexo.workExperience),
        'anexo.experienciaLaboral': anexo.experienciaLaboral,
        'anexo completo keys': Object.keys(anexo),
      });
      
      // Cargar datos personales - buscar en múltiples lugares (formData.personalData, personalData, o directamente en anexo)
      const pd = anexo.formData?.personalData || anexo.personalData || anexo;
      
      // Función helper local para obtener valores
      const getVal = (field: string, defaultValue: any = '') => {
        // Buscar en múltiples ubicaciones posibles
        let value = pd?.[field] 
          || anexo.formData?.personalData?.[field]
          || anexo.personalData?.[field]
          || anexo?.[field]
          || pd?.[field.toLowerCase()]
          || anexo?.[field.toLowerCase()]
          || defaultValue;
        
        // Si el valor es un objeto, intentar convertirlo a string
        if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
          // Si tiene propiedades comunes de dirección, construir string
          if (field === 'direccion' && (value.direccion || value.departamento || value.provincia || value.distrito)) {
            const parts = [];
            if (value.direccion) parts.push(value.direccion);
            if (value.departamento) parts.push(value.departamento);
            if (value.provincia) parts.push(value.provincia);
            if (value.distrito) parts.push(value.distrito);
            value = parts.join(', ');
          } else {
            // Para otros objetos, intentar stringify
            try {
              value = JSON.stringify(value);
            } catch (e) {
              value = String(value);
            }
          }
        }
        
        // Log para debugging
        if (field === 'fechaNacimiento' || field === 'lugarNacimientoDepartamentoId' || field === 'lugarNacimientoProvinciaId' || field === 'lugarNacimientoDistritoId' || field === 'direccion') {
          console.log(`🔍 Campo ${field}:`, {
            'pd[field]': pd?.[field],
            'formData.personalData': anexo.formData?.personalData?.[field],
            'personalData': anexo.personalData?.[field],
            'anexo[field]': anexo?.[field],
            'valor final': value,
            'tipo': typeof value
          });
        }
        
        return value;
      };
      
      // Obtener valores de la convocatoria seleccionada para actualizar campos
      // IMPORTANTE: Si el anexo es de otra convocatoria, SIEMPRE usar los valores de la convocatoria actual
      const codigoFromConvocatoria = convocatoriaSeleccionada?.id?.toString() || '';
      const puestoFromConvocatoria = convocatoriaSeleccionada?.puesto || '';
      const casFromConvocatoria = convocatoriaSeleccionada?.numero_cas || convocatoriaSeleccionada?.numeroCAS || '';
      
      // Si el anexo NO pertenece a la convocatoria actual, SIEMPRE usar los valores de la convocatoria actual
      const usarValoresConvocatoria = !perteneceAConvocatoriaActual && convocatoriaSeleccionada?.id;

      const formData = {
        personalData: {
          // Si el anexo es de otra convocatoria, SIEMPRE usar los valores de la convocatoria actual
          // Si pertenece a la convocatoria actual, usar los valores del anexo
          codigo: usarValoresConvocatoria ? codigoFromConvocatoria : (codigoFromConvocatoria || getVal('codigo', '')),
          nombrePuesto: usarValoresConvocatoria ? puestoFromConvocatoria : (puestoFromConvocatoria || getVal('nombrePuesto', '')),
          tipoDocumento: (getVal('tipoDocumento', 'DNI') as 'DNI' | 'CARNET DE EXTRANJERÍA') || 'DNI',
          dni: getVal('dni', ''),
          carnetExtranjeria: getVal('carnetExtranjeria', ''),
          apellidoPaterno: getVal('apellidoPaterno', ''),
          apellidoMaterno: getVal('apellidoMaterno', ''),
          nombres: getVal('nombres', ''),
          genero: (getVal('genero', 'M') as 'F' | 'M') || 'M',
          direccion: getVal('direccion', ''),
          provincia: getVal('provincia', ''),
          departamento: getVal('departamento', ''),
          distrito: getVal('distrito', ''),
          departamentoId: getVal('departamentoId', ''),
          provinciaId: getVal('provinciaId', ''),
          distritoId: getVal('distritoId', ''),
          referenciaDireccion: getVal('referenciaDireccion', ''),
          fechaNacimiento: (() => {
            const valor = getVal('fechaNacimiento', '');
            console.log('📅 fechaNacimiento raw:', valor, 'type:', typeof valor, 'from anexo:', anexo.fechaNacimiento, 'from pd:', pd?.fechaNacimiento);
            // Usar formatDateForDateInput porque el input es type="date" que requiere YYYY-MM-DD
            return formatDateForDateInput(valor);
          })(),
          lugarNacimiento: getVal('lugarNacimiento', ''),
          lugarNacimientoDepartamentoId: getVal('lugarNacimientoDepartamentoId', ''),
          lugarNacimientoProvinciaId: getVal('lugarNacimientoProvinciaId', ''),
          lugarNacimientoDistritoId: getVal('lugarNacimientoDistritoId', ''),
          lugarNacimientoDepartamento: getVal('lugarNacimientoDepartamento', ''),
          lugarNacimientoProvincia: getVal('lugarNacimientoProvincia', ''),
          lugarNacimientoDistrito: getVal('lugarNacimientoDistrito', ''),
          correoElectronico: getVal('correoElectronico', ''),
          telefonoDomicilio: getVal('telefonoDomicilio', ''),
          telefonoCelular1: getVal('telefonoCelular1', ''),
          telefonoCelular2: getVal('telefonoCelular2', ''),
          correoElectronicoAlterno: getVal('correoElectronicoAlterno', ''),
          conadis: (getVal('conadis', 'NO') as 'SI' | 'NO') || 'NO',
          nCarnetConadis: getVal('nCarnetConadis', ''),
          codigoConadis: getVal('codigoConadis', ''),
          fuerzasArmadas: (getVal('fuerzasArmadas', 'NO') as 'SI' | 'NO') || 'NO',
          nCarnetFuerzasArmadas: getVal('nCarnetFuerzasArmadas', ''),
          codigoFuerzasArmadas: getVal('codigoFuerzasArmadas', ''),
          asistenciaEspecial: getVal('asistenciaEspecial', ''),
          tiempoSectorPublico: (() => {
            const valor = getVal('tiempoSectorPublico', '');
            console.log('📅 tiempoSectorPublico raw:', valor, 'type:', typeof valor, 'from anexo:', anexo.tiempoSectorPublico, 'from pd:', pd?.tiempoSectorPublico);
            return formatDateForForm(valor);
          })(),
          tiempoSectorPrivado: (() => {
            const valor = getVal('tiempoSectorPrivado', '');
            console.log('📅 tiempoSectorPrivado raw:', valor, 'type:', typeof valor, 'from anexo:', anexo.tiempoSectorPrivado, 'from pd:', pd?.tiempoSectorPrivado);
            return formatDateForForm(valor);
          })(),
          colegioProfesional: getVal('colegioProfesional', ''),
          colegioProfesionalHabilitado: (getVal('colegioProfesionalHabilitado', 'NO') as 'SI' | 'NO') || 'NO',
          nColegiatura: getVal('nColegiatura', ''),
          fechaVencimientoColegiatura: formatDateForForm(getVal('fechaVencimientoColegiatura', '')),
          // Si el anexo es de otra convocatoria, SIEMPRE usar el CAS de la convocatoria actual
          numeroCas: usarValoresConvocatoria ? casFromConvocatoria : (casFromConvocatoria || getVal('numeroCas', '')),
        },
        // Cargar Formación Académica - usar datos ya mapeados o buscar en múltiples ubicaciones
        academicFormation: (() => {
          // Priorizar los datos ya mapeados desde la API
          let arr = anexo.academicFormation 
            || anexo.formData?.academicFormation 
            || anexo.formacionAcademica
            || [];
          
          // Si es string, intentar parsearlo como JSON
          if (typeof arr === 'string') {
            try {
              arr = JSON.parse(arr);
            } catch (e) {
              console.warn('⚠️ Error al parsear formacionAcademica:', e);
              arr = [];
            }
          }
          
          console.log('📚 Formación Académica cargada:', arr, 'tipo:', typeof arr, 'es array:', Array.isArray(arr), 'length:', arr?.length);
          return Array.isArray(arr) ? arr : [];
        })(),
        // Cargar Idiomas - usar datos ya mapeados o buscar en múltiples ubicaciones
        languageSkills: (() => {
          // Priorizar los datos ya mapeados desde la API
          let arr = anexo.languageSkills 
            || anexo.formData?.languageSkills 
            || anexo.idiomas
            || [];
          
          // Si es string, intentar parsearlo como JSON
          if (typeof arr === 'string') {
            try {
              arr = JSON.parse(arr);
            } catch (e) {
              console.warn('⚠️ Error al parsear idiomas:', e);
              arr = [];
            }
          }
          
          console.log('🌐 Idiomas cargados:', arr, 'tipo:', typeof arr, 'es array:', Array.isArray(arr), 'length:', arr?.length);
          return Array.isArray(arr) ? arr : [];
        })(),
        // Cargar Ofimática - usar datos ya mapeados o buscar en múltiples ubicaciones
        officeSkills: (() => {
          // Priorizar los datos ya mapeados desde la API
          let arr = anexo.officeSkills 
            || anexo.formData?.officeSkills 
            || anexo.ofimatica
            || [];
          
          // Si es string, intentar parsearlo como JSON
          if (typeof arr === 'string') {
            try {
              arr = JSON.parse(arr);
            } catch (e) {
              console.warn('⚠️ Error al parsear ofimatica:', e);
              arr = [];
            }
          }
          
          console.log('💻 Ofimática cargada:', arr, 'tipo:', typeof arr, 'es array:', Array.isArray(arr), 'length:', arr?.length);
          return Array.isArray(arr) ? arr : [];
        })(),
        // Cargar Especialización - usar datos ya mapeados o buscar en múltiples ubicaciones
        specializationStudies: (() => {
          // Priorizar los datos ya mapeados desde la API
          let arr = anexo.specializationStudies 
            || anexo.formData?.specializationStudies 
            || anexo.especializacion
            || [];
          
          // Si es string, intentar parsearlo como JSON
          if (typeof arr === 'string') {
            try {
              arr = JSON.parse(arr);
            } catch (e) {
              console.warn('⚠️ Error al parsear especializacion:', e);
              arr = [];
            }
          }
          
          // Asegurar que todos los elementos tengan el formato correcto con tipoEstudio
          if (Array.isArray(arr) && arr.length > 0) {
            arr = arr.map((item: any) => ({
              tipoEstudio: item.tipoEstudio || '',
              nombreEstudio: item.nombreEspecializacion || item.nombreEstudio || '',
              periodoInicio: item.periodoInicio || item.fechaInicio || '',
              periodoFin: item.periodoFin || item.fechaFin || '',
              horas: item.horasAcademicas || item.horas || '',
              centroEstudio: item.institucion || item.centroEstudio || '',
            }));
          }
          
          console.log('🎓 Especialización cargada:', arr, 'tipo:', typeof arr, 'es array:', Array.isArray(arr), 'length:', arr?.length);
          return Array.isArray(arr) ? arr : [];
        })(),
        // Cargar Experiencia Laboral - usar datos ya mapeados o buscar en múltiples ubicaciones
        workExperience: (() => {
          // Priorizar los datos ya mapeados desde la API o desde anexos_completos
          let arr = anexo.workExperience 
            || anexo.formData?.workExperience 
            || anexo.experienciaLaboral
            || [];
          
          // Si es string, intentar parsearlo como JSON
          if (typeof arr === 'string') {
            try {
              arr = JSON.parse(arr);
            } catch (e) {
              console.warn('⚠️ Error al parsear experienciaLaboral:', e);
              arr = [];
            }
          }
          
          // Asegurar que todos los elementos tengan el formato correcto
          if (Array.isArray(arr) && arr.length > 0) {
            arr = arr.map((item: any) => ({
              empresaInstitucion: item.empresaInstitucion || item.empresaEntidad || item.empresa || '',
              sectorGiroNegocio: item.sectorGiroNegocio || item.sector || '',
              puestoCargo: item.puestoCargo || item.cargo || '',
              periodoDesde: item.periodoDesde || (item.fechaInicio ? (() => {
                try {
                  const date = new Date(item.fechaInicio);
                  if (!isNaN(date.getTime())) {
                    return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
                  }
                } catch (e) {}
                return item.fechaInicio || '';
              })() : ''),
              periodoHasta: item.periodoHasta || (item.fechaFin ? (() => {
                try {
                  const date = new Date(item.fechaFin);
                  if (!isNaN(date.getTime())) {
                    return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
                  }
                } catch (e) {}
                return item.fechaFin || '';
              })() : ''),
              funcionPrincipal1: item.funcionPrincipal1 || (item.funciones && typeof item.funciones === 'string' ? item.funciones.split('\n')[0] : '') || '',
              funcionPrincipal2: item.funcionPrincipal2 || (item.funciones && typeof item.funciones === 'string' ? item.funciones.split('\n')[1] : '') || '',
              funcionPrincipal3: item.funcionPrincipal3 || (item.funciones && typeof item.funciones === 'string' ? item.funciones.split('\n')[2] : '') || '',
              funcionPrincipal4: item.funcionPrincipal4 || (item.funciones && typeof item.funciones === 'string' ? item.funciones.split('\n')[3] : '') || '',
              funcionPrincipal5: item.funcionPrincipal5 || (item.funciones && typeof item.funciones === 'string' ? item.funciones.split('\n')[4] : '') || '',
            }));
          }
          
          console.log('💼 Experiencia Laboral cargada:', arr, 'tipo:', typeof arr, 'es array:', Array.isArray(arr), 'length:', arr?.length);
          return Array.isArray(arr) ? arr : [];
        })(),
        // Cargar Referencias Laborales - usar datos ya mapeados o buscar en múltiples ubicaciones
        laborReferences: (() => {
          // Priorizar los datos ya mapeados desde la API
          let arr = anexo.laborReferences 
            || anexo.formData?.laborReferences 
            || anexo.referenciasLaborales
            || [];
          
          // Si es string, intentar parsearlo como JSON
          if (typeof arr === 'string') {
            try {
              arr = JSON.parse(arr);
            } catch (e) {
              console.warn('⚠️ Error al parsear referenciasLaborales:', e);
              arr = [];
            }
          }
          
          console.log('📞 Referencias Laborales cargadas:', arr, 'tipo:', typeof arr, 'es array:', Array.isArray(arr), 'length:', arr?.length);
          return Array.isArray(arr) ? arr : [];
        })(),
        declarations: {
          infoVerdadera: Boolean(anexo.veracidadDatos || anexo.declarations?.infoVerdadera || false),
          fechaDeclaracion: anexo.declarations?.fechaDeclaracion || '',
          leyProteccionDatos: Boolean(anexo.leyProteccionDatos || anexo.declarations?.leyProteccionDatos || false),
          datosConsignadosVerdaderos: Boolean(anexo.datosConsignadosVerdaderos || anexo.declarations?.datosConsignadosVerdaderos || false),
          plenosDerechosCiviles: Boolean(anexo.plenosDerechosCiviles || anexo.declarations?.plenosDerechosCiviles || false),
          cumploRequisitosMinimos: Boolean(anexo.cumplirRequisitos || anexo.declarations?.cumploRequisitosMinimos || anexo.declarations?.cumplirRequisitos || false),
          noCondenaDolosa: Boolean(anexo.noCondenaDolosa || anexo.declarations?.noCondenaDolosa || false),
          noInhabilitacion: Boolean(anexo.noEstarInhabilitado || anexo.declarations?.noInhabilitacion || anexo.declarations?.noEstarInhabilitado || false),
          noSentenciaCondenatoria: Boolean(anexo.noSentenciaCondenatoria || anexo.declarations?.noSentenciaCondenatoria || false),
          noAntecedentesPenales: Boolean(anexo.noAntecedentesPenales || anexo.declarations?.noAntecedentesPenales || false),
          noAntecedentesPoliciales: Boolean(anexo.noAntecedentesPoliciales || anexo.declarations?.noAntecedentesPoliciales || false),
          noAntecedentesJudiciales: Boolean(anexo.noAntecedentesJudiciales || anexo.declarations?.noAntecedentesJudiciales || false),
          noParientesUGEL: Boolean(anexo.noParientesUGEL || anexo.declarations?.noParientesUGEL || false),
          tieneParientesUGEL: (anexo.tieneParientesUGEL || anexo.declarations?.tieneParientesUGEL || 'NO') as 'SI' | 'NO',
        },
        relativesInUGEL: Array.isArray(anexo.parientesUGEL) ? anexo.parientesUGEL : [],
      };

      console.log('✅ Datos cargados en formulario:', {
        personalData: formData.personalData,
        academicFormation: formData.academicFormation?.length || 0,
        languageSkills: formData.languageSkills?.length || 0,
        officeSkills: formData.officeSkills?.length || 0,
        specializationStudies: formData.specializationStudies?.length || 0,
        workExperience: formData.workExperience?.length || 0,
        workExperienceArray: formData.workExperience,
        laborReferences: formData.laborReferences?.length || 0,
        formDataCompleto: formData
      });
      
      // Verificar específicamente workExperience
      if (!formData.workExperience || formData.workExperience.length === 0) {
        console.warn('⚠️ ADVERTENCIA: workExperience está vacío en formData!');
        console.warn('⚠️ anexo.workExperience:', anexo.workExperience);
        console.warn('⚠️ anexo.formData?.workExperience:', anexo.formData?.workExperience);
        console.warn('⚠️ anexo.experienciaLaboral:', anexo.experienciaLaboral);
      } else {
        console.log('✅ workExperience cargado correctamente:', formData.workExperience);
      }

      // Actualizar el estado del formulario
      console.log('🔄 ANTES de setAnexosFormData - formData.workExperience:', formData.workExperience);
      setAnexosFormData(formData);
      
      // Verificar que el estado se actualizó correctamente
      setTimeout(() => {
        console.log('🔄 DESPUÉS de setAnexosFormData - verificando estado');
      }, 100);
      
      // Forzar re-render si es necesario
      console.log('✅ Estado del formulario actualizado con workExperience:', formData.workExperience?.length || 0);

      // IMPORTANTE: Solo establecer editingAnexoId si el anexo pertenece a la convocatoria actual
      // Si no pertenece, editingAnexoId ya fue limpiado arriba para que se cree un nuevo anexo
      if (perteneceAConvocatoriaActual) {
        const anexoId = anexo.IDANEXO_COMPLETO || anexo.IDANEXO || null;
        setEditingAnexoId(anexoId);
        console.log('✅ Anexo pertenece a la convocatoria actual. Se actualizará al guardar:', anexoId);
      } else {
        console.log('🆕 Anexo NO pertenece a la convocatoria actual. Se creará un nuevo anexo al guardar.');
        // editingAnexoId ya fue limpiado arriba
      }

      // Cargar ubicaciones si hay IDs
      if (formData.personalData.departamentoId) {
        const deptos = getDepartamentos();
        const provincias = getProvinciasByDepartamento(formData.personalData.departamentoId);
        setDepartamentos(deptos);
        setProvincias(provincias);
        
        if (formData.personalData.provinciaId) {
          const distritos = getDistritosByProvincia(formData.personalData.departamentoId, formData.personalData.provinciaId);
          setDistritos(distritos);
        }
      }

      // Cargar lugar de nacimiento si hay IDs
      if (formData.personalData.lugarNacimientoDepartamentoId) {
        const lugarDeptos = getDepartamentos();
        const lugarProvincias = getProvinciasByDepartamento(formData.personalData.lugarNacimientoDepartamentoId);
        setLugarNacimientoDepartamentos(lugarDeptos);
        setLugarNacimientoProvincias(lugarProvincias);
        
        if (formData.personalData.lugarNacimientoProvinciaId) {
          const lugarDistritos = getDistritosByProvincia(formData.personalData.lugarNacimientoDepartamentoId, formData.personalData.lugarNacimientoProvinciaId);
          setLugarNacimientoDistritos(lugarDistritos);
        }
      }

      // Mostrar notificación según el caso
      if (!perteneceAConvocatoriaActual && convocatoriaSeleccionada?.id) {
        setNotification({
          message: 'Datos del anexo anterior cargados. Al guardar se creará un nuevo anexo para esta convocatoria sin afectar el anterior.',
          type: 'success'
        });
      } else {
        setNotification({
          message: 'Anexo cargado para edición. Modifica los datos y guarda los cambios.',
          type: 'success'
        });
      }

      // Desplazarse hacia arriba para mostrar el formulario
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('❌ Error al cargar anexo para edición:', error);
      setNotification({
        message: 'Error al cargar el anexo para edición. Por favor, intenta nuevamente.',
        type: 'error'
      });
    }
  };

  // Effect para cargar anexo desde localStorage si viene de edición
  useEffect(() => {
    const anexoToEditStr = localStorage.getItem('anexoToEdit');
    if (anexoToEditStr) {
      try {
        const anexoToEdit = JSON.parse(anexoToEditStr);
        console.log('📋 Cargando anexo para edición desde localStorage:', anexoToEdit);
        loadAnexoForEdit(anexoToEdit);
        // Limpiar después de cargar
        localStorage.removeItem('anexoToEdit');
      } catch (error) {
        console.error('Error al cargar anexo desde localStorage:', error);
        localStorage.removeItem('anexoToEdit');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar una vez al montar

  const handleFieldChange = (seccion: string, campo: string, valor: any) => {
    setAnexosFormData(prevData => ({
      ...prevData,
      [seccion]: {
        ...prevData[seccion as keyof AnexosFormData],
        [campo]: valor,
      },
    }));
  };

  // Función para manejar cambios en departamento
  const handleDepartamentoChange = (departamentoId: string) => {
    const departamentoSeleccionado = departamentos.find(d => d.id === departamentoId);
    
    // Actualizar el formulario
    setAnexosFormData(prevData => ({
      ...prevData,
      personalData: {
        ...prevData.personalData,
        departamentoId: departamentoId,
        departamento: departamentoSeleccionado?.name || '',
        // Limpiar provincia y distrito cuando cambia el departamento
        provinciaId: '',
        provincia: '',
        distritoId: '',
        distrito: '',
      },
    }));

    // Cargar provincias del departamento seleccionado
    const provinciasData = getProvinciasByDepartamento(departamentoId);
    setProvincias(provinciasData);
    setDistritos([]); // Limpiar distritos
  };

  // Función para manejar cambios en provincia
  const handleProvinciaChange = (provinciaId: string) => {
    const provinciaSeleccionada = provincias.find(p => p.id === provinciaId);
    
    // Actualizar el formulario
    setAnexosFormData(prevData => ({
      ...prevData,
      personalData: {
        ...prevData.personalData,
        provinciaId: provinciaId,
        provincia: provinciaSeleccionada?.name || '',
        // Limpiar distrito cuando cambia la provincia
        distritoId: '',
        distrito: '',
      },
    }));

    // Cargar distritos de la provincia seleccionada
    const distritosData = getDistritosByProvincia(anexosFormData.personalData.departamentoId, provinciaId);
    setDistritos(distritosData);
  };

  // Función para manejar cambios en distrito
  const handleDistritoChange = (distritoId: string) => {
    const distritoSeleccionado = distritos.find(d => d.id === distritoId);
    
    // Actualizar el formulario
    setAnexosFormData(prevData => ({
      ...prevData,
      personalData: {
        ...prevData.personalData,
        distritoId: distritoId,
        distrito: distritoSeleccionado?.name || '',
      },
    }));
  };

  // Funciones para manejar cambios en lugar de nacimiento
  const handleLugarNacimientoDepartamentoChange = (departamentoId: string) => {
    const departamentoSeleccionado = lugarNacimientoDepartamentos.find(d => d.id === departamentoId);
    
    // Actualizar el formulario
    setAnexosFormData(prevData => ({
      ...prevData,
      personalData: {
        ...prevData.personalData,
        lugarNacimientoDepartamentoId: departamentoId,
        lugarNacimientoDepartamento: departamentoSeleccionado?.name || '',
        // Limpiar provincia y distrito cuando cambia el departamento
        lugarNacimientoProvinciaId: '',
        lugarNacimientoProvincia: '',
        lugarNacimientoDistritoId: '',
        lugarNacimientoDistrito: '',
      },
    }));

    // Cargar provincias del departamento seleccionado
    const provinciasData = getProvinciasByDepartamento(departamentoId);
    setLugarNacimientoProvincias(provinciasData);
    setLugarNacimientoDistritos([]); // Limpiar distritos
  };

  // Función para manejar cambios en provincia de lugar de nacimiento
  const handleLugarNacimientoProvinciaChange = (provinciaId: string) => {
    const provinciaSeleccionada = lugarNacimientoProvincias.find(p => p.id === provinciaId);
    
    // Actualizar el formulario
    setAnexosFormData(prevData => ({
      ...prevData,
      personalData: {
        ...prevData.personalData,
        lugarNacimientoProvinciaId: provinciaId,
        lugarNacimientoProvincia: provinciaSeleccionada?.name || '',
        // Limpiar distrito cuando cambia la provincia
        lugarNacimientoDistritoId: '',
        lugarNacimientoDistrito: '',
      },
    }));

    // Cargar distritos de la provincia seleccionada
    const distritosData = getDistritosByProvincia(anexosFormData.personalData.lugarNacimientoDepartamentoId, provinciaId);
    setLugarNacimientoDistritos(distritosData);
  };

  // Función para manejar cambios en distrito de lugar de nacimiento
  const handleLugarNacimientoDistritoChange = (distritoId: string) => {
    const distritoSeleccionado = lugarNacimientoDistritos.find(d => d.id === distritoId);
    
    // Actualizar el formulario
    setAnexosFormData(prevData => ({
      ...prevData,
      personalData: {
        ...prevData.personalData,
        lugarNacimientoDistritoId: distritoId,
        lugarNacimientoDistrito: distritoSeleccionado?.name || '',
      },
    }));
  };

  // Effect para construir lugarNacimiento cuando cambien los valores
  useEffect(() => {
    const { lugarNacimientoDistrito, lugarNacimientoProvincia, lugarNacimientoDepartamento } = anexosFormData.personalData;
    
    if (lugarNacimientoDistrito && lugarNacimientoProvincia && lugarNacimientoDepartamento) {
      const lugarNacimientoCompleto = `${lugarNacimientoDistrito}/${lugarNacimientoProvincia}/${lugarNacimientoDepartamento}`;
      
      // Solo actualizar si el valor es diferente para evitar bucle infinito
      if (anexosFormData.personalData.lugarNacimiento !== lugarNacimientoCompleto) {
        setAnexosFormData(prevData => ({
          ...prevData,
          personalData: {
            ...prevData.personalData,
            lugarNacimiento: lugarNacimientoCompleto,
          },
        }));
      }
    } else {
      // Solo actualizar si hay un valor previo
      if (anexosFormData.personalData.lugarNacimiento !== '') {
        setAnexosFormData(prevData => ({
          ...prevData,
          personalData: {
            ...prevData.personalData,
            lugarNacimiento: '',
          },
        }));
      }
    }
  }, [anexosFormData.personalData.lugarNacimientoDistrito, anexosFormData.personalData.lugarNacimientoProvincia, anexosFormData.personalData.lugarNacimientoDepartamento]);

  const handleListFieldChange = (lista: keyof AnexosFormData, index: number, campo: string, valor: any) => {
    setAnexosFormData(prevData => {
      const updatedList = [...(prevData[lista] as any[])];
      updatedList[index] = {
        ...(updatedList[index] && typeof updatedList[index] === 'object' ? updatedList[index] : {}),
        [campo]: valor,
      };
      return {
        ...prevData,
        [lista]: updatedList,
      };
    });
  };

  const handleAddItem = (lista: keyof AnexosFormData, nuevoItem: object) => {
    setAnexosFormData(prevData => {
      const currentList = prevData[lista] as any[];
      // Límite específico para parientes en UGEL: 5, para otras secciones: 20
      const MAX_ITEMS = lista === 'relativesInUGEL' ? 5 : 20;
      
      // Verificar si ya se alcanzó el límite - validación más estricta
      if (currentList && currentList.length >= MAX_ITEMS) {
        setNotification({
          message: `Ha alcanzado el límite máximo de ${MAX_ITEMS} entradas para esta sección.`,
          type: 'error'
        });
        return prevData; // No agregar más items
      }
      
      // Validar que currentList sea un array válido
      if (!Array.isArray(currentList)) {
        console.error(`Error: ${lista} no es un array válido`);
        return prevData;
      }
      
      // Si está cerca del límite, mostrar advertencia
      if (currentList.length === MAX_ITEMS - 1) {
        setNotification({
          message: `Puede agregar una entrada más. El límite máximo es ${MAX_ITEMS} entradas.`,
          type: 'success'
        });
      }
      
      return {
        ...prevData,
        [lista]: [...currentList, nuevoItem],
      };
    });
  };

  const handleRemoveItem = (lista: keyof AnexosFormData, index: number) => {
    setAnexosFormData(prevData => {
      const updatedList = [...(prevData[lista] as any[])];
      updatedList.splice(index, 1);
      return {
        ...prevData,
        [lista]: updatedList,
      };
    });
  };

  // --- PDF GENERATION AND SAVE FUNCTION (remains the same, but uses internal state) ---
  const handleGenerateAndSavePDF = async () => {
    // Validación de campos obligatorios en Datos Personales
    const personalData = anexosFormData.personalData;
    const camposFaltantes: string[] = [];
    
    // Validar campos obligatorios de datos personales
    if (!personalData.codigo || personalData.codigo.trim() === '') {
      camposFaltantes.push('Código de convocatoria');
    }
    if (!personalData.nombrePuesto || personalData.nombrePuesto.trim() === '') {
      camposFaltantes.push('Puesto');
    }
    if (personalData.tipoDocumento === 'DNI' && (!personalData.dni || personalData.dni.trim() === '')) {
      camposFaltantes.push('N° DNI');
    }
    if (personalData.tipoDocumento === 'CARNET DE EXTRANJERÍA' && (!personalData.carnetExtranjeria || personalData.carnetExtranjeria.trim() === '')) {
      camposFaltantes.push('N° Carnet de Extranjería');
    }
    if (!personalData.apellidoPaterno || personalData.apellidoPaterno.trim() === '') {
      camposFaltantes.push('Apellido Paterno');
    }
    if (!personalData.apellidoMaterno || personalData.apellidoMaterno.trim() === '') {
      camposFaltantes.push('Apellido Materno');
    }
    if (!personalData.nombres || personalData.nombres.trim() === '') {
      camposFaltantes.push('Nombres');
    }
    if (!personalData.fechaNacimiento || personalData.fechaNacimiento.trim() === '') {
      camposFaltantes.push('Fecha de Nacimiento');
    }
    if (!personalData.lugarNacimientoDepartamento || !personalData.lugarNacimientoProvincia || !personalData.lugarNacimientoDistrito) {
      camposFaltantes.push('Lugar de Nacimiento (Departamento, Provincia y Distrito)');
    }
    if (!personalData.direccion || personalData.direccion.trim() === '') {
      camposFaltantes.push('Dirección');
    }
    if (!personalData.correoElectronico || personalData.correoElectronico.trim() === '') {
      camposFaltantes.push('Correo Electrónico');
    }
    if (!personalData.telefonoCelular1 || personalData.telefonoCelular1.trim() === '') {
      camposFaltantes.push('Teléfono Celular');
    }
    if (!personalData.numeroCas || personalData.numeroCas.trim() === '') {
      camposFaltantes.push('Número CAS');
    }
    
    // Validar CONADIS si está marcado como SI
    if (personalData.conadis === 'SI') {
      if (!personalData.nCarnetConadis || personalData.nCarnetConadis.trim() === '') {
        camposFaltantes.push('N° Carnet CONADIS');
      }
      if (!personalData.codigoConadis || personalData.codigoConadis.trim() === '') {
        camposFaltantes.push('Código CONADIS');
      }
    }
    
    // Validar Fuerzas Armadas si está marcado como SI
    if (personalData.fuerzasArmadas === 'SI') {
      if (!personalData.nCarnetFuerzasArmadas || personalData.nCarnetFuerzasArmadas.trim() === '') {
        camposFaltantes.push('N° Carnet FFAA');
      }
      if (!personalData.codigoFuerzasArmadas || personalData.codigoFuerzasArmadas.trim() === '') {
        camposFaltantes.push('Código FFAA');
      }
    }
    
    // Si faltan campos, mostrar mensaje y no continuar
    if (camposFaltantes.length > 0) {
      setNotification({ 
        message: `Faltan campos por completar en Datos Personales: ${camposFaltantes.join(', ')}. Por favor, complete todos los campos antes de guardar el anexo.`, 
        type: 'error' 
      });
      return;
    }
    
    // Validar que todas las secciones obligatorias tengan al menos un elemento
    const seccionesFaltantes: string[] = [];
    
    if (!anexosFormData.academicFormation || anexosFormData.academicFormation.length === 0) {
      seccionesFaltantes.push('Formación Académica');
    }
    
    if (!anexosFormData.languageSkills || anexosFormData.languageSkills.length === 0) {
      seccionesFaltantes.push('Idiomas y/o Dialecto');
    }
    
    if (!anexosFormData.officeSkills || anexosFormData.officeSkills.length === 0) {
      seccionesFaltantes.push('Conocimientos de Ofimática');
    }
    
    if (!anexosFormData.specializationStudies || anexosFormData.specializationStudies.length === 0) {
      seccionesFaltantes.push('Estudios de Especialización');
    }
    
    if (!anexosFormData.workExperience || anexosFormData.workExperience.length === 0) {
      seccionesFaltantes.push('Experiencia Laboral');
    }
    
    if (!anexosFormData.laborReferences || anexosFormData.laborReferences.length === 0) {
      seccionesFaltantes.push('Referencias Laborales');
    }
    
    // Si faltan secciones, mostrar mensaje y no continuar
    if (seccionesFaltantes.length > 0) {
      setNotification({ 
        message: `Debe completar las siguientes secciones obligatorias antes de guardar el anexo: ${seccionesFaltantes.join(', ')}.`, 
        type: 'error' 
      });
      return;
    }
    
    // Validar que los elementos agregados tengan los campos requeridos completos
    // Validar Formación Académica
    for (let i = 0; i < anexosFormData.academicFormation.length; i++) {
      const item = anexosFormData.academicFormation[i];
      if (!item.nivelEducativo || item.nivelEducativo.trim() === '') {
        setNotification({ 
          message: `Formación Académica (registro ${i + 1}): Debe seleccionar el Nivel Educativo.`, 
          type: 'error' 
        });
        return;
      }
      if (item.nivelEducativo === 'OTROS (ESPECIFICAR)' && (!item.otrosNivelEspecificar || item.otrosNivelEspecificar.trim() === '')) {
        setNotification({ 
          message: `Formación Académica (registro ${i + 1}): Debe especificar el nivel educativo.`, 
          type: 'error' 
        });
        return;
      }
      if (!item.nombreCarrera || item.nombreCarrera.trim() === '') {
        setNotification({ 
          message: `Formación Académica (registro ${i + 1}): Debe ingresar el Nombre de la Carrera.`, 
          type: 'error' 
        });
        return;
      }
      if (!item.institucion || item.institucion.trim() === '') {
        setNotification({ 
          message: `Formación Académica (registro ${i + 1}): Debe ingresar la Institución.`, 
          type: 'error' 
        });
        return;
      }
    }
    
    // Validar Idiomas y/o Dialecto
    for (let i = 0; i < anexosFormData.languageSkills.length; i++) {
      const item = anexosFormData.languageSkills[i];
      if (!item.idiomaDialecto || item.idiomaDialecto.trim() === '') {
        setNotification({ 
          message: `Idiomas y/o Dialecto (registro ${i + 1}): Debe ingresar el Idioma/Dialecto.`, 
          type: 'error' 
        });
        return;
      }
      if (!item.nivel || item.nivel.trim() === '') {
        setNotification({ 
          message: `Idiomas y/o Dialecto (registro ${i + 1}): Debe seleccionar el Nivel.`, 
          type: 'error' 
        });
        return;
      }
    }
    
    // Validar Conocimientos de Ofimática
    for (let i = 0; i < anexosFormData.officeSkills.length; i++) {
      const item = anexosFormData.officeSkills[i];
      if (!item.materia || item.materia.trim() === '') {
        setNotification({ 
          message: `Conocimientos de Ofimática (registro ${i + 1}): Debe ingresar la Materia.`, 
          type: 'error' 
        });
        return;
      }
      if (!item.nivel || item.nivel.trim() === '') {
        setNotification({ 
          message: `Conocimientos de Ofimática (registro ${i + 1}): Debe seleccionar el Nivel.`, 
          type: 'error' 
        });
        return;
      }
    }
    
    // Validar Estudios de Especialización
    for (let i = 0; i < anexosFormData.specializationStudies.length; i++) {
      const item = anexosFormData.specializationStudies[i];
      if (!item.tipoEstudio || item.tipoEstudio.trim() === '') {
        setNotification({ 
          message: `Estudios de Especialización (registro ${i + 1}): Debe seleccionar el Tipo de Estudio.`, 
          type: 'error' 
        });
        return;
      }
      if (!item.nombreEstudio || item.nombreEstudio.trim() === '') {
        setNotification({ 
          message: `Estudios de Especialización (registro ${i + 1}): Debe ingresar el Nombre del Estudio.`, 
          type: 'error' 
        });
        return;
      }
      if (!item.centroEstudio || item.centroEstudio.trim() === '') {
        setNotification({ 
          message: `Estudios de Especialización (registro ${i + 1}): Debe ingresar el Centro de Estudio.`, 
          type: 'error' 
        });
        return;
      }
    }
    
    // Validar Experiencia Laboral
    for (let i = 0; i < anexosFormData.workExperience.length; i++) {
      const item = anexosFormData.workExperience[i];
      if (!item.empresaInstitucion || item.empresaInstitucion.trim() === '') {
        setNotification({ 
          message: `Experiencia Laboral (registro ${i + 1}): Debe ingresar la Empresa/Institución.`, 
          type: 'error' 
        });
        return;
      }
      if (!item.puestoCargo || item.puestoCargo.trim() === '') {
        setNotification({ 
          message: `Experiencia Laboral (registro ${i + 1}): Debe ingresar el Puesto/Cargo.`, 
          type: 'error' 
        });
        return;
      }
      if (!item.periodoDesde || item.periodoDesde.trim() === '') {
        setNotification({ 
          message: `Experiencia Laboral (registro ${i + 1}): Debe ingresar el Periodo Desde.`, 
          type: 'error' 
        });
        return;
      }
      if (!item.periodoHasta || item.periodoHasta.trim() === '') {
        setNotification({ 
          message: `Experiencia Laboral (registro ${i + 1}): Debe ingresar el Periodo Hasta.`, 
          type: 'error' 
        });
        return;
      }
      // Validar que tenga al menos una función principal
      if (!item.funcionPrincipal1 || item.funcionPrincipal1.trim() === '') {
        setNotification({ 
          message: `Experiencia Laboral (registro ${i + 1}): Debe ingresar al menos una Función Principal.`, 
          type: 'error' 
        });
        return;
      }
    }
    
    // Validar Referencias Laborales
    for (let i = 0; i < anexosFormData.laborReferences.length; i++) {
      const item = anexosFormData.laborReferences[i];
      if (!item.empresaEntidad || item.empresaEntidad.trim() === '') {
        setNotification({ 
          message: `Referencias Laborales (registro ${i + 1}): Debe ingresar la Empresa/Entidad.`, 
          type: 'error' 
        });
        return;
      }
      if (!item.cargoPostulante || item.cargoPostulante.trim() === '') {
        setNotification({ 
          message: `Referencias Laborales (registro ${i + 1}): Debe ingresar el Cargo del Postulante.`, 
          type: 'error' 
        });
        return;
      }
      if (!item.nombreCargoJefe || item.nombreCargoJefe.trim() === '') {
        setNotification({ 
          message: `Referencias Laborales (registro ${i + 1}): Debe ingresar el Nombre y Cargo del Jefe.`, 
          type: 'error' 
        });
        return;
      }
      if (!item.telefonos || item.telefonos.trim() === '') {
        setNotification({ 
          message: `Referencias Laborales (registro ${i + 1}): Debe ingresar los Teléfonos.`, 
          type: 'error' 
        });
        return;
      }
    }
    
    // Validar declaraciones básicas
    const declarations = anexosFormData.declarations;
    const basicDeclarations = [
      declarations.infoVerdadera,
      declarations.leyProteccionDatos,
      declarations.datosConsignadosVerdaderos,
      declarations.plenosDerechosCiviles,
      declarations.cumploRequisitosMinimos,
      declarations.noCondenaDolosa,
      declarations.noInhabilitacion,
      declarations.noSentenciaCondenatoria,
      declarations.noAntecedentesPenales,
      declarations.noAntecedentesPoliciales,
      declarations.noAntecedentesJudiciales
    ];
    
    // Validar declaración de parientes en UGEL
    let parientesValid = false;
    if (declarations.tieneParientesUGEL === 'NO') {
      // Si dice que NO tiene parientes, debe marcar la casilla correspondiente
      parientesValid = declarations.noParientesUGEL;
    } else if (declarations.tieneParientesUGEL === 'SI') {
      // Si dice que SÍ tiene parientes, debe haber agregado al menos uno
      parientesValid = anexosFormData.relativesInUGEL.length > 0;
    }
    
    if (!basicDeclarations.every(Boolean) || !parientesValid) {
        setNotification({ message: 'Debe aceptar todas las declaraciones juradas para guardar el formulario.', type: 'error' });
        return;
    }

    // Si todo está completo, mostrar modal de confirmación
    setShowConfirmationModal(true);
  };

  // Función para proceder con el guardado después de la confirmación
  const handleConfirmSave = async () => {
    setShowConfirmationModal(false);

    // Create a deep copy to avoid mutating the original state
    const dataToSend = JSON.parse(JSON.stringify(anexosFormData));

    // Apply date formatting to relevant fields
    if (dataToSend.personalData.fechaNacimiento) {
        dataToSend.personalData.fechaNacimiento = formatDateForBackend(dataToSend.personalData.fechaNacimiento);
    }
    if (dataToSend.personalData.fechaVencimientoColegiatura) {
        dataToSend.personalData.fechaVencimientoColegiatura = formatDateForBackend(dataToSend.personalData.fechaVencimientoColegiatura);
    }
    if (dataToSend.personalData.tiempoSectorPublico) {
        dataToSend.personalData.tiempoSectorPublico = formatDateForBackend(dataToSend.personalData.tiempoSectorPublico);
    }
    if (dataToSend.personalData.tiempoSectorPrivado) {
        dataToSend.personalData.tiempoSectorPrivado = formatDateForBackend(dataToSend.personalData.tiempoSectorPrivado);
    }
    dataToSend.academicFormation = dataToSend.academicFormation.map((item: any) => ({
        ...item,
        anoDesde: formatDateForBackend(item.anoDesde),
        anoHasta: formatDateForBackend(item.anoHasta),
    }));
    dataToSend.specializationStudies = dataToSend.specializationStudies.map((item: any) => ({
        ...item,
        periodoInicio: formatDateForBackend(item.periodoInicio),
        periodoFin: formatDateForBackend(item.periodoFin),
    }));
    dataToSend.workExperience = dataToSend.workExperience.map((item: any) => ({
        ...item,
        // periodoDesde y periodoHasta ahora son strings en formato MM/AAAA, no necesitan formateo
        periodoDesde: item.periodoDesde || '',
        periodoHasta: item.periodoHasta || '',
    }));

    try {
        // Prepare FormData for upload (sin PDF)
        const uploadFormData = new FormData();
        uploadFormData.append('formDataJson', JSON.stringify(dataToSend)); // Send formatted form data as JSON
        
        // IMPORTANTE: Enviar explícitamente el ID de convocatoria para asegurar que cada anexo esté asociado a su convocatoria
        const convocatoriaId = convocatoriaSeleccionada?.id || convocatoriaSeleccionada?.IDCONVOCATORIA || null;
        if (convocatoriaId) {
          uploadFormData.append('convocatoriaId', convocatoriaId.toString());
          console.log('📋 Enviando convocatoriaId explícitamente:', convocatoriaId);
        } else {
          console.warn('⚠️ No hay convocatoriaId disponible para asociar al anexo');
        }

        const headers: HeadersInit = {
          'ngrok-skip-browser-warning': 'true'
        };
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        // IMPORTANTE: Verificar que el anexo que se va a actualizar pertenece a la convocatoria seleccionada
        // Si editingAnexoId está establecido pero no corresponde a la convocatoria actual,
        // SIEMPRE crear un nuevo anexo en lugar de actualizar (para mantener independencia entre convocatorias)
        let isUpdating = false;
        let endpoint = '';
        
        if (editingAnexoId !== null && convocatoriaId) {
          // Verificar que el anexo pertenece EXACTAMENTE a esta convocatoria
          // Buscar en anexosCompletos si el anexo existe y corresponde a esta convocatoria
          const anexoToUpdate = anexosCompletos.find((a: any) => 
            (a.IDANEXO_COMPLETO === editingAnexoId || a.IDANEXO === editingAnexoId) &&
            a.IDCONVOCATORIA && Number(a.IDCONVOCATORIA) === Number(convocatoriaId)
          );
          
          if (anexoToUpdate) {
            // El anexo existe y pertenece EXACTAMENTE a esta convocatoria, actualizarlo
            isUpdating = true;
            endpoint = `${API_BASE_URL}/documentos/anexos-completos/${editingAnexoId}`;
            console.log('✅ Actualizando anexo existente para esta convocatoria:', {
              anexoId: editingAnexoId,
              convocatoriaId: convocatoriaId,
              anexoConvocatoriaId: anexoToUpdate.IDCONVOCATORIA
            });
          } else {
            // El anexo no pertenece a esta convocatoria, SIEMPRE crear uno nuevo
            // Esto asegura que cada convocatoria tenga su propio anexo independiente
            isUpdating = false;
            endpoint = `${API_BASE_URL}/documentos/upload-anexo`;
            console.log('🆕 Creando nuevo anexo para esta convocatoria (el anexo editado pertenece a otra convocatoria):', {
              editingAnexoId: editingAnexoId,
              convocatoriaId: convocatoriaId,
              anexoConvocatoriaId: anexosCompletos.find((a: any) => 
                a.IDANEXO_COMPLETO === editingAnexoId || a.IDANEXO === editingAnexoId
              )?.IDCONVOCATORIA
            });
            // Limpiar editingAnexoId para evitar confusión
            setEditingAnexoId(null);
            
            // Mostrar notificación informativa
            setNotification({
              message: 'Se creará un nuevo anexo para esta convocatoria. El anexo anterior de otra convocatoria no se modificará.',
              type: 'success'
            });
          }
        } else if (editingAnexoId !== null && !convocatoriaId) {
          // Si hay editingAnexoId pero no hay convocatoria, actualizar el anexo existente
          // (solo para anexos sin convocatoria)
          isUpdating = true;
          endpoint = `${API_BASE_URL}/documentos/anexos-completos/${editingAnexoId}`;
        } else {
          // Crear nuevo anexo (no hay editingAnexoId o no hay convocatoria)
          isUpdating = false;
          endpoint = `${API_BASE_URL}/documentos/upload-anexo`;
          console.log('🆕 Creando nuevo anexo:', {
            tieneEditingAnexoId: editingAnexoId !== null,
            tieneConvocatoriaId: !!convocatoriaId
          });
        }
        
        const response = await fetch(endpoint, {
            method: isUpdating ? 'PUT' : 'POST',
            body: uploadFormData, // No 'Content-Type' header needed for FormData
            headers: headers,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Error desconocido al subir el anexo.' }));
            throw new Error(errorData.message || `Error al subir el Anexo: ${response.statusText}`);
        }

        const result = await response.json();
        console.log(isUpdating ? 'Update successful:' : 'Upload successful:', result);

        // Limpiar borrador después de guardar exitosamente
        try {
          const convocatoriaId = convocatoriaSeleccionada?.id || null;
          await fetch(
            `${API_BASE_URL}/documentos/anexos/draft?convocatoriaId=${convocatoriaId || ''}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
              },
            }
          );
          // Actualizar estado para ocultar el banner de borrador
          setHasDraftSaved(false);
          setDraftLastUpdated(null);
          setLastSavedTime(null);
          console.log('✅ Borrador eliminado después de guardar anexo');
        } catch (error) {
          console.error('Error al limpiar borrador:', error);
        }

        // Limpiar el estado de edición y recargar la lista (tanto para crear como actualizar)
        setEditingAnexoId(null);
        // Recargar la lista de anexos completados y mostrar solo el más reciente
        try {
          const reloadResponse = await fetch(`${API_BASE_URL}/documentos/anexos-completos`, {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true'
            },
          });
          if (reloadResponse.ok) {
            const reloadData = await reloadResponse.json();
            const anexosArray = Array.isArray(reloadData) ? reloadData : [];
            
            // Log para debugging
            console.log('🔄 Recarga después de guardar - Anexos recibidos:', anexosArray.length, 'anexos');
            anexosArray.forEach((anexo: any, idx: number) => {
              console.log(`  Anexo ${idx + 1}:`, {
                id: anexo.IDANEXO_COMPLETO || anexo.IDANEXO,
                fechaCreacion: anexo.fechaCreacion,
                fechaActualizacion: anexo.fechaActualizacion,
                nombrePuesto: anexo.nombrePuesto || anexo.personalData?.nombrePuesto
              });
            });
            
            const ultimoAnexo = obtenerUltimoAnexoModificado(anexosArray);
            console.log('✅ Último anexo modificado después de recarga:', ultimoAnexo.length > 0 ? {
              id: ultimoAnexo[0].IDANEXO_COMPLETO || ultimoAnexo[0].IDANEXO,
              fechaCreacion: ultimoAnexo[0].fechaCreacion,
              fechaActualizacion: ultimoAnexo[0].fechaActualizacion
            } : 'Ninguno');
            
            setAnexosCompletos(ultimoAnexo);
          }
        } catch (error) {
          console.error('Error al recargar anexos completados:', error);
        }

        // Mostrar mensaje de éxito
        setNotification({ 
          message: isUpdating 
            ? 'Anexo actualizado exitosamente. Redirigiendo a Curriculum...' 
            : 'Anexo guardado exitosamente. Redirigiendo a Curriculum...', 
          type: 'success' 
        });
        
        // Redirigir directamente a CurriculumSection (sin generar PDF)
        setTimeout(() => {
          navigate('curriculum', { 
            state: { 
              convocatoria: convocatoriaSeleccionada, 
              anexoId: result.id,
              fromAnexos: true,
              anexosCompletados: true, // Marcar que los anexos están completados
            } 
          });
        }, 1000); // Esperar 1 segundo antes de redirigir
    } catch (error: any) {
        console.error('Error al guardar el formulario:', error);
        setNotification({ message: `Error al guardar el formulario: ${error.message}`, type: 'error' });
    }
};
    
  return (
    <motion.section 
        key="anexos" 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }} 
        className={cn("w-full max-w-none mx-auto px-4", darkMode ? "" : "bg-white rounded-lg p-6")}
        style={{ width: '100%', maxWidth: 'none' }}
    >
      {/* Header Mejorado */}
      <div className="text-center mb-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className={cn("inline-block p-4 rounded-lg mb-6", darkMode
            ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20"
            : "bg-gray-100")}
        >
          <IconFileText className={cn("w-12 h-12", darkMode ? "text-indigo-400" : "text-gray-700")} />
        </motion.div>
        <h1 className={cn("text-4xl font-bold mb-4", darkMode
          ? "bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent"
          : "text-gray-800")}>
          FICHA DE DATOS PERSONALES
        </h1>
        <p className={cn("text-lg", darkMode ? textSecondaryClasses : "text-gray-600")}>
          DECLARACIÓN JURADA DE DATOS PERSONALES. Complete toda la información requerida con veracidad.
        </p>
        
        {/* Banner de Borrador Guardado (similar a Gmail) */}
        {hasDraftSaved && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 w-full"
          >
            <div className={cn(
              "px-6 py-4 rounded-lg border-2 shadow-md flex items-center justify-between gap-4",
              darkMode
                ? "bg-blue-500/20 border-blue-400/50 backdrop-blur-sm"
                : "bg-blue-50 border-blue-300"
            )}>
              <div className="flex items-center gap-3 flex-1">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  darkMode ? "bg-blue-500/30" : "bg-blue-100"
                )}>
                  <IconDeviceFloppy className={cn("w-5 h-5", darkMode ? "text-blue-300" : "text-blue-600")} />
                </div>
                <div className="flex-1">
                  <p className={cn("font-semibold text-sm mb-1", darkMode ? "text-blue-200" : "text-blue-900")}>
                    📝 Borrador Guardado
                  </p>
                  <p className={cn("text-xs mt-1 italic", darkMode ? "text-blue-300/70" : "text-blue-600")}>
                    Todos los datos del formulario están guardados automáticamente
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <IconCheck className={cn("w-5 h-5", darkMode ? "text-green-400" : "text-green-600")} />
              </div>
            </div>
          </motion.div>
        )}

        {/* Info de convocatoria seleccionada */}
        {convocatoriaSeleccionada && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={hasDraftSaved ? "mt-4 inline-block" : "mt-6 inline-block"}
          >
            <div className={cn("px-6 py-3 border rounded-full", darkMode
              ? "bg-indigo-500/10 border-indigo-500/30"
              : "bg-blue-500/10 border-blue-500/30")}>
              <p className={cn("text-sm", darkMode ? "text-indigo-300" : "text-blue-700")}>
                Postulando a: <span className={cn("font-semibold", darkMode ? "text-indigo-200" : "text-blue-900")}>{convocatoriaSeleccionada.puesto}</span>
              </p>
            </div>
          </motion.div>
        )}
        
        {/* Indicador de guardado automático - Solo visible cuando está guardando o desactivado */}
        {(isSavingDraft || !shouldSaveDraft) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 flex items-center justify-center gap-2"
          >
            {isSavingDraft ? (
              <div className={cn("px-4 py-2 border rounded-full flex items-center gap-2", darkMode
                ? "bg-emerald-500/10 border-emerald-500/30"
                : "bg-emerald-50 border-emerald-300")}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className={cn("w-4 h-4 border-2 border-t-transparent rounded-full", darkMode ? "border-emerald-400" : "border-emerald-600")}
                />
                <span className={cn("text-xs font-medium", darkMode ? "text-emerald-300" : "text-emerald-700")}>
                  Guardando...
                </span>
              </div>
            ) : !shouldSaveDraft ? (
              <div className={cn("px-4 py-2 border rounded-full flex items-center gap-2", darkMode
                ? "bg-gray-500/10 border-gray-500/30"
                : "bg-gray-50 border-gray-300")}>
                <IconDeviceFloppy className={cn("w-4 h-4", darkMode ? "text-gray-400" : "text-gray-600")} />
                <span className={cn("text-xs font-medium", darkMode ? "text-gray-300" : "text-gray-700")}>
                  Guardado automático desactivado
                </span>
                <button
                  onClick={() => {
                    setShouldSaveDraft(true);
                    saveDraftToAPI(); // Guardar inmediatamente al reactivar
                    setNotification({
                      message: 'Guardado automático activado. Tus cambios se guardarán automáticamente.',
                      type: 'success'
                    });
                  }}
                  className={cn("ml-2 text-xs underline hover:no-underline", darkMode ? "text-gray-300 hover:text-gray-200" : "text-gray-700 hover:text-gray-800")}
                  title="Activar guardado automático"
                >
                  Activar
                </button>
              </div>
            ) : null}
          </motion.div>
        )}
      </div>

      <div className={cn("p-6 md:p-10 rounded-lg border shadow-sm w-full", darkMode
        ? "border-neutral-800/50 bg-neutral-900/30"
        : "border-gray-300 bg-white")}>
        
        {/* Mensaje informativo sobre campos obligatorios */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn("mb-6 p-4 rounded-lg border", darkMode
            ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
            : "bg-yellow-50 border-yellow-300 text-yellow-800")}
        >
          <p className={cn("text-base font-semibold flex items-center gap-2", darkMode ? "text-amber-300" : "text-amber-900")}>
            <IconInfoCircle className="w-5 h-5" />
            <span>Información importante:</span>
          </p>
          <p className={cn("text-sm mt-2 ml-7", darkMode ? "text-amber-200" : "text-amber-800")}>
            Todos los campos marcados con <span className="text-red-500 font-bold">*</span> son <strong>obligatorios</strong> y deben completarse antes de enviar el formulario. Asegúrese de llenar todos los datos con veracidad.
          </p>
        </motion.div>

        {/* Sección de Anexos Completos Guardados */}
        {showCompletedAnexos && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn("mb-6 p-6 rounded-lg border", darkMode
            ? "bg-indigo-500/10 border-indigo-500/30"
            : "bg-gray-50 border-gray-300")}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <IconFileText className={cn("w-6 h-6", darkMode ? "text-indigo-400" : "text-indigo-600")} />
              <h2 className={cn("text-xl font-bold", darkMode ? "text-indigo-200" : "text-gray-800")}>
                Mis Anexos Completados {anexosCompletos.length > 0 ? '(Último modificado)' : '(0)'}
              </h2>
            </div>
            <button
              onClick={() => setShowAnexosCompletos(!showAnexosCompletos)}
              className={cn("px-4 py-2 rounded-lg font-semibold transition-all", darkMode
                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white")}
            >
              {showAnexosCompletos ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>

          {loadingAnexosCompletos ? (
            <div className={cn("text-center py-8", darkMode ? "text-indigo-300" : "text-indigo-600")}>
              <p>Cargando anexos completados...</p>
            </div>
          ) : (
            <AnimatePresence>
              {showAnexosCompletos && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 mt-4"
                >
                  {anexosCompletos.length > 0 ? (
                    anexosCompletos.map((anexo, index) => (
                    <motion.div
                      key={anexo.IDANEXO_COMPLETO || index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={cn("p-4 rounded-lg border", darkMode
                        ? "bg-neutral-800/50 border-indigo-500/20"
                        : "bg-white border-gray-300")}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className={cn("text-sm font-semibold mb-1", darkMode ? "text-indigo-300" : "text-indigo-700")}>
                            Anexo #1
                          </p>
                          <p className={cn("text-xs", darkMode ? "text-neutral-400" : "text-gray-600")}>
                            {anexo.fechaCreacion ? new Date(anexo.fechaCreacion).toLocaleDateString('es-PE', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Fecha no disponible'}
                          </p>
                        </div>
                        <div>
                          <p className={cn("text-sm font-semibold mb-1", darkMode ? "text-indigo-300" : "text-indigo-700")}>
                            {anexo.nombrePuesto || anexo.personalData?.nombrePuesto || 'Sin puesto especificado'}
                          </p>
                          {anexo.numeroCas && (
                            <p className={cn("text-xs", darkMode ? "text-neutral-400" : "text-gray-600")}>
                              N° CAS: {anexo.numeroCas}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className={cn("text-sm font-semibold mb-1", darkMode ? "text-indigo-300" : "text-indigo-700")}>
                            {anexo.nombres || anexo.personalData?.nombres || 'Sin nombre'} {anexo.apellidoPaterno || anexo.personalData?.apellidoPaterno || ''} {anexo.apellidoMaterno || anexo.personalData?.apellidoMaterno || ''}
                          </p>
                          <p className={cn("text-xs", darkMode ? "text-neutral-400" : "text-gray-600")}>
                            DNI: {anexo.dni || anexo.personalData?.dni || 'N/A'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Resumen de secciones completadas */}
                      <div className="mt-4 pt-4 border-t border-indigo-500/20">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-4">
                          <div className={cn("flex items-center gap-2", darkMode ? "text-neutral-300" : "text-gray-700")}>
                            <IconSchool className="w-4 h-4" />
                            <span>Formación: {Array.isArray(anexo.formacionAcademica) ? anexo.formacionAcademica.length : 0}</span>
                          </div>
                          <div className={cn("flex items-center gap-2", darkMode ? "text-neutral-300" : "text-gray-700")}>
                            <IconLanguage className="w-4 h-4" />
                            <span>Idiomas: {Array.isArray(anexo.idiomas) ? anexo.idiomas.length : 0}</span>
                          </div>
                          <div className={cn("flex items-center gap-2", darkMode ? "text-neutral-300" : "text-gray-700")}>
                            <IconBriefcase className="w-4 h-4" />
                            <span>Experiencia: {Array.isArray(anexo.experienciaLaboral) ? anexo.experienciaLaboral.length : 0}</span>
                          </div>
                          <div className={cn("flex items-center gap-2", darkMode ? "text-neutral-300" : "text-gray-700")}>
                            <IconUser className="w-4 h-4" />
                            <span>Referencias: {Array.isArray(anexo.referenciasLaborales) ? anexo.referenciasLaborales.length : 0}</span>
                          </div>
                        </div>
                        
                        {/* Botón Actualizar */}
                        <button
                          onClick={() => loadAnexoForEdit(anexo)}
                          className={cn("w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all", darkMode
                            ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white")}
                        >
                          <IconEdit className="w-4 h-4" />
                          Actualizar
                        </button>
                      </div>
                    </motion.div>
                    ))
                  ) : (
                    <div className={cn("text-center py-8", darkMode ? "text-neutral-400" : "text-gray-600")}>
                      <p>No hay anexos completados aún.</p>
                      <p className="text-sm mt-2">Completa y guarda un anexo para verlo aquí.</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </motion.div>
        )}
        
        {/* Título principal - Oculto en la sección de declaraciones juradas */}
        {!(showOnlyCurrentSection && currentSectionIndex === 7) && (
        <div className="mb-6">
          <h2 className={cn("text-2xl font-bold", darkMode ? "text-white" : "text-gray-800")}>
            Ficha - Anexos 05
          </h2>
        </div>
        )}

        {/* --- FICHA DE DATOS PERSONALES --- */}
        {/* Solo mostrar esta sección si hay una convocatoria seleccionada */}
        {convocatoriaSeleccionada && (
        <FormSection
            title="Ficha de Datos Personales"
            icon={<IconFileText className="w-6 h-6" />}
            subtitle="Información de la postulación"
            darkMode={darkMode}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Área" name="area" value={convocatoriaSeleccionada?.area || ''} onChange={() => {}} readOnly disabled required={false} darkMode={darkMode} />
                <InputField label="Número de CAS" name="numeroCas" value={anexosFormData.personalData.numeroCas} onChange={(e) => handleFieldChange('personalData', e.target.name, e.target.value)} readOnly disabled required={false} darkMode={darkMode} />
                <InputField label="Nombre del Puesto" name="nombrePuesto" value={anexosFormData.personalData.nombrePuesto} onChange={(e) => handleFieldChange('personalData', e.target.name, e.target.value)} readOnly disabled required={false} darkMode={darkMode} />
            </div>
        </FormSection>
        )}
        
        {/* --- DATOS PERSONALES --- */}
        {shouldShowSection('datos-personales') && (
        <FormSection 
            title="Datos Personales" 
            icon={<IconUser className="w-6 h-6" />}
            subtitle="Información básica del postulante"
            darkMode={darkMode}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Removed previous fields, will replace with comprehensive ones */}
                <SelectField label="Tipo de Documento" name="tipoDocumento" value={anexosFormData.personalData.tipoDocumento} onChange={(e) => handleFieldChange('personalData', e.target.name, e.target.value)} darkMode={darkMode}>
                    <option value="DNI">DNI</option>
                    <option value="CARNET DE EXTRANJERÍA">CARNET DE EXTRANJERÍA</option>
                </SelectField>
                {anexosFormData.personalData.tipoDocumento === 'DNI' ? (
                    <InputField label="N° DNI" name="dni" value={anexosFormData.personalData.dni} onChange={(e) => handleFieldChange('personalData', e.target.name, e.target.value)} icon={<IconInfoCircle className="w-4 h-4" />} darkMode={darkMode} />
                ) : (
                    <InputField label="N° Carnet de Extranjería" name="carnetExtranjeria" value={anexosFormData.personalData.carnetExtranjeria} onChange={(e) => handleFieldChange('personalData', e.target.name, e.target.value)} icon={<IconInfoCircle className="w-4 h-4" />} darkMode={darkMode} />
                )}
                <InputField label="Apellido Paterno" name="apellidoPaterno" value={anexosFormData.personalData.apellidoPaterno} onChange={(e) => handleFieldChange('personalData', e.target.name, e.target.value)} icon={<IconUser className="w-4 h-4" />} darkMode={darkMode} />
                <InputField label="Apellido Materno" name="apellidoMaterno" value={anexosFormData.personalData.apellidoMaterno} onChange={(e) => handleFieldChange('personalData', e.target.name, e.target.value)} icon={<IconUser className="w-4 h-4" />} darkMode={darkMode} />
                <InputField label="Nombres" name="nombres" value={anexosFormData.personalData.nombres} onChange={(e) => handleFieldChange('personalData', e.target.name, e.target.value)} icon={<IconUser className="w-4 h-4" />} darkMode={darkMode} />
                <SelectField label="Género" name="genero" value={anexosFormData.personalData.genero} onChange={(e) => handleFieldChange('personalData', e.target.name, e.target.value)} darkMode={darkMode}>
                    <option value="M">MASCULINO</option>
                    <option value="F">FEMENINO</option>
                </SelectField>

                <InputField 
                    label="Fecha de Nacimiento" 
                    type="date" 
                    name="fechaNacimiento" 
                    value={anexosFormData.personalData.fechaNacimiento} 
                    onChange={(e) => handleFieldChange('personalData', e.target.name, e.target.value)} 
                    darkMode={darkMode}
                    hasError={validationErrors['Fecha de Nacimiento'] || false}
                />
                
                {/* Lugar de Nacimiento - Selectores dependientes */}
                <SelectField 
                    label="Departamento (Lugar de Nacimiento)" 
                    name="lugarNacimientoDepartamentoId" 
                    value={anexosFormData.personalData.lugarNacimientoDepartamentoId} 
                    onChange={(e) => handleLugarNacimientoDepartamentoChange(e.target.value)} 
                    icon={<IconMapPin className="w-4 h-4" />}
                    darkMode={darkMode}
                    hasError={validationErrors['Departamento (Lugar de Nacimiento)'] || false}
                >
                    <option value="">Seleccionar Departamento</option>
                    {lugarNacimientoDepartamentos.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                </SelectField>
                <SelectField 
                    label="Provincia (Lugar de Nacimiento)" 
                    name="lugarNacimientoProvinciaId" 
                    value={anexosFormData.personalData.lugarNacimientoProvinciaId} 
                    onChange={(e) => handleLugarNacimientoProvinciaChange(e.target.value)} 
                    icon={<IconMapPin className="w-4 h-4" />}
                    darkMode={darkMode}
                    required={!!anexosFormData.personalData.lugarNacimientoDepartamentoId}
                    hasError={validationErrors['Provincia (Lugar de Nacimiento)'] || false}
                >
                    <option value="">Seleccionar Provincia</option>
                    {lugarNacimientoProvincias.map(prov => (
                        <option key={prov.id} value={prov.id}>{prov.name}</option>
                    ))}
                </SelectField>
                <SelectField 
                    label="Distrito (Lugar de Nacimiento)" 
                    name="lugarNacimientoDistritoId" 
                    value={anexosFormData.personalData.lugarNacimientoDistritoId} 
                    onChange={(e) => handleLugarNacimientoDistritoChange(e.target.value)} 
                    icon={<IconMapPin className="w-4 h-4" />}
                    darkMode={darkMode}
                    required={!!anexosFormData.personalData.lugarNacimientoProvinciaId}
                    hasError={validationErrors['Distrito (Lugar de Nacimiento)'] || false}
                >
                    <option value="">Seleccionar Distrito</option>
                    {lugarNacimientoDistritos.map(dist => (
                        <option key={dist.id} value={dist.id}>{dist.name}</option>
                    ))}
                </SelectField>
                
                <InputField 
                    label="Dirección Completa" 
                    name="direccion" 
                    value={anexosFormData.personalData.direccion} 
                    onChange={(e) => handleFieldChange('personalData', e.target.name, e.target.value)} 
                    colSpan="lg:col-span-3" 
                    icon={<IconHome className="w-4 h-4" />} 
                    darkMode={darkMode}
                    hasError={validationErrors['Dirección Completa'] || false}
                />
                <InputField label="Referencia de Dirección (opcional)" name="referenciaDireccion" value={anexosFormData.personalData.referenciaDireccion} onChange={(e) => handleFieldChange('personalData', e.target.name, e.target.value)} colSpan="lg:col-span-3" required={false} darkMode={darkMode} />

                <InputField label="Correo Electrónico" name="correoElectronico" value={anexosFormData.personalData.correoElectronico} onChange={(e) => handleFieldChange('personalData', e.target.name, e.target.value)} colSpan="lg:col-span-2" icon={<IconMail className="w-4 h-4" />} type="email" darkMode={darkMode} />
                <InputField label="Teléfono Domicilio (opcional)" name="telefonoDomicilio" value={anexosFormData.personalData.telefonoDomicilio} onChange={(e) => handleFieldChange('personalData', e.target.name, e.target.value)} icon={<IconPhone className="w-4 h-4" />} required={false} darkMode={darkMode} />
                <InputField label="Teléfono Celular 1" name="telefonoCelular1" value={anexosFormData.personalData.telefonoCelular1} onChange={(e) => handleFieldChange('personalData', e.target.name, e.target.value)} darkMode={darkMode} />
                <InputField label="Teléfono Celular 2 (opcional)" name="telefonoCelular2" value={anexosFormData.personalData.telefonoCelular2} onChange={(e) => handleFieldChange('personalData', e.target.name, e.target.value)} required={false} darkMode={darkMode} />
                <InputField label="Correo Electrónico Alterno (opcional)" name="correoElectronicoAlterno" value={anexosFormData.personalData.correoElectronicoAlterno} onChange={(e) => handleFieldChange('personalData', e.target.name, e.target.value)} colSpan="lg:col-span-2" type="email" required={false} darkMode={darkMode} />

                {/* CONADIS */}           
                <div className={cn("col-span-full border-t border-b pt-6 pb-4 mt-6", darkMode ? "border-neutral-700/50" : "border-blue-200")}>
                    <p className={cn("text-lg font-semibold mb-4", darkMode ? "text-neutral-200" : "text-blue-900")}>CONADIS</p>
                    <div className="flex items-center gap-6 mb-3">
                        <label className={cn("flex items-center gap-2 text-sm cursor-pointer transition-colors", darkMode ? "text-neutral-300 hover:text-white" : "text-blue-700 hover:text-blue-900")}>
                            <input type="radio" name="conadis" value="SI" checked={anexosFormData.personalData.conadis === 'SI'} onChange={(e) => handleFieldChange('personalData', e.target.name, e.target.value)} className={cn("w-4 h-4", darkMode ? "" : "border-blue-300")} /> 
                            Sí
                        </label>
                        <label className={cn("flex items-center gap-2 text-sm cursor-pointer transition-colors", darkMode ? "text-neutral-300 hover:text-white" : "text-blue-700 hover:text-blue-900")}>
                            <input type="radio" name="conadis" value="NO" checked={anexosFormData.personalData.conadis === 'NO'} onChange={(e) => handleFieldChange('personalData', e.target.name, e.target.value)} className={cn("w-4 h-4", darkMode ? "" : "border-blue-300")} /> 
                            No
                        </label>
                    </div>
                    <AnimatePresence>
                        {anexosFormData.personalData.conadis === 'SI' && (
                            <motion.div
                                initial={{opacity: 0, height: 0}}
                                animate={{opacity: 1, height: 'auto'}}
                                exit={{opacity: 0, height: 0}}
                                className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6"
                            >
                                <InputField label="N° Carnet CONADIS" name="nCarnetConadis" value={anexosFormData.personalData.nCarnetConadis} onChange={(e) => handleFieldChange('personalData', e.target.name, e.target.value)} darkMode={darkMode} />
                                <InputField label="Código CONADIS" name="codigoConadis" value={anexosFormData.personalData.codigoConadis} onChange={(e) => handleFieldChange('personalData', e.target.name, e.target.value)} darkMode={darkMode} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* FUERZAS ARMADAS */}
                <div className={cn("col-span-full border-t border-b pt-6 pb-4 mt-6", darkMode ? "border-neutral-700/50" : "border-blue-200")}>
                    <p className={cn("text-lg font-semibold mb-4", darkMode ? "text-neutral-200" : "text-blue-900")}>Fuerzas Armadas</p>
                    <div className="flex items-center gap-6 mb-3">
                        <label className={cn("flex items-center gap-2 text-sm cursor-pointer transition-colors", darkMode ? "text-neutral-300 hover:text-white" : "text-blue-700 hover:text-blue-900")}>
                            <input type="radio" name="fuerzasArmadas" value="SI" checked={anexosFormData.personalData.fuerzasArmadas === 'SI'} onChange={(e) => handleFieldChange('personalData', e.target.name, e.target.value)} className={cn("w-4 h-4", darkMode ? "" : "border-blue-300")} /> 
                            Sí
                        </label>
                        <label className={cn("flex items-center gap-2 text-sm cursor-pointer transition-colors", darkMode ? "text-neutral-300 hover:text-white" : "text-blue-700 hover:text-blue-900")}>
                            <input type="radio" name="fuerzasArmadas" value="NO" checked={anexosFormData.personalData.fuerzasArmadas === 'NO'} onChange={(e) => handleFieldChange('personalData', e.target.name, e.target.value)} className={cn("w-4 h-4", darkMode ? "" : "border-blue-300")} /> 
                            No
                        </label>
                    </div>
                    <AnimatePresence>
                        {anexosFormData.personalData.fuerzasArmadas === 'SI' && (
                            <motion.div
                                initial={{opacity: 0, height: 0}}
                                animate={{opacity: 1, height: 'auto'}}
                                exit={{opacity: 0, height: 0}}
                                className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6"
                            >
                                <InputField label="N° Carnet FFAA" name="nCarnetFuerzasArmadas" value={anexosFormData.personalData.nCarnetFuerzasArmadas} onChange={(e) => handleFieldChange('personalData', e.target.name, e.target.value)} darkMode={darkMode} />
                                <InputField label="Código FFAA" name="codigoFuerzasArmadas" value={anexosFormData.personalData.codigoFuerzasArmadas} onChange={(e) => handleFieldChange('personalData', e.target.name, e.target.value)} darkMode={darkMode} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <InputField label="Especificar si requiere algún tipo de asistencia" name="asistenciaEspecial" value={anexosFormData.personalData.asistenciaEspecial} onChange={(e) => handleFieldChange('personalData', e.target.name, e.target.value)} colSpan="lg:col-span-3" required={false} darkMode={darkMode} />
                <InputField label="Tiempo de Experiencia en el Sector Público" name="tiempoSectorPublico" value={anexosFormData.personalData.tiempoSectorPublico} onChange={(e) => handleFieldChange('personalData', e.target.name, e.target.value)} darkMode={darkMode} hasError={validationErrors['Tiempo de Experiencia en el Sector Público'] || false} />
                <InputField label="Tiempo de Experiencia en el Sector Privado" name="tiempoSectorPrivado" value={anexosFormData.personalData.tiempoSectorPrivado} onChange={(e) => handleFieldChange('personalData', e.target.name, e.target.value)} darkMode={darkMode} hasError={validationErrors['Tiempo de Experiencia en el Sector Privado'] || false} />
            </div>
        </FormSection>
        )}

        {/* --- COLEGIO PROFESIONAL --- */}
        {shouldShowSection('colegio-profesional') && (
        <FormSection
            title="Colegio Profesional"
            icon={<IconCertificate className="w-6 h-6" />}
            subtitle="Información sobre su colegiatura profesional"
            darkMode={darkMode}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                <RadioField 
                    label="¿Habilitado a la fecha?" 
                    name="colegioProfesionalHabilitado" 
                    value={anexosFormData.personalData.colegioProfesionalHabilitado} 
                    options={[{label: 'Sí', value: 'SI'}, {label: 'No', value: 'NO'}]}
                    onChange={(e) => handleFieldChange('personalData', e.target.name, e.target.value)}
                    colSpan="lg:col-span-1"
                    required={false}
                    darkMode={darkMode}
                />
                <AnimatePresence>
                    {anexosFormData.personalData.colegioProfesionalHabilitado === 'SI' && (
                        <motion.div
                            initial={{opacity: 0, height: 0}}
                            animate={{opacity: 1, height: 'auto'}}
                            exit={{opacity: 0, height: 0}}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 col-span-full mt-4"
                        >
                            <InputField label="Nombre del Colegio Profesional" name="colegioProfesional" value={anexosFormData.personalData.colegioProfesional} onChange={(e) => handleFieldChange('personalData', e.target.name, e.target.value)} colSpan="lg:col-span-2" darkMode={darkMode} />
                            <InputField label="N° de Colegiatura" name="nColegiatura" value={anexosFormData.personalData.nColegiatura} onChange={(e) => handleFieldChange('personalData', e.target.name, e.target.value)} darkMode={darkMode} />
                            <InputField label="Fecha de Vencimiento de Colegiatura" type="date" name="fechaVencimientoColegiatura" value={anexosFormData.personalData.fechaVencimientoColegiatura} onChange={(e) => handleFieldChange('personalData', e.target.name, e.target.value)} darkMode={darkMode} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </FormSection>
        )}

        {/* --- FORMACIÓN ACADÉMICA --- */}
        {shouldShowSection('formacion-academica') && (
        <FormSection 
            title="Formación Académica" 
            icon={<IconSchool className="w-6 h-6" />}
            subtitle="Grados y títulos profesionales"
            darkMode={darkMode}
            required={true}
        >
            <div className="space-y-4">
                {anexosFormData.academicFormation.map((item, index) => (
                    <motion.div 
                        key={index} 
                        layout 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={cn("grid grid-cols-1 lg:grid-cols-12 gap-4 items-end p-5 rounded-2xl transition-all", darkMode ? "border border-indigo-500/20 bg-neutral-900/30 hover:border-indigo-500/40" : "border border-blue-200 bg-white/50 hover:border-blue-300")}
                    >
                        <SelectField label="Nivel Educativo" name="nivelEducativo" value={item.nivelEducativo} onChange={(e) => handleListFieldChange('academicFormation', index, e.target.name, e.target.value)} colSpan="lg:col-span-3" darkMode={darkMode}>
                            <option value="">Seleccionar Nivel</option>
                            <option value="PRIMARIA">PRIMARIA</option>
                            <option value="SECUNDARIA">SECUNDARIA</option>
                            <option value="TÉCNICA SUPERIOR">TÉCNICA SUPERIOR</option>
                            <option value="UNIVERSITARIO">UNIVERSITARIO</option>
                            <option value="MAESTRÍA">MAESTRÍA</option>
                            <option value="DOCTORADO">DOCTORADO</option>
                            <option value="FORMACIÓN BÁSICA">FORMACIÓN BÁSICA</option>
                            <option value="OTROS (ESPECIFICAR)">OTROS (ESPECIFICAR)</option>
                        </SelectField>
                        {/* Campo condicional para especificar cuando se selecciona "OTROS (ESPECIFICAR)" */}
                        <AnimatePresence>
                            {item.nivelEducativo === 'OTROS (ESPECIFICAR)' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="lg:col-span-3"
                                >
                                    <InputField 
                                        label="Especifique el nivel educativo" 
                                        name="otrosNivelEspecificar" 
                                        value={item.otrosNivelEspecificar || ''} 
                                        onChange={(e) => handleListFieldChange('academicFormation', index, e.target.name, e.target.value)} 
                                        darkMode={darkMode}
                                        required={true}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <InputField label="Grado Académico" name="gradoAcademico" value={item.gradoAcademico} onChange={(e) => handleListFieldChange('academicFormation', index, e.target.name, e.target.value)} colSpan="lg:col-span-3" darkMode={darkMode} />
                        <InputField label="Nombre de la Carrera / Maestría / Doctorado" name="nombreCarrera" value={item.nombreCarrera} onChange={(e) => handleListFieldChange('academicFormation', index, e.target.name, e.target.value)} colSpan="lg:col-span-3" darkMode={darkMode} />
                        <InputField label="Institución" name="institucion" value={item.institucion} onChange={(e) => handleListFieldChange('academicFormation', index, e.target.name, e.target.value)} colSpan="lg:col-span-3" darkMode={darkMode} />
                        <InputField label="Año Desde" name="anoDesde" value={item.anoDesde} onChange={(e) => handleListFieldChange('academicFormation', index, e.target.name, e.target.value)} colSpan="lg:col-span-2" darkMode={darkMode} />
                        <InputField label="Año Hasta" name="anoHasta" value={item.anoHasta} onChange={(e) => handleListFieldChange('academicFormation', index, e.target.name, e.target.value)} colSpan="lg:col-span-2" darkMode={darkMode} />
                        <motion.button 
                            type="button" 
                            onClick={() => handleRemoveItem('academicFormation', index)} 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-all h-[52px] border border-red-500/30" // Keep button same size
                        >
                            <IconTrash size={20} />
                        </motion.button>
                    </motion.div>
                ))}
                <motion.button 
                    type="button" 
                    onClick={() => handleAddItem('academicFormation', { nivelEducativo: '', gradoAcademico: '', nombreCarrera: '', institucion: '', anoDesde: '', anoHasta: '', otrosNivelEspecificar: '' })} 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={anexosFormData.academicFormation.length >= 20}
                    className={cn(
                      "flex items-center gap-2 text-sm mt-4 px-4 py-2 rounded-xl border transition-all",
                      anexosFormData.academicFormation.length >= 20
                        ? "text-gray-400 border-gray-300 bg-gray-100 cursor-not-allowed"
                        : "text-indigo-400 hover:text-indigo-300 border-indigo-500/30 hover:border-indigo-500/50 bg-indigo-500/10 hover:bg-indigo-500/20"
                    )}
                >
                    <IconPlus size={18} /> 
                    {anexosFormData.academicFormation.length >= 20 
                      ? `Límite alcanzado (${anexosFormData.academicFormation.length}/20)` 
                      : `Añadir Formación Académica (${anexosFormData.academicFormation.length}/20)`}
                </motion.button>
            </div>
        </FormSection>
        )}
        
        {/* --- IDIOMAS Y/O DIALECTO --- */}
        {shouldShowSection('idiomas') && (
        <FormSection 
            title="Idiomas y/o Dialecto" 
            icon={<IconLanguage className="w-6 h-6" />}
            subtitle="Especifique los idiomas o dialectos que domina"
            darkMode={darkMode}
            required={true}
        >
            <div className="space-y-4">
                {anexosFormData.languageSkills.map((item, index) => (
                    <motion.div 
                        key={index} 
                        layout 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={cn("grid grid-cols-1 lg:grid-cols-4 gap-4 items-end p-5 border rounded-2xl transition-all", darkMode ? "border-purple-500/20 bg-neutral-900/30 hover:border-purple-500/40" : "border-purple-300 bg-white/80 hover:border-purple-400")}
                    >
                        <InputField label="Idioma / Dialecto" name="idiomaDialecto" value={item.idiomaDialecto} onChange={(e) => handleListFieldChange('languageSkills', index, e.target.name, e.target.value)} colSpan="lg:col-span-2" darkMode={darkMode} />
                        <SelectField label="Nivel" name="nivel" value={item.nivel} onChange={(e) => handleListFieldChange('languageSkills', index, e.target.name, e.target.value)} darkMode={darkMode}>
                            <option value="">Seleccionar Nivel</option>
                            <option value="Básico">Básico</option>
                            <option value="Intermedio">Intermedio</option>
                            <option value="Avanzado">Avanzado</option>
                        </SelectField>
                        <motion.button 
                            type="button" 
                            onClick={() => handleRemoveItem('languageSkills', index)} 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-all h-[52px] border border-red-500/30"
                        >
                            <IconTrash size={20} />
                        </motion.button>
                    </motion.div>
                ))}
                <motion.button 
                    type="button" 
                    onClick={() => handleAddItem('languageSkills', { idiomaDialecto: '', nivel: '' })} 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={anexosFormData.languageSkills.length >= 20}
                    className={cn(
                      "flex items-center gap-2 text-sm mt-4 px-4 py-2 rounded-xl border transition-all",
                      anexosFormData.languageSkills.length >= 20
                        ? "text-gray-400 border-gray-300 bg-gray-100 cursor-not-allowed"
                        : "text-purple-400 hover:text-purple-300 border-purple-500/30 hover:border-purple-500/50 bg-purple-500/10 hover:bg-purple-500/20"
                    )}
                >
                    <IconPlus size={18} /> 
                    {anexosFormData.languageSkills.length >= 20 
                      ? `Límite alcanzado (${anexosFormData.languageSkills.length}/20)` 
                      : `Añadir Idioma / Dialecto (${anexosFormData.languageSkills.length}/20)`}
                </motion.button>
            </div>
        </FormSection>
        )}
        
        {/* --- OFIMÁTICA --- */}
        {shouldShowSection('ofimatica') && (
        <FormSection 
            title="Conocimientos de Ofimática"
            icon={<IconDeviceFloppy className="w-6 h-6" />}
            subtitle="Especifique sus conocimientos en herramientas de ofimática"
            darkMode={darkMode}
            required={true}
        >
            <div className="space-y-4">
                {anexosFormData.officeSkills.map((item, index) => (
                    <motion.div 
                        key={index} 
                        layout 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={cn("grid grid-cols-1 lg:grid-cols-4 gap-4 items-end p-5 border rounded-2xl transition-all", darkMode ? "border-teal-500/20 bg-neutral-900/30 hover:border-teal-500/40" : "border-teal-300 bg-white/80 hover:border-teal-400")}
                    >
                        <InputField label="Materia (Ej: PROCESADOR DE TEXTO, HOJAS DE CALCULO)" name="materia" value={item.materia} onChange={(e) => handleListFieldChange('officeSkills', index, e.target.name, e.target.value)} colSpan="lg:col-span-2" darkMode={darkMode} />
                        <SelectField label="Nivel" name="nivel" value={item.nivel} onChange={(e) => handleListFieldChange('officeSkills', index, e.target.name, e.target.value)} darkMode={darkMode}>
                            <option value="">Seleccionar Nivel</option>
                            <option value="Básico">Básico</option>
                            <option value="Intermedio">Intermedio</option>
                            <option value="Avanzado">Avanzado</option>
                        </SelectField>
                        <motion.button 
                            type="button" 
                            onClick={() => handleRemoveItem('officeSkills', index)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-all h-[52px] border border-red-500/30"
                        >
                            <IconTrash size={20} />
                        </motion.button>
                    </motion.div>
                ))}
                <motion.button 
                    type="button" 
                    onClick={() => handleAddItem('officeSkills', { materia: '', nivel: '' })}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={anexosFormData.officeSkills.length >= 20}
                    className={cn(
                      "flex items-center gap-2 text-sm mt-4 px-4 py-2 rounded-xl border transition-all",
                      anexosFormData.officeSkills.length >= 20
                        ? "text-gray-400 border-gray-300 bg-gray-100 cursor-not-allowed"
                        : "text-teal-400 hover:text-teal-300 border-teal-500/30 hover:border-teal-500/50 bg-teal-500/10 hover:bg-teal-500/20"
                    )}
                >
                    <IconPlus size={18} /> 
                    {anexosFormData.officeSkills.length >= 20 
                      ? `Límite alcanzado (${anexosFormData.officeSkills.length}/20)` 
                      : `Añadir Conocimiento de Ofimática (${anexosFormData.officeSkills.length}/20)`}
                </motion.button>
            </div>
        </FormSection>
        )}

        {/* --- ESTUDIOS DE ESPECIALIZACIÓN --- */}
        {shouldShowSection('especializacion') && (
        <FormSection 
            title="Estudios de Especialización"
            icon={<IconCertificate className="w-6 h-6" />}
            subtitle="Diplomas, cursos y programas de especialización"
            darkMode={darkMode}
            required={true}
        >
            <div className="space-y-4">
                {anexosFormData.specializationStudies.map((item, index) => (
                    <motion.div 
                        key={index} 
                        layout 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={cn("grid grid-cols-1 lg:grid-cols-7 gap-4 items-end p-5 border rounded-2xl transition-all", darkMode ? "border-orange-500/20 bg-neutral-900/30 hover:border-orange-500/40" : "border-orange-300 bg-white/80 hover:border-orange-400")}
                    >
                        <SelectField label="Tipo de Estudio" name="tipoEstudio" value={item.tipoEstudio} onChange={(e) => handleListFieldChange('specializationStudies', index, e.target.name, e.target.value)} colSpan="lg:col-span-1" darkMode={darkMode}>
                            <option value="">Seleccionar Tipo</option>
                            <option value="CURSO">CURSO</option>
                            <option value="DIPLOMA">DIPLOMA</option>
                            <option value="PROGRAMA DE ESPECIALIZACIÓN">PROGRAMA DE ESPECIALIZACIÓN</option>
                        </SelectField>
                        <InputField label="NOMBRE DEL (CURSO, DIPLOMA, PROGRAMA DE ESPECIALIZACIÓN)" name="nombreEstudio" value={item.nombreEstudio} onChange={(e) => handleListFieldChange('specializationStudies', index, e.target.name, e.target.value)} colSpan="lg:col-span-2" darkMode={darkMode} />
                        <InputField label="Periodo Inicio (AAAA)" name="periodoInicio" value={item.periodoInicio} onChange={(e) => handleListFieldChange('specializationStudies', index, e.target.name, e.target.value)} colSpan="lg:col-span-1" darkMode={darkMode} />
                        <InputField label="Periodo Fin (AAAA)" name="periodoFin" value={item.periodoFin} onChange={(e) => handleListFieldChange('specializationStudies', index, e.target.name, e.target.value)} colSpan="lg:col-span-1" darkMode={darkMode} />
                        <InputField label="Horas" name="horas" value={item.horas} onChange={(e) => handleListFieldChange('specializationStudies', index, e.target.name, e.target.value)} colSpan="lg:col-span-1" darkMode={darkMode} />
                        <InputField label="Centro de Estudio" name="centroEstudio" value={item.centroEstudio} onChange={(e) => handleListFieldChange('specializationStudies', index, e.target.name, e.target.value)} colSpan="lg:col-span-1" darkMode={darkMode} />
                        <motion.button 
                            type="button" 
                            onClick={() => handleRemoveItem('specializationStudies', index)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-all h-[52px] border border-red-500/30"
                        >
                            <IconTrash size={20} />
                        </motion.button>
                    </motion.div>
                ))}
                <motion.button 
                    type="button" 
                    onClick={() => handleAddItem('specializationStudies', { tipoEstudio: '', nombreEstudio: '', periodoInicio: '', periodoFin: '', horas: '', centroEstudio: '' })} 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={anexosFormData.specializationStudies.length >= 20}
                    className={cn(
                      "flex items-center gap-2 text-sm mt-4 px-4 py-2 rounded-xl border transition-all",
                      anexosFormData.specializationStudies.length >= 20
                        ? "text-gray-400 border-gray-300 bg-gray-100 cursor-not-allowed"
                        : "text-orange-400 hover:text-orange-300 border-orange-500/30 hover:border-orange-500/50 bg-orange-500/10 hover:bg-orange-500/20"
                    )}
                >
                    <IconPlus size={18} /> 
                    {anexosFormData.specializationStudies.length >= 20 
                      ? `Límite alcanzado (${anexosFormData.specializationStudies.length}/20)` 
                      : `Añadir Estudio de Especialización (${anexosFormData.specializationStudies.length}/20)`}
                </motion.button>
            </div>
        </FormSection>
        )}

        {/* --- EXPERIENCIA LABORAL --- */}
        {shouldShowSection('experiencia') && (
        <FormSection 
            title="Experiencia Laboral" 
            icon={<IconBriefcase className="w-6 h-6" />}
            subtitle="Detalle su historial laboral desde el último trabajo"
            darkMode={darkMode}
            required={true}
        >
            <div className="space-y-4">
                {anexosFormData.workExperience.map((item, index) => (
                <motion.div 
                        key={index} 
                        layout 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={cn("grid grid-cols-1 lg:grid-cols-12 gap-4 items-end p-5 border rounded-2xl transition-all", darkMode ? "border-amber-500/20 bg-neutral-900/30 hover:border-amber-500/40" : "border-amber-300 bg-white/80 hover:border-amber-400")}
                    >
                        <InputField label="Empresa / Institución" name="empresaInstitucion" value={item.empresaInstitucion} onChange={(e) => handleListFieldChange('workExperience', index, e.target.name, e.target.value)} colSpan="lg:col-span-3" darkMode={darkMode} />
                        <InputField label="Sector / Giro del Negocio" name="sectorGiroNegocio" value={item.sectorGiroNegocio} onChange={(e) => handleListFieldChange('workExperience', index, e.target.name, e.target.value)} colSpan="lg:col-span-3" darkMode={darkMode} />
                        <InputField label="Puesto / Cargo" name="puestoCargo" value={item.puestoCargo} onChange={(e) => handleListFieldChange('workExperience', index, e.target.name, e.target.value)} colSpan="lg:col-span-2" darkMode={darkMode} />
                        <InputField label="Periodo Desde (MM/AAAA)" type="text" name="periodoDesde" value={item.periodoDesde} onChange={(e) => handleListFieldChange('workExperience', index, e.target.name, e.target.value)} colSpan="lg:col-span-2" darkMode={darkMode} />
                        <InputField label="Periodo Hasta (MM/AAAA)" type="text" name="periodoHasta" value={item.periodoHasta} onChange={(e) => handleListFieldChange('workExperience', index, e.target.name, e.target.value)} colSpan="lg:col-span-2" darkMode={darkMode} />
                        
                        {/* Funciones Principales */}
                        <div className="col-span-full space-y-2 mt-4">
                            <label className={cn("block text-sm font-medium", darkMode ? "text-neutral-300" : "text-gray-700")}>Funciones Principales (máximo 5):</label>
                            {[1, 2, 3, 4, 5].map((num) => (
                                <InputField 
                                    key={num} 
                                    label={`Función Principal ${num}`}
                                    name={`funcionPrincipal${num}`}
                                    value={item[`funcionPrincipal${num}` as keyof WorkExperienceItem] || ''}
                                    onChange={(e) => handleListFieldChange('workExperience', index, e.target.name, e.target.value)}
                                    colSpan="w-full"
                                    darkMode={darkMode}
                                />
                            ))}
                    </div>

                        <motion.button 
                            type="button" 
                            onClick={() => handleRemoveItem('workExperience', index)} 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-all h-[52px] border border-red-500/30 lg:col-start-12 lg:row-start-1 lg:self-start"
                        >
                            <IconTrash size={20} />
                        </motion.button>
                            </motion.div>
                ))}
                <motion.button 
                    type="button" 
                    onClick={() => handleAddItem('workExperience', { empresaInstitucion: '', sectorGiroNegocio: '', puestoCargo: '', periodoDesde: '', periodoHasta: '', funcionPrincipal1: '', funcionPrincipal2: '', funcionPrincipal3: '', funcionPrincipal4: '', funcionPrincipal5: '' })} 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={anexosFormData.workExperience.length >= 20}
                    className={cn(
                      "flex items-center gap-2 text-sm mt-4 px-4 py-2 rounded-xl border transition-all",
                      anexosFormData.workExperience.length >= 20
                        ? "text-gray-400 border-gray-300 bg-gray-100 cursor-not-allowed"
                        : "text-amber-400 hover:text-amber-300 border-amber-500/30 hover:border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20"
                    )}
                >
                    <IconPlus size={18} /> 
                    {anexosFormData.workExperience.length >= 20 
                      ? `Límite alcanzado (${anexosFormData.workExperience.length}/20)` 
                      : `Añadir Experiencia Laboral (${anexosFormData.workExperience.length}/20)`}
                </motion.button>
            </div>
        </FormSection>
        )}

        {/* --- DECLARO QUE LA INFORMACIÓN PROPORCIONADA... --- */}
        {shouldShowSection('declaraciones') && (
        <FormSection
            title="Declaración Jurada"
            icon={<IconCheck className="w-6 h-6" />}
            subtitle="Veracidad de la información proporcionada y consentimiento"
            darkMode={darkMode}
        >
            <div className="space-y-6 w-full max-w-full">
                <CheckboxField
                    label="Declaro bajo juramento que los datos consignados en este formulario expresan la verdad."
                    name="datosConsignadosVerdaderos"
                    checked={anexosFormData.declarations.datosConsignadosVerdaderos}
                    onChange={(e) => handleFieldChange('declarations', e.target.name, e.target.checked)}
                    darkMode={darkMode}
                />
                <CheckboxField
                    label="De conformidad con lo establecido en la Ley N° 29733 - Ley de Protección de Datos Personales - y su Reglamento, UGEL TALARA queda informado y da su consentimiento libre, previo, expreso, inequívoco e informado, para el tratamiento de sus datos; esto es, para la recopilación, registro, almacenamiento, conservación, utilización, transferencia nacional e internacional o cualquier otra forma de procesamiento de los datos personales de los cuales es titular y que han sido consignados en este Formulario."
                    name="leyProteccionDatos"
                    checked={anexosFormData.declarations.leyProteccionDatos}
                    onChange={(e) => handleFieldChange('declarations', e.target.name, e.target.checked)}
                    darkMode={darkMode}
                />
                {/* The previous infoVerdadera checkbox can be removed or repurposed if it's redundant. */}
                {/* Keeping it for now as per previous implementation logic. */}
                <CheckboxField
                    label="Declaro que la información proporcionada respecto a lo requerido por el perfil del puesto es verdadera y podrá ser verificada por la entidad."
                    name="infoVerdadera"
                    checked={anexosFormData.declarations.infoVerdadera}
                    onChange={(e) => handleFieldChange('declarations', e.target.name, e.target.checked)}
                    darkMode={darkMode}
                />

                {/* DECLARACIONES ADICIONALES */}
                <div className={cn("border-t pt-6 mt-6 w-full max-w-full", darkMode ? "border-neutral-700/50" : "border-blue-200")}>
                    {/* Título Formato 02 - Declaraciones Juradas A */}
                    <div className="mb-4">
                      <h2 className={cn("text-2xl font-bold", darkMode ? "text-white" : "text-gray-800")}>
                        Formato 02 - Declaración Jurada A
                      </h2>
                    </div>
                    <p className={cn("text-lg font-semibold mb-4 w-full", darkMode ? "text-neutral-200" : "text-blue-900")}>DECLARACIONES JURADAS ADICIONALES</p>
                    
                    <div className="space-y-4 w-full max-w-full">
                        <CheckboxField
                            label="ESTAR EN EJERCICIO Y EN PLENO GOCE DE MIS DERECHOS CIVILES."
                            name="plenosDerechosCiviles"
                            checked={anexosFormData.declarations.plenosDerechosCiviles}
                            onChange={(e) => handleFieldChange('declarations', e.target.name, e.target.checked)}
                            darkMode={darkMode}
                        />

                        <CheckboxField
                            label="CUMPLIR CON TODOS LOS REQUISITOS MÍNIMOS EXIGIDOS PARA EL PUESTO AL CUAL ESTOY POSTULANDO."
                            name="cumploRequisitosMinimos"
                            checked={anexosFormData.declarations.cumploRequisitosMinimos}
                            onChange={(e) => handleFieldChange('declarations', e.target.name, e.target.checked)}
                            darkMode={darkMode}
                        />

                        <CheckboxField
                            label="NO TENER CONDENA POR DELITO DOLOSO."
                            name="noCondenaDolosa"
                            checked={anexosFormData.declarations.noCondenaDolosa}
                            onChange={(e) => handleFieldChange('declarations', e.target.name, e.target.checked)}
                            darkMode={darkMode}
                        />

                        <CheckboxField
                            label="NO ESTAR INHABILITADO ADMINISTRATIVA O JUDICIALMENTE PARA EL EJERCICIO DE LA PROFESIÓN PARA CONTRATAR CON EL ESTADO O PARA DESEMPEÑAR FUNCIÓN PÚBLICA."
                            name="noInhabilitacion"
                            checked={anexosFormData.declarations.noInhabilitacion}
                            onChange={(e) => handleFieldChange('declarations', e.target.name, e.target.checked)}
                            darkMode={darkMode}
                        />

                        <CheckboxField
                            label="NO CONTAR CON SENTENCIA CONDENATORIA CONSENTIDA Y/O EJECUTORIADA POR ALGUNOS DE LOS DELITOS PREVISTOS EN LOS ARTÍCULOS 296, 296-A PRIMER, SEGUNDO Y CUARTO PÁRRAFO; 296-B, 297, 382, 383, 384, 387, 388, 389, 393, 393-A, 394, 395, 396, 397, 397-A, 398, 399, 400 Y 401 DEL CÓDIGO PENAL, ASÍ COMO EL ARTÍCULO 4-A DEL DECRETO LEY N° 25475 Y LOS DELITOS PREVISTOS EN LOS ARTÍCULOS 1, 2 Y 3 DEL DECRETO LEGISLATIVO N° 1106, O SANCIÓN ADMINISTRATIVA QUE ACARREE INHABILITACIÓN, INSCRITAS EN EL REGISTRO NACIONAL DE SANCIONES CONTRA SERVIDORES CIVILES."
                            name="noSentenciaCondenatoria"
                            checked={anexosFormData.declarations.noSentenciaCondenatoria}
                            onChange={(e) => handleFieldChange('declarations', e.target.name, e.target.checked)}
                            darkMode={darkMode}
                        />

                        <CheckboxField
                            label="CUMPLIR CON TODOS LOS REQUISITOS SEÑALADOS EN EL PERFIL DE LA PRESENTE CONVOCATORIA."
                            name="infoVerdadera"
                            checked={anexosFormData.declarations.infoVerdadera}
                            onChange={(e) => handleFieldChange('declarations', e.target.name, e.target.checked)}
                            darkMode={darkMode}
                        />

                        <p className={cn("text-sm italic mt-4", darkMode ? "text-neutral-400" : "text-blue-700")}>
                            Firmo la presente declaración, de conformidad con lo establecido en el artículo 42 de la Ley N° 27444 - Ley de Procedimiento Administrativo General. Por lo que suscribo la presente en honor a la verdad.
                        </p>
                    </div>
                </div>

                {/* DECLARACIÓN DE ANTECEDENTES PENALES */}
                <div className={cn("border-t pt-6 mt-6 w-full max-w-full", darkMode ? "border-neutral-700/50" : "border-blue-200")}>
                    <p className={cn("text-lg font-semibold mb-4 w-full", darkMode ? "text-neutral-200" : "text-blue-900")}>DECLARACIÓN DE ANTECEDENTES</p>
                    
                    {/* Título Formato 02 - Declaraciones Juradas B */}
                    <div className="mb-4">
                      <h2 className={cn("text-2xl font-bold", darkMode ? "text-white" : "text-gray-800")}>
                        Formato 02 - Declaración Jurada B
                      </h2>
                    </div>
                    
                    <div className="space-y-4 w-full max-w-full">
                        <CheckboxField
                            label={`DECLARO BAJO JURAMENTO, no registrar antecedentes penales, a efecto de postular a una vacante según lo dispuesto por la Ley N° 29607, publicada el 26 de octubre de 2010 en el Diario Oficial "El Peruano". Autorizo a su Entidad a efectuar la comprobación de la veracidad de la presente declaración jurada solicitando tales antecedentes al Registro Nacional de Condenas del Poder Judicial. Asimismo, me comprometo a reemplazar la presente declaración jurada por los certificados originales, según sean requeridos.`}
                            name="noAntecedentesPenales"
                            checked={anexosFormData.declarations.noAntecedentesPenales}
                            onChange={(e) => handleFieldChange('declarations', e.target.name, e.target.checked)}
                            darkMode={darkMode}
                        />

                        <CheckboxField
                            label="DECLARO BAJO JURAMENTO: No registrar antecedentes policiales y No registrar antecedentes judiciales, a nivel nacional. Asimismo, tomo conocimiento que en caso de resultar falsa la información que proporciono, autorizo a la UGEL Talara, a efectuar la comprobación de la veracidad de la presente Declaración Jurada; según lo establecido en el Artículo 411° del Código Penal y Delito contra la Fe Pública - Título XIX del Código Penal, acorde al artículo 32° de la Ley N° 27444, Ley del Procedimiento Administrativo General. Asimismo, me comprometo a reemplazar la presente declaración jurada por los certificados originales, según sean requeridos."
                            name="noAntecedentesPoliciales"
                            checked={anexosFormData.declarations.noAntecedentesPoliciales}
                            onChange={(e) => handleFieldChange('declarations', e.target.name, e.target.checked)}
                            darkMode={darkMode}
                        />

                        <CheckboxField
                            label="Por lo que suscribo la presente en honor a la verdad - No registrar antecedentes judiciales."
                            name="noAntecedentesJudiciales"
                            checked={anexosFormData.declarations.noAntecedentesJudiciales}
                            onChange={(e) => handleFieldChange('declarations', e.target.name, e.target.checked)}
                            darkMode={darkMode}
                        />
                    </div>
                </div>

                {/* DECLARACIÓN DE PARIENTES EN UGEL */}
                <div className={cn("border-t pt-6 mt-6 w-full max-w-full", darkMode ? "border-neutral-700/50" : "border-blue-200")}>
                    {/* Título Formato 02 - Declaración Jurada D */}
                    <div className="mb-4">
                      <h2 className={cn("text-2xl font-bold", darkMode ? "text-white" : "text-gray-800")}>
                        Formato 02 - Declaración Jurada D
                      </h2>
                    </div>
                    <p className={cn("text-lg font-semibold mb-4 w-full", darkMode ? "text-neutral-200" : "text-blue-900")}>DECLARACIÓN DE PARIENTES EN UGEL TALARA</p>
                    
                    <div className="space-y-4 w-full max-w-full">
                        <RadioField 
                            label="DECLARO BAJO JURAMENTO:" 
                            name="tieneParientesUGEL" 
                            value={anexosFormData.declarations.tieneParientesUGEL} 
                            options={[
                                {label: 'NO tengo pariente(s) o cónyuge con facultad directa o indirectamente para contratar en UGEL Talara.', value: 'NO'},
                                {label: 'SI tengo pariente(s) o cónyuge que preste(n) servicios en UGEL Talara, cuyos datos señalo a continuación:', value: 'SI'}
                            ]}
                            onChange={(e) => handleFieldChange('declarations', e.target.name, e.target.value)}
                            colSpan="lg:col-span-full"
                            darkMode={darkMode}
                        />

                        {/* Checkbox para confirmar que NO tiene parientes */}
                        <AnimatePresence>
                            {anexosFormData.declarations.tieneParientesUGEL === 'NO' && (
                                <motion.div
                                    initial={{opacity: 0, height: 0}}
                                    animate={{opacity: 1, height: 'auto'}}
                                    exit={{opacity: 0, height: 0}}
                                    className="mt-4"
                                >
                                    <CheckboxField
                                        label="Confirmo que NO tengo pariente(s) o cónyuge con facultad directa o indirectamente para contratar en UGEL Talara."
                                        name="noParientesUGEL"
                                        checked={anexosFormData.declarations.noParientesUGEL}
                                        onChange={(e) => handleFieldChange('declarations', e.target.name, e.target.checked)}
                                        darkMode={darkMode}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {anexosFormData.declarations.tieneParientesUGEL === 'SI' && (
                                <motion.div
                                    initial={{opacity: 0, height: 0}}
                                    animate={{opacity: 1, height: 'auto'}}
                                    exit={{opacity: 0, height: 0}}
                                    className="mt-4 space-y-4"
                                >
                                    {anexosFormData.relativesInUGEL.map((relative, index) => (
                                        <motion.div 
                                            key={index} 
                                            layout 
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className={cn("grid grid-cols-1 lg:grid-cols-5 gap-4 items-end p-5 rounded-2xl transition-all", darkMode ? "border border-pink-500/20 bg-neutral-900/30 hover:border-pink-500/40" : "border border-pink-300 bg-white/50 hover:border-pink-400")}
                                        >
                                            <InputField 
                                                label="Grado o Relación de Parentesco" 
                                                name="gradoParentesco" 
                                                value={relative.gradoParentesco} 
                                                onChange={(e) => handleListFieldChange('relativesInUGEL', index, e.target.name, e.target.value)} 
                                                colSpan="lg:col-span-1"
                                                darkMode={darkMode}
                                            />
                                            <InputField 
                                                label="Área de Trabajo" 
                                                name="areaTrabajo" 
                                                value={relative.areaTrabajo} 
                                                onChange={(e) => handleListFieldChange('relativesInUGEL', index, e.target.name, e.target.value)} 
                                                colSpan="lg:col-span-1"
                                                darkMode={darkMode}
                                            />
                                            <InputField 
                                                label="Apellidos" 
                                                name="apellidos" 
                                                value={relative.apellidos} 
                                                onChange={(e) => handleListFieldChange('relativesInUGEL', index, e.target.name, e.target.value)} 
                                                colSpan="lg:col-span-1"
                                                darkMode={darkMode}
                                            />
                                            <InputField 
                                                label="Nombres" 
                                                name="nombres" 
                                                value={relative.nombres} 
                                                onChange={(e) => handleListFieldChange('relativesInUGEL', index, e.target.name, e.target.value)} 
                                                colSpan="lg:col-span-1"
                                                darkMode={darkMode}
                                            />
                                            <motion.button 
                                                type="button" 
                                                onClick={() => handleRemoveItem('relativesInUGEL', index)} 
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="p-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-all h-[52px] border border-red-500/30"
                                            >
                                                <IconTrash size={20} />
                                            </motion.button>
                                        </motion.div>
                                    ))}
                                    <motion.button 
                                        type="button" 
                                        onClick={() => {
                                          const MAX_PARIENTES = 5; // Límite específico de 5 para parientes
                                          // Validación antes de agregar
                                          if (anexosFormData.relativesInUGEL.length >= MAX_PARIENTES) {
                                            setNotification({
                                              message: `Ha alcanzado el límite máximo de ${MAX_PARIENTES} parientes.`,
                                              type: 'error'
                                            });
                                            return;
                                          }
                                          handleAddItem('relativesInUGEL', { gradoParentesco: '', areaTrabajo: '', apellidos: '', nombres: '' });
                                        }}
                                        whileHover={anexosFormData.relativesInUGEL.length >= 5 ? {} : { scale: 1.02 }}
                                        whileTap={anexosFormData.relativesInUGEL.length >= 5 ? {} : { scale: 0.98 }}
                                        disabled={anexosFormData.relativesInUGEL.length >= 5}
                                        className={cn(
                                          "flex items-center gap-2 text-sm px-4 py-2 rounded-xl border transition-all",
                                          anexosFormData.relativesInUGEL.length >= 5
                                            ? "text-gray-400 border-gray-300 bg-gray-100 cursor-not-allowed opacity-60"
                                            : "text-pink-400 hover:text-pink-300 border-pink-500/30 hover:border-pink-500/50 bg-pink-500/10 hover:bg-pink-500/20"
                                        )}
                                    >
                                        <IconPlus size={18} /> 
                                        {anexosFormData.relativesInUGEL.length >= 5 
                                          ? `Límite alcanzado (${anexosFormData.relativesInUGEL.length}/5)` 
                                          : `Añadir Pariente (${anexosFormData.relativesInUGEL.length}/5)`}
                                    </motion.button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Formato 02 - Declaraciones Juradas */}
                <div className="mt-6 mb-6">
                  <h2 className={cn("text-2xl font-bold", darkMode ? "text-white" : "text-gray-800")}>
                    Formato 02 - Declaración Jurada E: Delaración Jurada de Datos Personales
                  </h2>
                </div>

                {/* --- REFERENCIAS LABORALES --- (Se muestra antes de la tabla de advertencia en declaraciones juradas) */}
                {(shouldShowSection('referencias') || (showOnlyCurrentSection && currentSectionIndex === 7)) && (
                <>
                <FormSection 
                    title="Referencias Laborales" 
                    icon={<IconUser className="w-6 h-6" />}
                    subtitle="Proporcione contactos para referencias de empleos anteriores"
                    darkMode={darkMode}
                    required={true}
                >
                        <div className="space-y-4">
                        {anexosFormData.laborReferences.map((item, index) => (
                                <motion.div 
                                key={index} 
                                layout 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={cn("grid grid-cols-1 lg:grid-cols-6 gap-4 items-end p-5 border rounded-2xl transition-all", darkMode ? "border-pink-500/20 bg-neutral-900/30 hover:border-pink-500/40" : "border-pink-300 bg-white/80 hover:border-pink-400")}
                            >
                                <InputField label="Empresa / Entidad" name="empresaEntidad" value={item.empresaEntidad} onChange={(e) => handleListFieldChange('laborReferences', index, e.target.name, e.target.value)} colSpan="lg:col-span-2" darkMode={darkMode} />
                                <InputField label="Dirección" name="direccion" value={item.direccion} onChange={(e) => handleListFieldChange('laborReferences', index, e.target.name, e.target.value)} colSpan="lg:col-span-2" darkMode={darkMode} />
                                <InputField label="Cargo del Postulante" name="cargoPostulante" value={item.cargoPostulante} onChange={(e) => handleListFieldChange('laborReferences', index, e.target.name, e.target.value)} colSpan="lg:col-span-2" darkMode={darkMode} />
                                <InputField label="Nombre y Cargo del Jefe Inmediato" name="nombreCargoJefe" value={item.nombreCargoJefe} onChange={(e) => handleListFieldChange('laborReferences', index, e.target.name, e.target.value)} colSpan="lg:col-span-3" darkMode={darkMode} />
                                <InputField label="Teléfonos" name="telefonos" value={item.telefonos} onChange={(e) => handleListFieldChange('laborReferences', index, e.target.name, e.target.value)} colSpan="lg:col-span-2" darkMode={darkMode} />
                                <InputField label="Correo Electrónico" name="correoElectronico" value={item.correoElectronico} onChange={(e) => handleListFieldChange('laborReferences', index, e.target.name, e.target.value)} colSpan="lg:col-span-1" darkMode={darkMode} />
                                <motion.button 
                                    type="button" 
                                    onClick={() => handleRemoveItem('laborReferences', index)} 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="p-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-all h-[52px] border border-red-500/30"
                                >
                                    <IconTrash size={20} />
                                </motion.button>
                                </motion.div>
                            ))}
                        <motion.button 
                            type="button" 
                            onClick={() => handleAddItem('laborReferences', { empresaEntidad: '', direccion: '', cargoPostulante: '', nombreCargoJefe: '', telefonos: '', correoElectronico: '' })} 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={anexosFormData.laborReferences.length >= 20}
                            className={cn(
                              "flex items-center gap-2 text-sm mt-4 px-4 py-2 rounded-xl border transition-all",
                              anexosFormData.laborReferences.length >= 20
                                ? "text-gray-400 border-gray-300 bg-gray-100 cursor-not-allowed"
                                : "text-pink-400 hover:text-pink-300 border-pink-500/30 hover:border-pink-500/50 bg-pink-500/10 hover:bg-pink-500/20"
                            )}
                        >
                            <IconPlus size={18} /> 
                            {anexosFormData.laborReferences.length >= 20 
                              ? `Límite alcanzado (${anexosFormData.laborReferences.length}/20)` 
                              : `Añadir Referencia Laboral (${anexosFormData.laborReferences.length}/20)`}
                        </motion.button>
                    </div>
                </FormSection>
                </>
                )}

                {/* Tabla de Advertencia */}
                <div className={cn("overflow-x-auto mb-6 mt-6", darkMode ? "" : "")}>
                  <table className={cn("w-full border-collapse", darkMode ? "border-neutral-700" : "border-gray-300")}>
                    <tbody>
                      <tr className={cn("border", darkMode ? "border-neutral-700" : "border-gray-300")}>
                        <td className={cn("p-4 align-top border", darkMode ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" : "bg-yellow-50 border-yellow-200 text-yellow-800")} style={{ width: '150px', verticalAlign: 'top' }}>
                          <span className="font-bold">Advertencia:</span>
                        </td>
                        <td className={cn("p-4 border text-sm", darkMode ? "bg-yellow-500/5 border-yellow-500/20 text-yellow-300" : "bg-yellow-50/50 border-yellow-200 text-yellow-800")}>
                          <p className="leading-relaxed">
                            Artículo 34° numeral 34.3 del Texto Único Ordenado de la Ley N° 27444 – Ley del Procedimiento Administrativo General, aprobado por Decreto Supremo N° 004-2019-JUS.
                          </p>
                          <p className="mt-2 leading-relaxed">
                            <strong>TEXTO:</strong> En caso de comprobar fraude o falsedad en la declaración, información o en la documentación presentada por el administrado, la entidad considerará no satisfecha la exigencia respectiva para todos sus efectos, procediendo a declarar la nulidad del acto administrativo sustentado en dicha declaración, información o documento; e imponer a quien haya empleado esa declaración, información o documento una multa en favor de la entidad de entre cinco (5) y diez (10) Unidades Impositivas Tributarias vigentes a la fecha de pago; y, además, si la conducta se adecua a los supuestos previstos en el Título XIX Delitos contra la Fe Pública del Código Penal, ésta deberá ser comunicada al Ministerio Público para que interponga la acción penal correspondiente.
                          </p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

            </div>
        </FormSection>
        )}

        {/* Botón Final Mejorado - Solo mostrar si NO estamos en modo paso a paso (showOnlyCurrentSection) */}
        {!showOnlyCurrentSection && (
        <motion.button 
            type="button" 
            onClick={handleGenerateAndSavePDF} // Call the new function
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full mt-10 p-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-bold text-lg shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all flex items-center justify-center gap-3 relative overflow-hidden group"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <IconDeviceFloppy className="w-6 h-6 relative z-10" />
            <span className="relative z-10">Finalizar Registro</span>
        </motion.button>
        )}
      </div>

      {/* Modal de Confirmación */}
      {showConfirmationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-2xl mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                ¿Está seguro de enviar estos datos?
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Por favor, verifique que sus datos personales sean correctos antes de continuar:
              </p>
            </div>

            {/* Datos importantes del usuario */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mb-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
                Sus Datos Personales
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Nombre Completo:</span>
                    <p className="text-gray-900 dark:text-white font-semibold">
                      {anexosFormData.personalData.nombres} {anexosFormData.personalData.apellidoPaterno} {anexosFormData.personalData.apellidoMaterno}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">DNI:</span>
                    <p className="text-gray-900 dark:text-white font-semibold">
                      {anexosFormData.personalData.dni}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Teléfono:</span>
                    <p className="text-gray-900 dark:text-white font-semibold">
                      {anexosFormData.personalData.telefonoCelular1 || anexosFormData.personalData.telefonoDomicilio}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Correo Electrónico:</span>
                    <p className="text-gray-900 dark:text-white font-semibold">
                      {anexosFormData.personalData.correoElectronico}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowConfirmationModal(false)}
                className="px-6 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmSave}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
              >
                Sí, Enviar Datos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Component */}
      {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
    </motion.section>
  );
};

export default AnexosSection;
