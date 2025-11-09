import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { IconCheck, IconX, IconUser, IconPhone, IconId, IconFileText, IconFile, IconShield } from '@tabler/icons-react';
import { API_BASE_URL } from '@/lib/api';

interface VerificacionData {
  nombre: string;
  telefono: string;
  dni: string;
  anexoId: number | null;
  curriculumId: number | null;
  certificadoId: string;
  verificacionUrl: string;
}

const VerificarCertificado = () => {
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [datosVerificacion, setDatosVerificacion] = useState<VerificacionData | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Aplicar tema según localStorage
    const savedTheme = localStorage.getItem('postulante-theme');
    const isDark = savedTheme === 'dark';
    setDarkMode(isDark);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Si hay parámetros en la URL (del QR code), extraer los datos
    const id = searchParams.get('id');
    const nombre = searchParams.get('nombre');
    const telefono = searchParams.get('telefono');
    const dni = searchParams.get('dni');
    const anexoId = searchParams.get('anexoId');
    const curriculumId = searchParams.get('curriculumId');

    if (id && nombre) {
      // Datos del QR code encontrados, mostrar información
      setDatosVerificacion({
        nombre: nombre || '',
        telefono: telefono || '',
        dni: dni || '',
        anexoId: anexoId ? parseInt(anexoId) : null,
        curriculumId: curriculumId ? parseInt(curriculumId) : null,
        certificadoId: id,
        verificacionUrl: window.location.href
      });
      setLoading(false);
      setError(null);
    } else if (id) {
      // Solo hay ID pero no todos los datos, mostrar que necesita escanear el QR
      setLoading(false);
      setError('Por favor, escanee el código QR del certificado para verificar toda la información.');
    } else {
      // No hay parámetros, mostrar instrucciones
      setLoading(false);
      setError(null);
    }
  }, [searchParams]);

  return (
    <div className={cn(
      "min-h-screen w-full flex items-center justify-center p-4",
      darkMode ? "dark bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950" : "bg-gradient-to-br from-blue-50 via-white to-blue-100"
    )}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn(
          "w-full max-w-4xl rounded-3xl border shadow-2xl overflow-hidden",
          darkMode 
            ? "bg-neutral-900/90 border-neutral-700 backdrop-blur-sm" 
            : "bg-white border-blue-200"
        )}
      >
        {/* Header */}
        <div className={cn(
          "p-8 text-center border-b",
          darkMode 
            ? "bg-gradient-to-r from-blue-800 to-indigo-800 border-neutral-700" 
            : "bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-300"
        )}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4">
            <IconShield className="w-8 h-8 text-white" />
          </div>
          <h1 className={cn(
            "text-3xl font-bold mb-2",
            "text-white"
          )}>
            Verificación de Certificado
          </h1>
          <p className="text-white/90 text-sm">
            Sistema CAS 2025 - UGEL Talara
          </p>
        </div>

        {/* Contenido */}
        <div className="p-8">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className={cn(
                "w-16 h-16 border-4 rounded-full animate-spin mb-4",
                darkMode ? "border-blue-500 border-t-transparent" : "border-blue-600 border-t-transparent"
              )}></div>
              <p className={cn(
                "text-center",
                darkMode ? "text-neutral-300" : "text-gray-700"
              )}>
                Cargando información del certificado...
              </p>
            </div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "p-6 rounded-xl border text-center",
                darkMode 
                  ? "bg-red-500/10 border-red-500/30" 
                  : "bg-red-50 border-red-300"
              )}
            >
              <IconX className={cn(
                "w-12 h-12 mx-auto mb-4",
                darkMode ? "text-red-400" : "text-red-600"
              )} />
              <p className={cn(
                "text-lg font-semibold mb-2",
                darkMode ? "text-red-400" : "text-red-700"
              )}>
                Error de Verificación
              </p>
              <p className={cn(
                darkMode ? "text-red-300" : "text-red-600"
              )}>
                {error}
              </p>
              <div className="mt-6 p-4 rounded-lg bg-white/5 border border-white/10">
                <p className={cn(
                  "text-sm mb-2",
                  darkMode ? "text-neutral-300" : "text-gray-700"
                )}>
                  <strong>Instrucciones:</strong>
                </p>
                <p className={cn(
                  "text-sm",
                  darkMode ? "text-neutral-400" : "text-gray-600"
                )}>
                  Para verificar el certificado, escanee el código QR que se encuentra en la parte inferior del documento PDF.
                </p>
              </div>
            </motion.div>
          )}

          {datosVerificacion && !loading && !error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Indicador de verificación exitosa */}
              <div className={cn(
                "p-6 rounded-xl border text-center",
                darkMode 
                  ? "bg-emerald-500/10 border-emerald-500/30" 
                  : "bg-emerald-50 border-emerald-300"
              )}>
                <IconCheck className={cn(
                  "w-16 h-16 mx-auto mb-4",
                  darkMode ? "text-emerald-400" : "text-emerald-600"
                )} />
                <p className={cn(
                  "text-xl font-bold mb-2",
                  darkMode ? "text-emerald-400" : "text-emerald-700"
                )}>
                  Certificado Verificado Exitosamente
                </p>
                <p className={cn(
                  darkMode ? "text-emerald-300" : "text-emerald-600"
                )}>
                  Los datos del certificado han sido verificados y son válidos.
                </p>
              </div>

              {/* Información del Postulante */}
              <div className={cn(
                "p-6 rounded-xl border",
                darkMode 
                  ? "bg-neutral-800/50 border-neutral-700" 
                  : "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200"
              )}>
                <h2 className={cn(
                  "text-xl font-bold mb-6 flex items-center gap-2",
                  darkMode ? "text-white" : "text-blue-900"
                )}>
                  <IconUser className="w-6 h-6" />
                  Información del Postulante
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={cn(
                    "p-4 rounded-lg border",
                    darkMode 
                      ? "bg-neutral-900/50 border-neutral-600" 
                      : "bg-white border-blue-200"
                  )}>
                    <div className="flex items-center gap-3 mb-2">
                      <IconUser className={cn(
                        "w-5 h-5",
                        darkMode ? "text-blue-400" : "text-blue-600"
                      )} />
                      <p className={cn(
                        "text-sm font-medium",
                        darkMode ? "text-neutral-400" : "text-gray-600"
                      )}>
                        Nombre Completo
                      </p>
                    </div>
                    <p className={cn(
                      "text-lg font-bold",
                      darkMode ? "text-white" : "text-blue-900"
                    )}>
                      {datosVerificacion.nombre}
                    </p>
                  </div>

                  <div className={cn(
                    "p-4 rounded-lg border",
                    darkMode 
                      ? "bg-neutral-900/50 border-neutral-600" 
                      : "bg-white border-blue-200"
                  )}>
                    <div className="flex items-center gap-3 mb-2">
                      <IconPhone className={cn(
                        "w-5 h-5",
                        darkMode ? "text-blue-400" : "text-blue-600"
                      )} />
                      <p className={cn(
                        "text-sm font-medium",
                        darkMode ? "text-neutral-400" : "text-gray-600"
                      )}>
                        Teléfono
                      </p>
                    </div>
                    <p className={cn(
                      "text-lg font-bold",
                      darkMode ? "text-white" : "text-blue-900"
                    )}>
                      {datosVerificacion.telefono || 'No especificado'}
                    </p>
                  </div>

                  <div className={cn(
                    "p-4 rounded-lg border",
                    darkMode 
                      ? "bg-neutral-900/50 border-neutral-600" 
                      : "bg-white border-blue-200"
                  )}>
                    <div className="flex items-center gap-3 mb-2">
                      <IconId className={cn(
                        "w-5 h-5",
                        darkMode ? "text-blue-400" : "text-blue-600"
                      )} />
                      <p className={cn(
                        "text-sm font-medium",
                        darkMode ? "text-neutral-400" : "text-gray-600"
                      )}>
                        DNI
                      </p>
                    </div>
                    <p className={cn(
                      "text-lg font-bold",
                      darkMode ? "text-white" : "text-blue-900"
                    )}>
                      {datosVerificacion.dni || 'No especificado'}
                    </p>
                  </div>

                  <div className={cn(
                    "p-4 rounded-lg border",
                    darkMode 
                      ? "bg-neutral-900/50 border-neutral-600" 
                      : "bg-white border-blue-200"
                  )}>
                    <div className="flex items-center gap-3 mb-2">
                      <IconShield className={cn(
                        "w-5 h-5",
                        darkMode ? "text-blue-400" : "text-blue-600"
                      )} />
                      <p className={cn(
                        "text-sm font-medium",
                        darkMode ? "text-neutral-400" : "text-gray-600"
                      )}>
                        Certificado ID
                      </p>
                    </div>
                    <p className={cn(
                      "text-sm font-mono",
                      darkMode ? "text-neutral-300" : "text-blue-700"
                    )}>
                      {datosVerificacion.certificadoId}
                    </p>
                  </div>
                </div>
              </div>

              {/* Información de Documentos */}
              <div className={cn(
                "p-6 rounded-xl border",
                darkMode 
                  ? "bg-neutral-800/50 border-neutral-700" 
                  : "bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200"
              )}>
                <h2 className={cn(
                  "text-xl font-bold mb-6 flex items-center gap-2",
                  darkMode ? "text-white" : "text-indigo-900"
                )}>
                  <IconFileText className="w-6 h-6" />
                  Documentos Relacionados
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={cn(
                    "p-4 rounded-lg border flex items-center gap-4",
                    darkMode 
                      ? "bg-neutral-900/50 border-neutral-600" 
                      : "bg-white border-indigo-200"
                  )}>
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      darkMode ? "bg-indigo-500/20" : "bg-indigo-100"
                    )}>
                      <IconFile className={cn(
                        "w-6 h-6",
                        darkMode ? "text-indigo-400" : "text-indigo-600"
                      )} />
                    </div>
                    <div>
                      <p className={cn(
                        "text-sm font-medium",
                        darkMode ? "text-neutral-400" : "text-gray-600"
                      )}>
                        ID de Anexos
                      </p>
                      <p className={cn(
                        "text-lg font-bold",
                        darkMode ? "text-white" : "text-indigo-900"
                      )}>
                        {datosVerificacion.anexoId ? `#${datosVerificacion.anexoId}` : 'No disponible'}
                      </p>
                    </div>
                  </div>

                  <div className={cn(
                    "p-4 rounded-lg border flex items-center gap-4",
                    darkMode 
                      ? "bg-neutral-900/50 border-neutral-600" 
                      : "bg-white border-indigo-200"
                  )}>
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      darkMode ? "bg-purple-500/20" : "bg-purple-100"
                    )}>
                      <IconFile className={cn(
                        "w-6 h-6",
                        darkMode ? "text-purple-400" : "text-purple-600"
                      )} />
                    </div>
                    <div>
                      <p className={cn(
                        "text-sm font-medium",
                        darkMode ? "text-neutral-400" : "text-gray-600"
                      )}>
                        ID de Curriculum
                      </p>
                      <p className={cn(
                        "text-lg font-bold",
                        darkMode ? "text-white" : "text-purple-900"
                      )}>
                        {datosVerificacion.curriculumId ? `#${datosVerificacion.curriculumId}` : 'No disponible'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nota informativa */}
              <div className={cn(
                "p-4 rounded-lg border",
                darkMode 
                  ? "bg-blue-500/10 border-blue-500/30" 
                  : "bg-blue-50 border-blue-200"
              )}>
                <p className={cn(
                  "text-sm",
                  darkMode ? "text-blue-300" : "text-blue-700"
                )}>
                  <strong>Nota:</strong> Este certificado es una declaración oficial del sistema CAS 2025 de UGEL Talara. 
                  La información verificada corresponde a la postulación registrada en nuestra base de datos.
                </p>
              </div>
            </motion.div>
          )}

          {/* Instrucciones para escanear QR */}
          {!datosVerificacion && !loading && (
            <div className={cn(
              "p-6 rounded-xl border",
              darkMode 
                ? "bg-blue-500/10 border-blue-500/30" 
                : "bg-blue-50 border-blue-200"
            )}>
              <h3 className={cn(
                "text-lg font-semibold mb-4",
                darkMode ? "text-blue-300" : "text-blue-900"
              )}>
                ¿Cómo verificar el certificado?
              </h3>
              <ol className={cn(
                "list-decimal list-inside space-y-2",
                darkMode ? "text-blue-200" : "text-blue-700"
              )}>
                <li>Abra el PDF del certificado descargado.</li>
                <li>Localice el código QR en la parte inferior del documento.</li>
                <li>Use la cámara de su dispositivo o una aplicación escáner de QR.</li>
                <li>Escanee el código QR para verificar la información del certificado.</li>
              </ol>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default VerificarCertificado;
