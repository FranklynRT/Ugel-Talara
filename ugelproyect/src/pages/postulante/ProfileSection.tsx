import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { IconUser, IconMail, IconPhone, IconHome, IconMapPin, IconCalendar, IconId, IconInfoCircle, IconFileText, IconEye, IconX, IconDownload, IconEdit, IconBriefcase } from '@tabler/icons-react';
import { API_BASE_URL } from '@/lib/api';

interface ProfileSectionProps {
  authToken: string | null;
  darkMode: boolean;
  cardClasses: string;
  textClasses: string;
  textSecondaryClasses: string;
  navigate?: (section: string) => void; // Agregar función de navegación
}

interface UserData {
  IDUSUARIO?: number;
  id?: number;
  nombre?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  documento?: string;
  dni?: string;
  tipoDocumento?: string;
  correo?: string;
  email?: string;
  telefono?: string;
  celular?: string;
  direccion?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  fechaNacimiento?: string;
  lugarNacimiento?: string;
  genero?: string;
  nombreCompleto?: string;
}

interface AnexoCompleto {
  IDANEXO_COMPLETO?: number;
  IDANEXO?: number;
  IDUSUARIO?: number;
  IDCONVOCATORIA?: number;
  nombres?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  dni?: string;
  nombrePuesto?: string;
  numeroCas?: string;
  fechaCreacion?: string;
  personalData?: any;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  authToken,
  darkMode,
  cardClasses,
  textClasses,
  textSecondaryClasses,
  navigate,
}) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anexosCompletos, setAnexosCompletos] = useState<AnexoCompleto[]>([]);
  const [loadingAnexos, setLoadingAnexos] = useState(false);
  const [selectedAnexoIndex, setSelectedAnexoIndex] = useState<number | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      const token = authToken || localStorage.getItem('token');
      
      if (!token) {
        setError('No hay token de autenticación disponible');
        setLoading(false);
        return;
      }

      try {
        // Decodificar el token para obtener el ID del usuario
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          setError('Token inválido');
          setLoading(false);
          return;
        }
        
        const payload = JSON.parse(atob(tokenParts[1]));
        const userId = payload?.id || payload?.IDUSUARIO;
        
        if (!userId) {
          setError('No se encontró ID de usuario en el token');
          setLoading(false);
          return;
        }

        // Obtener datos del usuario desde el backend
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true'
          },
        });
        
        if (!response.ok) {
          throw new Error(`Error al cargar datos: ${response.statusText}`);
        }
        
        const data = await response.json();
        setUserData(data);
        setError(null);
      } catch (err) {
        console.error('Error al cargar datos del usuario:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [authToken]);

  // Effect para cargar anexos completos
  useEffect(() => {
    const loadAnexosCompletos = async () => {
      const token = authToken || localStorage.getItem('token');
      if (!token) return;
      
      setLoadingAnexos(true);
      try {
        const response = await fetch(`${API_BASE_URL}/documentos/anexos-completos`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
        });

        if (response.ok) {
          const data = await response.json();
          setAnexosCompletos(Array.isArray(data) ? data : []);
        } else {
          console.error('Error al cargar anexos completos:', response.statusText);
          setAnexosCompletos([]);
        }
      } catch (error) {
        console.error('Error al cargar anexos completos:', error);
        setAnexosCompletos([]);
      } finally {
        setLoadingAnexos(false);
      }
    };

    loadAnexosCompletos();
  }, [authToken]);

  // Función para ver vista previa del PDF
  const handleViewPdf = async (anexoId: number, anexoIndex: number) => {
    const token = authToken || localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/documentos/anexos/${anexoId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        setPdfPreviewUrl(url);
        setSelectedAnexoIndex(anexoIndex);
      } else {
        console.error('Error al cargar PDF:', response.statusText);
      }
    } catch (error) {
      console.error('Error al cargar PDF:', error);
    }
  };

  // Función para descargar PDF
  const handleDownloadPdf = async (anexoId: number) => {
    const token = authToken || localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/documentos/anexos/${anexoId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Anexo_${anexoId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        console.error('Error al descargar PDF:', response.statusText);
      }
    } catch (error) {
      console.error('Error al descargar PDF:', error);
    }
  };

  // Función para cerrar vista previa
  const handleClosePdfPreview = () => {
    if (pdfPreviewUrl) {
      window.URL.revokeObjectURL(pdfPreviewUrl);
    }
    setPdfPreviewUrl(null);
    setSelectedAnexoIndex(null);
  };

  if (loading) {
    return (
      <div className={cn("w-full flex items-center justify-center min-h-[400px]", darkMode ? "text-white" : "text-gray-800")}>
        <div className="text-center">
          <div className={cn("inline-block animate-spin rounded-full h-12 w-12 border-b-2 mb-4", darkMode ? "border-blue-400" : "border-blue-600")}></div>
          <p className={cn("text-lg", textSecondaryClasses)}>Cargando datos del perfil...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("w-full flex items-center justify-center min-h-[400px]", darkMode ? "text-white" : "text-gray-800")}>
        <div className={cn("rounded-xl shadow-lg p-8 max-w-2xl w-full text-center", cardClasses)}>
          <IconInfoCircle className={cn("w-16 h-16 mx-auto mb-4", darkMode ? "text-red-400" : "text-red-600")} />
          <h2 className={cn("text-2xl font-bold mb-4", textClasses)}>Error al cargar datos</h2>
          <p className={cn("text-lg", textSecondaryClasses)}>{error}</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className={cn("w-full flex items-center justify-center min-h-[400px]", darkMode ? "text-white" : "text-gray-800")}>
        <div className={cn("rounded-xl shadow-lg p-8 max-w-2xl w-full text-center", cardClasses)}>
          <p className={cn("text-lg", textSecondaryClasses)}>No se encontraron datos del usuario</p>
        </div>
      </div>
    );
  }

  const nombreCompleto = userData.nombreCompleto || 
    [userData.apellidoPaterno, userData.apellidoMaterno, userData.nombre].filter(Boolean).join(' ') || 
    'No especificado';

  const InfoItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | undefined }) => {
    if (!value) return null;
    
    return (
      <div className={cn("flex items-start gap-4 p-4 rounded-lg", darkMode ? "bg-neutral-800/50" : "bg-gray-50")}>
        <div className={cn("mt-1", darkMode ? "text-blue-400" : "text-blue-600")}>
          {icon}
        </div>
        <div className="flex-1">
          <p className={cn("text-xs font-semibold uppercase tracking-wide mb-1", textSecondaryClasses)}>
            {label}
          </p>
          <p className={cn("text-base font-medium", textClasses)}>
            {value}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className={cn("w-full", darkMode ? "text-white" : "text-gray-800")}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn("rounded-xl shadow-lg p-8 mb-6", cardClasses)}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className={cn("p-3 rounded-lg", darkMode ? "bg-blue-600/20" : "bg-blue-100")}>
            <IconUser className={cn("w-8 h-8", darkMode ? "text-blue-400" : "text-blue-600")} />
          </div>
          <div>
            <h2 className={cn("text-2xl font-bold", textClasses)}>Mi Perfil</h2>
            <p className={cn("text-sm", textSecondaryClasses)}>Datos personales del usuario</p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => navigate && navigate('anexos')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
              darkMode
                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            )}
          >
            <IconEdit className="w-4 h-4" />
            Actualizar Anexos
          </button>
          <button
            onClick={() => navigate && navigate('convocatorias')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all border",
              darkMode
                ? "bg-transparent border-indigo-500/50 hover:border-indigo-500 text-indigo-400 hover:text-indigo-300"
                : "bg-transparent border-indigo-500 hover:border-indigo-600 text-indigo-600 hover:text-indigo-700"
            )}
          >
            <IconBriefcase className="w-4 h-4" />
            Ver Convocatorias
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem
            icon={<IconUser className="w-5 h-5" />}
            label="Nombre Completo"
            value={nombreCompleto}
          />
          
          <InfoItem
            icon={<IconId className="w-5 h-5" />}
            label="Tipo de Documento"
            value={userData.tipoDocumento || 'DNI'}
          />
          
          <InfoItem
            icon={<IconId className="w-5 h-5" />}
            label="Número de Documento"
            value={userData.documento || userData.dni}
          />
          
          <InfoItem
            icon={<IconMail className="w-5 h-5" />}
            label="Correo Electrónico"
            value={userData.correo || userData.email}
          />
          
          <InfoItem
            icon={<IconPhone className="w-5 h-5" />}
            label="Teléfono"
            value={userData.telefono || userData.celular}
          />
          
          <InfoItem
            icon={<IconHome className="w-5 h-5" />}
            label="Dirección"
            value={userData.direccion}
          />
          
          <InfoItem
            icon={<IconMapPin className="w-5 h-5" />}
            label="Departamento"
            value={userData.departamento}
          />
          
          <InfoItem
            icon={<IconMapPin className="w-5 h-5" />}
            label="Provincia"
            value={userData.provincia}
          />
          
          <InfoItem
            icon={<IconMapPin className="w-5 h-5" />}
            label="Distrito"
            value={userData.distrito}
          />
          
          <InfoItem
            icon={<IconCalendar className="w-5 h-5" />}
            label="Fecha de Nacimiento"
            value={userData.fechaNacimiento}
          />
          
          <InfoItem
            icon={<IconMapPin className="w-5 h-5" />}
            label="Lugar de Nacimiento"
            value={userData.lugarNacimiento}
          />
          
          <InfoItem
            icon={<IconUser className="w-5 h-5" />}
            label="Género"
            value={userData.genero === 'M' ? 'Masculino' : userData.genero === 'F' ? 'Femenino' : userData.genero}
          />
        </div>
      </motion.div>

      {/* Sección de Anexos Completos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className={cn("rounded-xl shadow-lg p-8", cardClasses)}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className={cn("p-3 rounded-lg", darkMode ? "bg-indigo-600/20" : "bg-indigo-100")}>
            <IconFileText className={cn("w-8 h-8", darkMode ? "text-indigo-400" : "text-indigo-600")} />
          </div>
          <div>
            <h2 className={cn("text-2xl font-bold", textClasses)}>Mis Anexos Completos</h2>
            <p className={cn("text-sm", textSecondaryClasses)}>Anexos registrados y guardados</p>
          </div>
        </div>

        {loadingAnexos ? (
          <div className={cn("text-center py-8", textSecondaryClasses)}>
            <div className={cn("inline-block animate-spin rounded-full h-8 w-8 border-b-2 mb-2", darkMode ? "border-indigo-400" : "border-indigo-600")}></div>
            <p>Cargando anexos...</p>
          </div>
        ) : anexosCompletos.length === 0 ? (
          <div className={cn("text-center py-8", textSecondaryClasses)}>
            <IconFileText className={cn("w-16 h-16 mx-auto mb-4 opacity-50", darkMode ? "text-neutral-400" : "text-gray-400")} />
            <p className={cn("text-lg", textSecondaryClasses)}>No hay anexos completos registrados</p>
            <p className={cn("text-sm mt-2", textSecondaryClasses)}>Completa y guarda un anexo para verlo aquí</p>
          </div>
        ) : (
          <div className="space-y-4">
            {anexosCompletos.map((anexo, index) => {
              // Usar IDANEXO para descargar el PDF (el endpoint usa IDANEXO)
              const anexoId = anexo.IDANEXO || anexo.IDANEXO_COMPLETO || index;
              const displayId = anexo.IDANEXO_COMPLETO || anexo.IDANEXO || index;
              const nombreCompleto = `${anexo.nombres || anexo.personalData?.nombres || ''} ${anexo.apellidoPaterno || anexo.personalData?.apellidoPaterno || ''} ${anexo.apellidoMaterno || anexo.personalData?.apellidoMaterno || ''}`.trim();
              const fechaCreacion = anexo.fechaCreacion ? new Date(anexo.fechaCreacion).toLocaleDateString('es-PE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : 'Fecha no disponible';

              return (
                <motion.div
                  key={displayId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn("p-6 rounded-lg border", darkMode 
                    ? "bg-neutral-800/50 border-indigo-500/20 hover:border-indigo-500/40"
                    : "bg-white border-gray-300 hover:border-indigo-400")}
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className={cn("text-xs font-semibold uppercase mb-1", textSecondaryClasses)}>
                        Anexo #{index + 1}
                      </p>
                      <p className={cn("text-sm", textClasses)}>
                        {fechaCreacion}
                      </p>
                    </div>
                    <div>
                      <p className={cn("text-xs font-semibold uppercase mb-1", textSecondaryClasses)}>
                        Puesto
                      </p>
                      <p className={cn("text-sm font-medium", textClasses)}>
                        {anexo.nombrePuesto || anexo.personalData?.nombrePuesto || 'Sin puesto especificado'}
                      </p>
                      {anexo.numeroCas && (
                        <p className={cn("text-xs mt-1", textSecondaryClasses)}>
                          N° CAS: {anexo.numeroCas}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className={cn("text-xs font-semibold uppercase mb-1", textSecondaryClasses)}>
                        Postulante
                      </p>
                      <p className={cn("text-sm font-medium", textClasses)}>
                        {nombreCompleto || 'Sin nombre'}
                      </p>
                      <p className={cn("text-xs mt-1", textSecondaryClasses)}>
                        DNI: {anexo.dni || anexo.personalData?.dni || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleViewPdf(anexoId, index)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
                        darkMode
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white"
                      )}
                    >
                      <IconEye className="w-4 h-4" />
                      Ver PDF
                    </button>
                    <button
                      onClick={() => handleDownloadPdf(anexoId)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all border",
                        darkMode
                          ? "bg-transparent border-indigo-500/50 hover:border-indigo-500 text-indigo-400 hover:text-indigo-300"
                          : "bg-transparent border-indigo-500 hover:border-indigo-600 text-indigo-600 hover:text-indigo-700"
                      )}
                    >
                      <IconDownload className="w-4 h-4" />
                      Descargar
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Modal de Vista Previa del PDF */}
      <AnimatePresence>
        {pdfPreviewUrl && selectedAnexoIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleClosePdfPreview}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={cn("relative w-full max-w-6xl h-[90vh] rounded-xl overflow-hidden shadow-2xl", darkMode ? "bg-neutral-900" : "bg-white")}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={cn("flex items-center justify-between p-4 border-b", darkMode ? "bg-neutral-800 border-neutral-700" : "bg-gray-100 border-gray-300")}>
                <h3 className={cn("text-lg font-bold", darkMode ? "text-white" : "text-gray-800")}>
                  Vista Previa del Anexo #{selectedAnexoIndex + 1}
                </h3>
                <button
                  onClick={handleClosePdfPreview}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    darkMode ? "hover:bg-neutral-700 text-white" : "hover:bg-gray-200 text-gray-700"
                  )}
                >
                  <IconX className="w-5 h-5" />
                </button>
              </div>
              <div className="w-full h-[calc(90vh-64px)]">
                <iframe
                  src={pdfPreviewUrl}
                  className="w-full h-full border-0"
                  title="Vista previa del PDF"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

