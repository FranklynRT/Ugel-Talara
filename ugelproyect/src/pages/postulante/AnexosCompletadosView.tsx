import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { IconFileText, IconUser, IconSchool, IconLanguage, IconBriefcase, IconUsers, IconEdit } from '@tabler/icons-react';
import { API_BASE_URL } from '@/lib/api';

interface AnexosCompletadosViewProps {
  authToken: string | null;
  darkMode: boolean;
  cardClasses: string;
  textClasses: string;
  textSecondaryClasses: string;
  onEditAnexo?: (anexo: any) => void; // Callback para editar anexo
}

interface AnexoCompleto {
  IDANEXO_COMPLETO: number;
  IDANEXO: number;
  IDUSUARIO: number;
  IDCONVOCATORIA: number;
  tipoDocumento: string;
  dni: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombres: string;
  genero: string;
  fechaNacimiento: string;
  correoElectronico: string;
  telefonoCelular1: string;
  nombrePuesto: string;
  numeroCas: string;
  formacionAcademica: any[];
  idiomas: any[];
  ofimatica: any[];
  especializacion: any[];
  experienciaLaboral: any[];
  referenciasLaborales: any[];
  parientesUGEL: any[];
  fechaCreacion: string;
  [key: string]: any;
}

export const AnexosCompletadosView: React.FC<AnexosCompletadosViewProps> = ({
  authToken,
  darkMode,
  cardClasses,
  textClasses,
  textSecondaryClasses,
  onEditAnexo,
}) => {
  const [anexos, setAnexos] = useState<AnexoCompleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnexo, setSelectedAnexo] = useState<AnexoCompleto | null>(null);

  useEffect(() => {
    const loadAnexos = async () => {
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

        // Intentar obtener desde la tabla consolidada primero
        let response = await fetch(`${API_BASE_URL}/documentos/anexos-completos/usuario/${userId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true'
          },
        });
        
        if (!response.ok) {
          // Si no existe la tabla consolidada, usar el endpoint alternativo
          const altResponse = await fetch(`${API_BASE_URL}/documentos/anexos`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'ngrok-skip-browser-warning': 'true'
            },
          });
          
          if (altResponse.ok) {
            const anexosList = await altResponse.json();
            const anexosArray = Array.isArray(anexosList) ? anexosList : [anexosList];
            
            // Obtener datos completos de cada anexo
            const anexosCompletos = await Promise.all(
              anexosArray.map(async (anexo: any) => {
                try {
                  const completoResponse = await fetch(`${API_BASE_URL}/documentos/anexos/${anexo.IDANEXO}/completo`, {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json',
                      'ngrok-skip-browser-warning': 'true'
                    },
                  });
                  
                  if (completoResponse.ok) {
                    const completo = await completoResponse.json();
                    return {
                      IDANEXO: anexo.IDANEXO,
                      IDCONVOCATORIA: anexo.IDCONVOCATORIA,
                      fechaCreacion: anexo.fechaCreacion,
                      personalData: completo.formData?.personalData || {},
                      academicFormation: completo.formData?.academicFormation || [],
                      languageSkills: completo.formData?.languageSkills || [],
                      officeSkills: completo.formData?.officeSkills || [],
                      specializationStudies: completo.formData?.specializationStudies || [],
                      workExperience: completo.formData?.workExperience || [],
                      laborReferences: completo.formData?.laborReferences || [],
                      relativesInUGEL: completo.formData?.relativesInUGEL || [],
                    };
                  }
                  return null;
                } catch (err) {
                  console.error('Error al cargar anexo completo:', err);
                  return null;
                }
              })
            );
            
            const filteredAnexos = anexosCompletos.filter(a => a !== null);
            
            // Ordenar todos los anexos por fecha de modificación/actualización (más reciente primero)
            const anexosOrdenados = filteredAnexos.sort((a: any, b: any) => {
              const fechaA = a.fechaActualizacion || a.fechaCreacion;
              const fechaB = b.fechaActualizacion || b.fechaCreacion;
              const timestampA = fechaA ? new Date(fechaA).getTime() : 0;
              const timestampB = fechaB ? new Date(fechaB).getTime() : 0;
              return timestampB - timestampA; // Orden descendente (más reciente primero)
            });
            
            // Agregar índice del historial
            const anexosConHistorial = anexosOrdenados.map((anexo: any, index: number) => ({
              ...anexo,
              historialIndex: index + 1
            }));
            
            setAnexos(anexosConHistorial as any);
            setError(null);
          } else {
            // Si ambos fallan, intentar usar el endpoint sin userId
            const fallbackResponse = await fetch(`${API_BASE_URL}/documentos/anexos-completos`, {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'ngrok-skip-browser-warning': 'true'
              },
            });
            
            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json();
              let fallbackArray = Array.isArray(fallbackData) ? fallbackData : [fallbackData];
              
              // Ordenar todos los anexos por fecha de modificación/actualización (más reciente primero)
              fallbackArray = fallbackArray.sort((a: any, b: any) => {
                const fechaA = a.fechaActualizacion || a.fechaCreacion;
                const fechaB = b.fechaActualizacion || b.fechaCreacion;
                const timestampA = fechaA ? new Date(fechaA).getTime() : 0;
                const timestampB = fechaB ? new Date(fechaB).getTime() : 0;
                return timestampB - timestampA; // Orden descendente (más reciente primero)
              });
              
              // Agregar índice del historial
              const anexosConHistorial = fallbackArray.map((anexo: any, index: number) => ({
                ...anexo,
                historialIndex: index + 1
              }));
              
              setAnexos(anexosConHistorial as any);
              setError(null);
            } else {
              console.warn('No se pudieron cargar anexos desde ningún endpoint');
              setAnexos([]);
              setError(null); // No mostrar error, solo lista vacía
            }
          }
        } else {
          const data = await response.json();
          let anexosArray = Array.isArray(data) ? data : [data];
          
          // Ordenar todos los anexos por fecha de modificación/actualización (más reciente primero)
          // Esto crea un historial ordenado cronológicamente
          anexosArray = anexosArray.sort((a: any, b: any) => {
            // Prioridad: fechaActualizacion > fechaCreacion
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
          
          console.log('📚 Historial de anexos cargado:', {
            total: anexosArray.length,
            anexos: anexosArray.map((a: any, idx: number) => ({
              index: idx + 1,
              id: a.IDANEXO_COMPLETO || a.IDANEXO,
              fechaCreacion: a.fechaCreacion,
              fechaActualizacion: a.fechaActualizacion,
              nombrePuesto: a.nombrePuesto
            }))
          });
          
          // Función helper para parsear JSON de forma segura
          const parseJsonArray = (value: any) => {
            if (!value) return [];
            if (typeof value === 'string') {
              try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [];
              } catch (e) {
                console.warn('Error parsing JSON array:', e, value);
                return [];
              }
            }
            // Si es un objeto Buffer (MySQL), convertir a string primero
            if (value && typeof value === 'object' && value.type === 'Buffer' && Array.isArray(value.data)) {
              try {
                const bufferString = Buffer.from(value.data).toString('utf8');
                const parsed = JSON.parse(bufferString);
                return Array.isArray(parsed) ? parsed : [];
              } catch (e) {
                console.warn('Error parsing Buffer JSON array:', e, value);
                return [];
              }
            }
            return Array.isArray(value) ? value : [];
          };
          
          // Mapear los datos de la tabla consolidada a la estructura esperada
          const anexosMapeados = anexosArray.map((anexo: any, index: number) => {
            // Parsear arrays JSON
            const formacionAcademicaParsed = parseJsonArray(anexo.formacionAcademica);
            const idiomasParsed = parseJsonArray(anexo.idiomas);
            const ofimaticaParsed = parseJsonArray(anexo.ofimatica);
            const especializacionParsed = parseJsonArray(anexo.especializacion);
            const experienciaLaboralParsed = parseJsonArray(anexo.experienciaLaboral);
            const referenciasLaboralesParsed = parseJsonArray(anexo.referenciasLaborales);
            const parientesUGELParsed = parseJsonArray(anexo.parientesUGEL);

            console.log('📊 Anexo parseado:', {
              IDANEXO: anexo.IDANEXO,
              formacionAcademica: formacionAcademicaParsed.length,
              idiomas: idiomasParsed.length,
              ofimatica: ofimaticaParsed.length,
              especializacion: especializacionParsed.length,
              experienciaLaboral: experienciaLaboralParsed.length,
              referenciasLaborales: referenciasLaboralesParsed.length,
              'anexo.formacionAcademica raw': anexo.formacionAcademica,
              'anexo.experienciaLaboral raw': anexo.experienciaLaboral,
              'anexo.idiomas raw': anexo.idiomas,
              'anexo.referenciasLaborales raw': anexo.referenciasLaborales,
            });

            return {
              IDANEXO_COMPLETO: anexo.IDANEXO_COMPLETO || anexo.IDANEXO,
              IDANEXO: anexo.IDANEXO,
              IDUSUARIO: anexo.IDUSUARIO || userId,
              IDCONVOCATORIA: anexo.IDCONVOCATORIA,
              tipoDocumento: anexo.tipoDocumento || 'DNI',
              dni: anexo.dni,
              apellidoPaterno: anexo.apellidoPaterno,
              apellidoMaterno: anexo.apellidoMaterno,
              nombres: anexo.nombres,
              genero: anexo.genero,
              fechaNacimiento: anexo.fechaNacimiento,
              correoElectronico: anexo.correoElectronico,
              telefonoCelular1: anexo.telefonoCelular1,
              nombrePuesto: anexo.nombrePuesto,
              numeroCas: anexo.numeroCas,
              fechaCreacion: anexo.fechaCreacion || anexo.fecha_creacion,
              fechaActualizacion: anexo.fechaActualizacion || anexo.fecha_actualizacion,
              // Índice del historial (para numeración secuencial)
              historialIndex: index + 1,
              personalData: {
                nombres: anexo.nombres,
                apellidoPaterno: anexo.apellidoPaterno,
                apellidoMaterno: anexo.apellidoMaterno,
                dni: anexo.dni,
                genero: anexo.genero,
                fechaNacimiento: anexo.fechaNacimiento,
                correoElectronico: anexo.correoElectronico,
                telefonoCelular1: anexo.telefonoCelular1,
                direccion: anexo.direccion,
                nombrePuesto: anexo.nombrePuesto,
                numeroCas: anexo.numeroCas,
              },
              formacionAcademica: formacionAcademicaParsed,
              academicFormation: formacionAcademicaParsed,
              idiomas: idiomasParsed,
              languageSkills: idiomasParsed,
              ofimatica: ofimaticaParsed,
              officeSkills: ofimaticaParsed,
              especializacion: especializacionParsed,
              specializationStudies: especializacionParsed,
              experienciaLaboral: experienciaLaboralParsed,
              workExperience: experienciaLaboralParsed,
              referenciasLaborales: referenciasLaboralesParsed,
              laborReferences: referenciasLaboralesParsed,
              parientesUGEL: parientesUGELParsed,
              relativesInUGEL: parientesUGELParsed,
            };
          });
          
          setAnexos(anexosMapeados as any);
          setError(null);
        }
      } catch (err) {
        console.error('Error al cargar anexos:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    loadAnexos();
  }, [authToken]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No especificado';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const InfoRow = ({ label, value }: { label: string; value: string | undefined | null | any }) => {
    // Convertir el valor a string de forma segura
    const getValueAsString = (val: any): string => {
      if (val === null || val === undefined) return '';
      if (typeof val === 'string') return val;
      if (typeof val === 'number' || typeof val === 'boolean') return String(val);
      if (typeof val === 'object') {
        // Si es un objeto, intentar extraer valores útiles
        if (val.type && val.data) {
          // Si tiene estructura {type, data}, usar data si es string
          return typeof val.data === 'string' ? val.data : JSON.stringify(val.data);
        }
        // Si es un objeto común, intentar convertirlo a string
        return JSON.stringify(val);
      }
      return String(val);
    };

    const stringValue = getValueAsString(value);
    if (!stringValue || stringValue.trim() === '') return null;
    
    return (
      <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <div className={cn("font-semibold", textSecondaryClasses)}>{label}:</div>
        <div className={cn("col-span-2", textClasses)}>{stringValue}</div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={cn("w-full flex items-center justify-center min-h-[400px]", darkMode ? "text-white" : "text-gray-800")}>
        <div className="text-center">
          <div className={cn("inline-block animate-spin rounded-full h-12 w-12 border-b-2 mb-4", darkMode ? "border-blue-400" : "border-blue-600")}></div>
          <p className={cn("text-lg", textSecondaryClasses)}>Cargando anexos completados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("w-full flex items-center justify-center min-h-[400px]", darkMode ? "text-white" : "text-gray-800")}>
        <div className={cn("rounded-xl shadow-lg p-8 max-w-2xl w-full text-center", cardClasses)}>
          <IconFileText className={cn("w-16 h-16 mx-auto mb-4", darkMode ? "text-red-400" : "text-red-600")} />
          <h2 className={cn("text-2xl font-bold mb-4", textClasses)}>Error al cargar anexos</h2>
          <p className={cn("text-lg", textSecondaryClasses)}>{error}</p>
        </div>
      </div>
    );
  }

  if (anexos.length === 0) {
    return (
      <div className={cn("w-full flex items-center justify-center min-h-[400px]", darkMode ? "text-white" : "text-gray-800")}>
        <div className={cn("rounded-xl shadow-lg p-8 max-w-2xl w-full text-center", cardClasses)}>
          <IconFileText className={cn("w-16 h-16 mx-auto mb-4", darkMode ? "text-blue-400" : "text-blue-600")} />
          <h2 className={cn("text-2xl font-bold mb-4", textClasses)}>No hay anexos completados</h2>
          <p className={cn("text-lg", textSecondaryClasses)}>
            Aún no has completado ningún anexo. Completa el formulario de anexos para verlos aquí.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", darkMode ? "text-white" : "text-gray-800")}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <div className={cn("rounded-xl shadow-lg p-6", cardClasses)}>
          <div className="flex items-center gap-3 mb-4">
            <IconFileText className={cn("w-8 h-8", darkMode ? "text-blue-400" : "text-blue-600")} />
            <div>
              <h2 className={cn("text-2xl font-bold", textClasses)}>Historial de Anexos Completados</h2>
              <p className={cn("text-sm", textSecondaryClasses)}>
                {anexos.length} {anexos.length === 1 ? 'anexo en el historial' : 'anexos en el historial'} - Ordenados por fecha de modificación
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="space-y-6">
        {anexos.map((anexo, index) => (
          <motion.div
            key={anexo.IDANEXO || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={cn("rounded-xl shadow-lg overflow-hidden", cardClasses)}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className={cn("text-xl font-bold mb-2", textClasses)}>
                    Anexo #{anexo.historialIndex || index + 1}
                  </h3>
                  <p className={cn("text-sm", textSecondaryClasses)}>
                    {anexo.fechaActualizacion && anexo.fechaActualizacion !== anexo.fechaCreacion ? (
                      <>
                        Modificado el {formatDate(anexo.fechaActualizacion)}
                        <span className="ml-2 text-xs opacity-75">
                          (Creado el {formatDate(anexo.fechaCreacion)})
                        </span>
                      </>
                    ) : (
                      <>Completado el {formatDate(anexo.fechaCreacion)}</>
                    )}
                  </p>
                  {anexo.personalData?.nombrePuesto && (
                    <p className={cn("text-sm font-medium mt-1", textClasses)}>
                      Puesto: {anexo.personalData.nombrePuesto}
                    </p>
                  )}
                  {anexo.personalData?.numeroCas && (
                    <p className={cn("text-sm", textSecondaryClasses)}>
                      N° CAS: {anexo.personalData.numeroCas}
                    </p>
                  )}
                  {/* Resumen de secciones completadas */}
                  <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div className={cn("flex items-center gap-2", textSecondaryClasses)}>
                        <IconSchool className="w-4 h-4" />
                        <span>Formación: {
                          (Array.isArray(anexo.formacionAcademica) && anexo.formacionAcademica.length > 0) 
                            ? anexo.formacionAcademica.length 
                            : (Array.isArray(anexo.academicFormation) && anexo.academicFormation.length > 0)
                              ? anexo.academicFormation.length 
                              : 0
                        }</span>
                      </div>
                      <div className={cn("flex items-center gap-2", textSecondaryClasses)}>
                        <IconLanguage className="w-4 h-4" />
                        <span>Idiomas: {
                          (Array.isArray(anexo.idiomas) && anexo.idiomas.length > 0)
                            ? anexo.idiomas.length
                            : (Array.isArray(anexo.languageSkills) && anexo.languageSkills.length > 0)
                              ? anexo.languageSkills.length
                              : 0
                        }</span>
                      </div>
                      <div className={cn("flex items-center gap-2", textSecondaryClasses)}>
                        <IconBriefcase className="w-4 h-4" />
                        <span>Experiencia: {
                          (Array.isArray(anexo.experienciaLaboral) && anexo.experienciaLaboral.length > 0)
                            ? anexo.experienciaLaboral.length
                            : (Array.isArray(anexo.workExperience) && anexo.workExperience.length > 0)
                              ? anexo.workExperience.length
                              : 0
                        }</span>
                      </div>
                      <div className={cn("flex items-center gap-2", textSecondaryClasses)}>
                        <IconUsers className="w-4 h-4" />
                        <span>Referencias: {
                          (Array.isArray(anexo.referenciasLaborales) && anexo.referenciasLaborales.length > 0)
                            ? anexo.referenciasLaborales.length
                            : (Array.isArray(anexo.laborReferences) && anexo.laborReferences.length > 0)
                              ? anexo.laborReferences.length
                              : 0
                        }</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedAnexo(selectedAnexo?.IDANEXO === anexo.IDANEXO ? null : anexo)}
                    className={cn(
                      "px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2",
                      darkMode
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    )}
                  >
                    {selectedAnexo?.IDANEXO === anexo.IDANEXO ? 'Ocultar' : 'Ver Detalles'}
                  </button>
                  {onEditAnexo && (
                    <button
                      onClick={() => {
                        if (onEditAnexo) {
                          onEditAnexo(anexo);
                        }
                      }}
                      className={cn(
                        "px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2",
                        darkMode
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white"
                      )}
                    >
                      <IconEdit className="w-4 h-4" />
                      Editar
                    </button>
                  )}
                </div>
              </div>

              {selectedAnexo?.IDANEXO === anexo.IDANEXO && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={cn("mt-4 pt-4 border-t", darkMode ? "border-gray-700" : "border-gray-200")}
                >
                  <div className="space-y-6">
                    {/* Datos Personales */}
                    {anexo.personalData && (
                      <div>
                        <h4 className={cn("text-lg font-bold mb-3 flex items-center gap-2", textClasses)}>
                          <IconUser className="w-5 h-5" />
                          Datos Personales
                        </h4>
                        <div className={cn("rounded-lg p-4", darkMode ? "bg-neutral-800/50" : "bg-gray-50")}>
                          <InfoRow label="Nombres" value={anexo.personalData.nombres} />
                          <InfoRow label="Apellidos" value={`${anexo.personalData.apellidoPaterno || ''} ${anexo.personalData.apellidoMaterno || ''}`.trim()} />
                          <InfoRow label="DNI" value={anexo.personalData.dni} />
                          <InfoRow label="Género" value={anexo.personalData.genero === 'M' ? 'Masculino' : 'Femenino'} />
                          <InfoRow label="Fecha de Nacimiento" value={anexo.personalData.fechaNacimiento} />
                          <InfoRow label="Correo" value={anexo.personalData.correoElectronico} />
                          <InfoRow label="Teléfono" value={anexo.personalData.telefonoCelular1} />
                          <InfoRow label="Dirección" value={anexo.personalData.direccion} />
                        </div>
                      </div>
                    )}

                    {/* Formación Académica */}
                    {anexo.academicFormation && anexo.academicFormation.length > 0 && (
                      <div>
                        <h4 className={cn("text-lg font-bold mb-3 flex items-center gap-2", textClasses)}>
                          <IconSchool className="w-5 h-5" />
                          Formación Académica ({anexo.academicFormation.length})
                        </h4>
                        <div className="space-y-2">
                          {anexo.academicFormation.map((item: any, idx: number) => (
                            <div key={idx} className={cn("rounded-lg p-3", darkMode ? "bg-neutral-800/50" : "bg-gray-50")}>
                              <p className={cn("font-semibold", textClasses)}>{item.nivelEducativo || item.nombreGrado}</p>
                              <p className={cn("text-sm", textSecondaryClasses)}>{item.nombreInstitucion}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Idiomas */}
                    {anexo.languageSkills && anexo.languageSkills.length > 0 && (
                      <div>
                        <h4 className={cn("text-lg font-bold mb-3 flex items-center gap-2", textClasses)}>
                          <IconLanguage className="w-5 h-5" />
                          Idiomas ({anexo.languageSkills.length})
                        </h4>
                        <div className="space-y-2">
                          {anexo.languageSkills.map((item: any, idx: number) => (
                            <div key={idx} className={cn("rounded-lg p-3", darkMode ? "bg-neutral-800/50" : "bg-gray-50")}>
                              <p className={cn("font-semibold", textClasses)}>{item.idioma}</p>
                              <p className={cn("text-sm", textSecondaryClasses)}>Nivel: {item.nivel}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Experiencia Laboral */}
                    {anexo.workExperience && anexo.workExperience.length > 0 && (
                      <div>
                        <h4 className={cn("text-lg font-bold mb-3 flex items-center gap-2", textClasses)}>
                          <IconBriefcase className="w-5 h-5" />
                          Experiencia Laboral ({anexo.workExperience.length})
                        </h4>
                        <div className="space-y-2">
                          {anexo.workExperience.map((item: any, idx: number) => (
                            <div key={idx} className={cn("rounded-lg p-3", darkMode ? "bg-neutral-800/50" : "bg-gray-50")}>
                              <p className={cn("font-semibold", textClasses)}>{item.empresaEntidad}</p>
                              <p className={cn("text-sm", textSecondaryClasses)}>Cargo: {item.cargo}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

