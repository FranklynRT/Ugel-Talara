import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { IconBriefcase, IconBuilding, IconCheck, IconClipboardText, IconCash, IconUsers } from '@tabler/icons-react';
import { AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '@/lib/api'; // Import API_BASE_URL

// --- INTERFAZ DE DATOS PARA UNA CONVOCATORIA ---
interface ConvocatoriaData {
  id: string;
  area: string;
  puesto: string;
  sueldo: string;
  requisitos: string;
  licenciatura: string;
  habilidades: string;
  fechaPublicacion: string;
  fechaFinalizacion: string;
  estado: string;
  numero_cas: string;
  expPublicaMin?: string;
  expPublicaMax?: string;
  experienciaTotal?: string;
  experiencia?: string;
  publicada?: boolean;
}

// --- PROPS ACTUALIZADOS ---
type PostulacionActionResult = {
  success: boolean;
  message: string;
  type: 'success' | 'error';
  navigate: boolean;
};

interface ConvocatoriasSectionProps {
  onSelectConvocatoria: (convocatoria: ConvocatoriaData) => Promise<PostulacionActionResult>;
  cardClasses?: string;
  textClasses?: string;
  textSecondaryClasses?: string;
  darkMode?: boolean;
}

const textDecoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8') : null;

const decodeFieldValue = (value: any): string => {
  if (value === null || value === undefined) return '';

  if (typeof value === 'string') return value;

  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  if (Array.isArray(value)) {
    return value.map(item => decodeFieldValue(item)).join(', ');
  }

  if (typeof value === 'object') {
    if ((value as { type?: string }).type === 'Buffer' && Array.isArray((value as { data?: number[] }).data)) {
      const bufferData = (value as { data: number[] }).data;
      if (textDecoder) {
        try {
          return textDecoder.decode(new Uint8Array(bufferData));
        } catch (error) {
          console.warn('No se pudo decodificar buffer en ConvocatoriasSection', error);
        }
      }
      return bufferData.map(byte => String.fromCharCode(byte)).join('');
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return '';
};

const normalizeText = (value: any): string => {
  let text = decodeFieldValue(value);

  if (!text) return '';

  text = text.trim();

  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    text = text.slice(1, -1).trim();
  }

  if (
    (text.startsWith('{') && text.endsWith('}')) ||
    (text.startsWith('[') && text.endsWith(']'))
  ) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed
          .map(item => normalizeText(item))
          .filter(Boolean)
          .join('\n');
      }
      if (typeof parsed === 'object' && parsed !== null) {
        return Object.values(parsed)
          .map(item => normalizeText(item))
          .filter(Boolean)
          .join('\n');
      }
      if (parsed !== null && parsed !== undefined) {
        return String(parsed).trim();
      }
    } catch {
      // Si no se puede parsear como JSON, continuar con el texto original
    }
  }

  return text;
};

// New Notification Component (reused from AnexosSection)
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

// New Confirmation Dialog Component
interface ConfirmationDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  darkMode?: boolean;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ message, onConfirm, onCancel, darkMode = true }) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={cn(
            "p-8 rounded-xl shadow-2xl max-w-sm w-full text-center border",
            darkMode 
              ? "bg-slate-800 border-slate-700" 
              : "bg-white border-blue-300"
          )}
        >
          <p className={cn(
            "text-lg font-semibold mb-6",
            darkMode ? "text-white" : "text-blue-900"
          )}>{message}</p>
          <div className="flex justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onConfirm}
              className={cn(
                "px-6 py-3 rounded-lg font-medium transition-colors",
                darkMode 
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              )}
            >
              Continuar
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCancel}
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Cancelar
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export const ConvocatoriasSection = ({
  onSelectConvocatoria,
  cardClasses = "bg-slate-800/30 border-slate-700/50",
  textSecondaryClasses = "text-slate-300",
  darkMode = true,
}: ConvocatoriasSectionProps) => {

  const [convocatorias, setConvocatorias] = useState<ConvocatoriaData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // State for notifications
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  // State for confirmation dialog
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [selectedConvocatoriaForConfirmation, setSelectedConvocatoriaForConfirmation] = useState<ConvocatoriaData | null>(null);

  const formatDate = (value: string) => {
    if (!value) return 'No especificado';
    const normalized = value.replace(' ', 'T');
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateRange = (start?: string, end?: string) => {
    const startText = formatDate(start || '');
    const endText = formatDate(end || '');

    if (!start || !start.trim()) {
      return end && end.trim() ? endText : 'No especificado';
    }

    if (!end || !end.trim()) {
      return startText;
    }

    return `${startText} - ${endText}`;
  };

  const getExperienciaDisplay = (conv: ConvocatoriaData) => {
    const total = conv.experienciaTotal?.toString().trim();
    if (total) {
      return total;
    }
    const min = conv.expPublicaMin?.toString().trim();
    const max = conv.expPublicaMax?.toString().trim();

    if (min && max) {
      if (min === max) {
        return min;
      }
      return `${min} - ${max}`;
    }
    if (min) return min;
    if (max) return max;
    return 'No especificado';
  };

  const getLicenciaturaDisplay = (value: string) => {
    const normalized = value?.toString().trim().toLowerCase();
    if (!normalized) return 'No especificado';
    if (['sí', 'si', 'true', '1'].includes(normalized)) return 'Requerida';
    if (['no', 'false', '0'].includes(normalized)) return 'No requerida';
    return value;
  };

  const getEstadoDisplay = (conv: ConvocatoriaData) => {
    if (conv.publicada) return 'Publicada';
    const estado = conv.estado?.toString().trim();
    if (estado) return estado;
    return 'No especificado';
  };

  useEffect(() => {
    const fetchConvocatorias = async () => {
      try {
        // Obtener todas las convocatorias y filtrar las activas o publicadas
        const response = await fetch(`${API_BASE_URL}/convocatorias`, {
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const allData: any[] = await response.json();
        
        // Mapear y filtrar convocatorias con estado "Activo" o "Publicada"
        const mappedData = Array.isArray(allData) ? allData
          .filter((c: any) => {
            const estado = normalizeText(c.estado).toLowerCase();
            const publicadaFlag = normalizeText(c.publicada).toLowerCase();
            const isPublicada = ['1', 'true', 'publicada', 'activo', 'activa'].includes(publicadaFlag);
            return estado === 'activo' || estado === 'publicada' || isPublicada;
          })
          .map((c: any): ConvocatoriaData => {
            const experienciaTexto = normalizeText(
              c.experienciaTotal ??
              c.experiencia ??
              c.experienciaLaboral ??
              c.experienciaGeneral
            );
            const publicadaFlag = normalizeText(c.publicada).toLowerCase();
            const estadoTexto = normalizeText(c.estado);
            const publicada = ['1', 'true', 'publicada', 'activo', 'activa'].includes(publicadaFlag) ||
              ['Publicada', 'publicada', 'Activo', 'activo'].includes(estadoTexto);

            return {
              id: String(c.IDCONVOCATORIA || c.id || ''),
              area: normalizeText(c.area),
              puesto: normalizeText(c.puesto),
              sueldo: normalizeText(c.sueldo),
              requisitos: normalizeText(c.requisitosAcademicos ?? c.requisitos),
              licenciatura: normalizeText(c.tituloProfesional ?? c.licenciatura),
              habilidades: normalizeText(c.habilidadesTecnicas ?? c.habilidades),
              fechaPublicacion: normalizeText(c.fechaInicio ?? c.fechaPublicacion),
              fechaFinalizacion: normalizeText(c.fechaFin ?? c.fechaFinalizacion),
              estado: estadoTexto,
              numero_cas: normalizeText(c.numeroCAS ?? c.numero_cas),
              expPublicaMin: normalizeText(c.expPublicaMin),
              expPublicaMax: normalizeText(c.expPublicaMax),
              experienciaTotal: experienciaTexto,
              experiencia: experienciaTexto,
              publicada,
            };
          }) : [];
        setConvocatorias(mappedData);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchConvocatorias();
  }, []);

  // Effect to auto-hide notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000); // Hide after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleConfirmSelection = async () => {
    if (!selectedConvocatoriaForConfirmation) {
      return;
    }

    const defaultMessage = `Has seleccionado la convocatoria: ${selectedConvocatoriaForConfirmation.puesto} (N° CAS: ${selectedConvocatoriaForConfirmation.numero_cas})`;

    try {
      const result = await onSelectConvocatoria(selectedConvocatoriaForConfirmation);
      const message = result?.message?.trim() || defaultMessage;
      const type = result?.type ?? 'success';
      setNotification({ message, type });

      if (!result || result.navigate) {
        setShowConfirmation(false);
        setSelectedConvocatoriaForConfirmation(null);
      }
    } catch (error) {
      console.error('❌ Error al confirmar la convocatoria:', error);
      setNotification({
        message: 'No se pudo procesar tu selección. Inténtalo nuevamente.',
        type: 'error',
      });
    }
  };

  const handleCancelSelection = () => {
    setShowConfirmation(false);
    setSelectedConvocatoriaForConfirmation(null);
  };

  return (
    <motion.section
      key="convocatorias"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-4"
    >
      <div className="text-center mb-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className={cn(
            "inline-block p-4 rounded-3xl mb-6",
            darkMode 
              ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20" 
              : "bg-gradient-to-r from-blue-500/20 to-indigo-500/20"
          )}
        >
          <IconClipboardText className={cn(
            "w-12 h-12",
            darkMode ? "text-emerald-400" : "text-blue-600"
          )} />
        </motion.div>
        <h1 className={cn(
          "text-4xl font-bold mb-4 bg-clip-text text-transparent",
          darkMode 
            ? "bg-gradient-to-r from-emerald-400 to-teal-300" 
            : "bg-gradient-to-r from-blue-600 to-indigo-600"
        )}>
          Convocatorias Disponibles
        </h1>
        <p className={cn("text-lg", textSecondaryClasses)}>
          Selecciona la convocatoria a la que deseas postular.
        </p>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className={cn(
            "animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mb-4",
            darkMode ? "border-emerald-400" : "border-blue-600"
          )}></div>
          <p className={cn("text-center", textSecondaryClasses)}>Cargando convocatorias...</p>
        </div>
      )}

      {error && (
        <div className={cn(
          "p-6 border rounded-2xl text-center",
          darkMode 
            ? "bg-red-500/10 border-red-500/30" 
            : "bg-red-50 border-red-300"
        )}>
          <p className={darkMode ? "text-red-400" : "text-red-700"}>
            Error al cargar convocatorias: {error ?? 'Error desconocido'}
          </p>
        </div>
      )}

      {!loading && !error && convocatorias.length === 0 && (
        <div className={cn(
          "p-8 border rounded-2xl text-center",
          darkMode 
            ? "bg-slate-800/30 border-slate-700/50" 
            : "bg-white border-blue-300"
        )}>
          <p className={cn("text-lg", textSecondaryClasses)}>No hay convocatorias disponibles en este momento.</p>
        </div>
      )}

      {/* --- TARJETAS DE CONVOCATORIAS --- */}
      {!loading && !error && convocatorias.length > 0 && (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
          {convocatorias.map((convocatoria, idx) => (
            <motion.div
              key={convocatoria.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              whileHover={{ y: -8 }}
              className={cn("relative overflow-hidden p-6 rounded-3xl border backdrop-blur-sm shadow-2xl group", cardClasses)}
            >
              {/* Efecto de gradiente de fondo */}
              <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                darkMode 
                  ? "bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5" 
                  : "bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5"
              )} />
              
              {/* Brillo superior */}
              <div className={cn(
                "absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent to-transparent",
                darkMode ? "via-emerald-400/50" : "via-blue-500/50"
              )} />

              <div className="relative flex flex-col gap-5">
                {/* Encabezado elegante */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className={cn(
                        "text-2xl font-bold bg-clip-text text-transparent transition-all duration-300",
                        darkMode 
                          ? "bg-gradient-to-r from-emerald-400 to-teal-300 group-hover:from-emerald-300 group-hover:to-teal-200" 
                          : "bg-gradient-to-r from-blue-600 to-indigo-600 group-hover:from-blue-500 group-hover:to-indigo-500"
                      )}>
                        {convocatoria.puesto}
                      </h3>
                      <p className={cn(
                        "text-sm mt-1 flex items-center gap-2",
                        darkMode ? "text-slate-400" : "text-blue-700"
                      )}>
                        <IconBuilding className="w-4 h-4" />
                        {convocatoria.area}
                      </p>
                    </div>
                    <div className={cn(
                      "flex-shrink-0 px-3 py-1 border rounded-full",
                      darkMode 
                        ? "bg-emerald-500/10 border-emerald-500/30" 
                        : "bg-blue-100 border-blue-300"
                    )}>
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          darkMode ? "text-emerald-400" : "text-blue-700"
                        )}
                      >
                        {getEstadoDisplay(convocatoria)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Detalles destacados */}
                <div className="space-y-3">
                  {/* Sueldo destacado */}
                  <div className={cn(
                    "p-4 border rounded-2xl",
                    darkMode 
                      ? "bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20" 
                      : "bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-300"
                  )}>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-xl",
                        darkMode ? "bg-emerald-500/20" : "bg-blue-200"
                      )}>
                        <IconCash className={cn(
                          "w-5 h-5",
                          darkMode ? "text-emerald-400" : "text-blue-600"
                        )} />
                      </div>
                      <div>
                        <p className={cn(
                          "text-xs",
                          darkMode ? "text-slate-400" : "text-blue-700"
                        )}>Remuneración</p>
                        <p className={cn(
                          "text-lg font-bold",
                          darkMode ? "text-emerald-400" : "text-blue-600"
                        )}>{convocatoria.sueldo}</p>
                      </div>
                    </div>
                  </div>

                  {/* Grid de información */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className={cn(
                      "p-3 rounded-xl border transition-colors duration-300",
                      darkMode 
                        ? "bg-slate-800/40 border-slate-700/30 group-hover:border-emerald-500/30" 
                        : "bg-blue-50 border-blue-200 group-hover:border-blue-400"
                    )}>
                      <div className="flex items-center gap-2 mb-1">
                        <IconBriefcase className={cn(
                          "w-4 h-4",
                          darkMode ? "text-slate-400" : "text-blue-600"
                        )} />
                        <p className={cn(
                          "text-xs",
                          darkMode ? "text-slate-400" : "text-blue-700"
                        )}>Exp. Pública (Min)</p>
                      </div>
                      <p className={cn(
                        "text-sm font-semibold",
                        darkMode ? "text-slate-200" : "text-blue-900"
                      )}>{convocatoria.expPublicaMin || 'No especificado'}</p>
                    </div>

                    <div className={cn(
                      "p-3 rounded-xl border transition-colors duration-300",
                      darkMode 
                        ? "bg-slate-800/40 border-slate-700/30 group-hover:border-emerald-500/30" 
                        : "bg-blue-50 border-blue-200 group-hover:border-blue-400"
                    )}>
                      <div className="flex items-center gap-2 mb-1">
                        <IconUsers className={cn(
                          "w-4 h-4",
                          darkMode ? "text-slate-400" : "text-blue-600"
                        )} />
                        <p className={cn(
                          "text-xs",
                          darkMode ? "text-slate-400" : "text-blue-700"
                        )}>Exp. Pública (Max)</p>
                      </div>
                      <p className={cn(
                        "text-sm font-semibold",
                        darkMode ? "text-slate-200" : "text-blue-900"
                      )}>{convocatoria.expPublicaMax || 'No especificado'}</p>
                    </div>

                    <div className={cn(
                      "p-3 rounded-xl border transition-colors duration-300 md:col-span-2",
                      darkMode 
                        ? "bg-slate-800/40 border-slate-700/30 group-hover:border-emerald-500/30" 
                        : "bg-blue-50 border-blue-200 group-hover:border-blue-400"
                    )}>
                      <div className="flex items-center gap-2 mb-1">
                        <IconUsers className={cn(
                          "w-4 h-4",
                          darkMode ? "text-slate-400" : "text-blue-600"
                        )} />
                        <p className={cn(
                          "text-xs",
                          darkMode ? "text-slate-400" : "text-blue-700"
                        )}>Experiencia Total Requerida</p>
                      </div>
                      <p className={cn(
                        "text-sm font-semibold",
                        darkMode ? "text-slate-200" : "text-blue-900"
                      )}>{getExperienciaDisplay(convocatoria)}</p>
                    </div>

                    <div className={cn(
                      "p-3 rounded-xl border transition-colors duration-300 md:col-span-2",
                      darkMode 
                        ? "bg-slate-800/40 border-slate-700/30 group-hover:border-emerald-500/30" 
                        : "bg-blue-50 border-blue-200 group-hover:border-blue-400"
                    )}>
                      <div className="flex items-center gap-2 mb-1">
                        <IconClipboardText className={cn(
                          "w-4 h-4",
                          darkMode ? "text-slate-400" : "text-blue-600"
                        )} />
                        <p className={cn(
                          "text-xs",
                          darkMode ? "text-slate-400" : "text-blue-700"
                        )}>Periodo de Postulación</p>
                      </div>
                      <p className={cn(
                        "text-sm font-semibold",
                        darkMode ? "text-slate-200" : "text-blue-900"
                      )}>{formatDateRange(convocatoria.fechaPublicacion, convocatoria.fechaFinalizacion)}</p>
                    </div>

                    <div className={cn(
                      "p-3 rounded-xl border transition-colors duration-300 md:col-span-2",
                      darkMode 
                        ? "bg-slate-800/40 border-slate-700/30 group-hover:border-emerald-500/30" 
                        : "bg-blue-50 border-blue-200 group-hover:border-blue-400"
                    )}>
                      <div className="flex items-center gap-2 mb-1">
                        <IconCheck className={cn(
                          "w-4 h-4",
                          darkMode ? "text-slate-400" : "text-blue-600"
                        )} />
                        <p className={cn(
                          "text-xs",
                          darkMode ? "text-slate-400" : "text-blue-700"
                        )}>Título profesional o académico</p>
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold",
                          getLicenciaturaDisplay(convocatoria.licenciatura) === 'Requerida'
                            ? (darkMode ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-green-100 text-green-700 border border-green-300")
                            : (darkMode ? "bg-slate-700/50 text-slate-300 border border-slate-600/40" : "bg-gray-100 text-gray-600 border border-gray-300")
                        )}
                      >
                        {getLicenciaturaDisplay(convocatoria.licenciatura)}
                      </span>
                    </div>
                  </div>

                  {/* Número CAS */}
                  <div className={cn(
                    "p-3 rounded-xl border",
                    darkMode 
                      ? "bg-slate-800/40 border-slate-700/30" 
                      : "bg-blue-50 border-blue-200"
                  )}>
                    <div className="flex items-center gap-2 mb-1">
                      <IconClipboardText className={cn(
                        "w-4 h-4",
                        darkMode ? "text-slate-400" : "text-blue-600"
                      )} />
                      <p className={cn(
                        "text-xs",
                        darkMode ? "text-slate-400" : "text-blue-700"
                      )}>Número CAS</p>
                    </div>
                    <p className={cn(
                      "text-sm font-semibold",
                      darkMode ? "text-slate-200" : "text-blue-900"
                    )}>{convocatoria.numero_cas}</p>
                  </div>

                  {/* Requisitos */}
                  {convocatoria.requisitos && convocatoria.requisitos.trim() !== '' && (
                    <div className={cn(
                      "p-3 rounded-xl border",
                      darkMode 
                        ? "bg-slate-800/40 border-slate-700/30" 
                        : "bg-blue-50 border-blue-200"
                    )}>
                      <div className="flex items-start gap-2 mb-1">
                        <IconCheck className={cn(
                          "w-4 h-4 mt-0.5",
                          darkMode ? "text-slate-400" : "text-blue-600"
                        )} />
                        <p className={cn(
                          "text-xs",
                          darkMode ? "text-slate-400" : "text-blue-700"
                        )}>Requisitos</p>
                      </div>
                      <p className={cn(
                        "text-sm whitespace-pre-line",
                        darkMode ? "text-slate-300" : "text-blue-900"
                      )}>{convocatoria.requisitos}</p>
                    </div>
                  )}
                </div>

                {/* Botón mejorado */}
                <motion.button
                  type="button"
                  onClick={() => {
                    setSelectedConvocatoriaForConfirmation(convocatoria);
                    setShowConfirmation(true);
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "w-full mt-2 p-4 text-white rounded-2xl font-semibold shadow-lg transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden group/button",
                    darkMode 
                      ? "bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 shadow-emerald-500/25 hover:shadow-emerald-500/40" 
                      : "bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 shadow-blue-500/25 hover:shadow-blue-500/40"
                  )}
                >
                  <div className={cn(
                    "absolute inset-0 opacity-0 group-hover/button:opacity-100 transition-opacity duration-300",
                    darkMode 
                      ? "bg-gradient-to-r from-teal-400 to-emerald-500" 
                      : "bg-gradient-to-r from-indigo-500 to-blue-600"
                  )} />
                  <IconCheck className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">Seleccionar Convocatoria</span>
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      {showConfirmation && selectedConvocatoriaForConfirmation && (
        <ConfirmationDialog
          message={`¿Estás seguro de que deseas postular a la convocatoria de "${selectedConvocatoriaForConfirmation.puesto}"?`}
          onConfirm={handleConfirmSelection}
          onCancel={handleCancelSelection}
          darkMode={darkMode}
        />
      )}
    </motion.section>
  );
};

export default ConvocatoriasSection;