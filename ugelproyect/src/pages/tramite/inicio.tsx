import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { 
  IconSearch, 
  IconFileText, 
  IconUser, 
  IconBriefcase, 
  IconBuilding,
  IconHash,
  IconCertificate,
  IconSun,
  IconMoon,
  IconArrowLeft,
  IconMenu2,
  IconX,
  IconCheck,
  IconMail,
  IconPhone,
  IconDownload,
  IconFilter
} from '@tabler/icons-react';
import { UgelTalaraLogo } from '@/components/icons';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { API_BASE_URL } from '@/lib/api';

interface Postulante {
  id: number;
  certificadoId: string;
  nombreCompleto: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  dni: string;
  email: string;
  telefono: string;
  numeroCAS: string;
  puesto: string;
  area: string;
  convocatoriaId: string | null;
  anexoId: string | null;
  curriculumId: string | null;
  expedienteSIGEA: string;
  fechaRegistro: string;
  fechaActualizacion: string;
  registrado?: boolean;
  estado?: 'Registrado' | 'Pendiente' | 'En proceso' | 'Rechazado';
}

const SidebarHeaderContent = ({ darkMode }: { darkMode: boolean }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }} 
      animate={{ opacity: 1, x: 0 }} 
      transition={{ duration: 0.2 }}
    >
      <h2 className={cn("font-bold text-lg whitespace-nowrap", darkMode ? "text-white" : "text-blue-900")}>
        UGEL Talara
      </h2>
      <p className={cn("text-xs whitespace-nowrap", darkMode ? "text-neutral-400" : "text-blue-600")}>
        Mesa de Partes
      </p>
    </motion.div>
  );
};

const TramitePostulantes = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('tramite-theme');
      return savedTheme === 'dark';
    }
    return false;
  });
  
  const [postulantes, setPostulantes] = useState<Postulante[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'registrados' | 'pendientes' | 'rechazados'>('todos');
  const [registrandoId, setRegistrandoId] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [editandoExpedienteId, setEditandoExpedienteId] = useState<number | null>(null);
  const [expedienteSIGEAEditando, setExpedienteSIGEAEditando] = useState<string>('');
  const [actualizandoExpedienteId, setActualizandoExpedienteId] = useState<number | null>(null);
  const [rechazandoId, setRechazandoId] = useState<number | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('tramite-theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    if (window.innerWidth >= 768) {
      setSidebarOpen(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('tramite-theme', darkMode ? 'dark' : 'light');
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Cargar postulantes desde la tabla verificacion_qr
  useEffect(() => {
    const cargarPostulantes = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/documentos/postulantes-registrados`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true'
          },
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.postulantes) {
            // Los datos ya vienen estructurados desde el backend
            const postulantesData: Postulante[] = data.postulantes.map((postulante: any) => ({
              id: postulante.id,
              certificadoId: postulante.certificadoId || 'N/A',
              nombreCompleto: postulante.nombreCompleto || 'Sin nombre',
              apellidoPaterno: postulante.apellidoPaterno || '',
              apellidoMaterno: postulante.apellidoMaterno || '',
              dni: postulante.dni || 'N/A',
              email: postulante.email || 'N/A',
              telefono: postulante.telefono || 'N/A',
              numeroCAS: postulante.numeroCAS || 'N/A',
              puesto: postulante.puesto || 'N/A',
              area: postulante.area || 'N/A',
              convocatoriaId: postulante.convocatoriaId || null,
              anexoId: postulante.anexoId || null,
              curriculumId: postulante.curriculumId || null,
              expedienteSIGEA: postulante.expedienteSIGEA || '',
              fechaRegistro: postulante.fechaRegistro || '',
              fechaActualizacion: postulante.fechaActualizacion || '',
              registrado: postulante.registrado || postulante.estado === 'Registrado' || false,
              estado: postulante.estado || (postulante.registrado ? 'Registrado' : 'Pendiente')
            }));
            
            setPostulantes(postulantesData);
            console.log('✅ Postulantes registrados cargados:', postulantesData.length);
            console.log('📊 Total de postulantes:', data.total);
          } else {
            console.warn('⚠️ Respuesta sin datos de postulantes');
            setPostulantes([]);
          }
        } else {
          console.error('❌ Error al cargar postulantes:', response.status);
          setNotification({ message: 'Error al cargar postulantes registrados', type: 'error' });
        }
      } catch (error) {
        console.error('❌ Error al cargar postulantes:', error);
        setNotification({ message: 'Error al cargar postulantes registrados', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    cargarPostulantes();
  }, []);

  // Función para descargar Excel con resumen y lista completa
  const descargarExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();

      // Preparar datos para la hoja de postulantes - usar TODOS los postulantes, no solo los filtrados
      const datosPostulantes = postulantes.map((postulante, index) => ({
        'N°': index + 1,
        'ID Certificado': postulante.certificadoId || 'N/A',
        'Nombres': postulante.apellidoPaterno && postulante.apellidoMaterno 
          ? postulante.nombreCompleto
              .replace(postulante.apellidoPaterno, '')
              .replace(postulante.apellidoMaterno, '')
              .trim()
          : postulante.nombreCompleto.split(' ').slice(0, -2).join(' ') || postulante.nombreCompleto,
        'Apellidos': postulante.apellidoPaterno && postulante.apellidoMaterno 
          ? `${postulante.apellidoPaterno} ${postulante.apellidoMaterno}`
          : postulante.nombreCompleto.split(' ').slice(-2).join(' ') || 'N/A',
        'DNI': postulante.dni || 'N/A',
        'Email': postulante.email || 'N/A',
        'Teléfono': postulante.telefono || 'N/A',
        'N° CAS': postulante.numeroCAS || 'N/A',
        'Puesto': postulante.puesto || 'N/A',
        'Área': postulante.area || 'N/A',
        'N° Expediente SIGEA': postulante.expedienteSIGEA || '- Sin asignar -',
        'Estado': postulante.estado || (postulante.registrado ? 'Registrado' : 'Pendiente'),
        'Fecha de Registro': postulante.fechaRegistro ? new Date(postulante.fechaRegistro).toLocaleDateString('es-PE') : 'N/A',
        'Fecha de Actualización': postulante.fechaActualizacion ? new Date(postulante.fechaActualizacion).toLocaleDateString('es-PE') : 'N/A'
      }));

      // Crear estructura de datos para la hoja de postulantes con título
      const headersPostulantes = Object.keys(datosPostulantes[0] || {});
      const datosPostulantesArray = [
        ['📋 LISTA COMPLETA DE POSTULANTES - UGEL TALARA'], // Título
        [''], // Fila vacía
        headersPostulantes, // Encabezados
        ...datosPostulantes.map(item => 
          headersPostulantes.map(key => item[key as keyof typeof item])
        )
      ];

      // Crear hoja de postulantes desde el array
      const wsPostulantes = XLSX.utils.aoa_to_sheet(datosPostulantesArray);
      
      // Ajustar ancho de columnas
      const columnWidths = [
        { wch: 5 },   // N°
        { wch: 25 },  // ID Certificado
        { wch: 20 },  // Nombres
        { wch: 25 },  // Apellidos
        { wch: 12 },  // DNI
        { wch: 25 },  // Email
        { wch: 15 },  // Teléfono
        { wch: 12 },  // N° CAS
        { wch: 30 },  // Puesto
        { wch: 25 },  // Área
        { wch: 20 },  // N° Expediente SIGEA
        { wch: 15 },  // Estado
        { wch: 18 },  // Fecha de Registro
        { wch: 20 }   // Fecha de Actualización
      ];
      wsPostulantes['!cols'] = columnWidths;

      // Crear resumen con iconos (símbolos Unicode)
      const totalPostulantes = postulantes.length;
      const registrados = postulantes.filter(p => p.estado === 'Registrado' || p.registrado).length;
      const rechazados = postulantes.filter(p => p.estado === 'Rechazado').length;
      const pendientes = postulantes.filter(p => {
        const estado = p.estado || (p.registrado ? 'Registrado' : 'Pendiente');
        return estado !== 'Registrado' && estado !== 'Rechazado';
      }).length;
      const conExpediente = postulantes.filter(p => p.expedienteSIGEA && p.expedienteSIGEA.trim() !== '').length;
      const sinExpediente = postulantes.filter(p => !p.expedienteSIGEA || p.expedienteSIGEA.trim() === '').length;
      const porcentajeRegistrados = totalPostulantes > 0 ? ((registrados / totalPostulantes) * 100).toFixed(2) : '0';

      // Crear datos del resumen con estructura de array para Excel
      const datosResumenArray = [
        ['📋 RESUMEN DE POSTULANTES - UGEL TALARA'], // Título
        [''], // Fila vacía
        ['Indicador', 'Valor'], // Encabezados
        ['📊 Total de Postulantes', totalPostulantes],
        ['✅ Postulantes Registrados', registrados],
        ['⏳ Postulantes Pendientes', pendientes],
        ['❌ Postulantes Rechazados', rechazados],
        ['📁 Con Expediente SIGEA', conExpediente],
        ['📄 Sin Expediente SIGEA', sinExpediente],
        ['📈 Porcentaje Registrados', `${porcentajeRegistrados}%`],
        [''], // Línea separadora
        ['📅 Fecha de Reporte', new Date().toLocaleDateString('es-PE')],
        ['🕐 Hora de Reporte', new Date().toLocaleTimeString('es-PE')]
      ];

      // Crear hoja de resumen desde el array
      const wsResumen = XLSX.utils.aoa_to_sheet(datosResumenArray);
      
      // Ajustar ancho de columnas
      wsResumen['!cols'] = [{ wch: 35 }, { wch: 25 }];

      // Agregar hojas al libro (Resumen primero, con iconos en los nombres)
      XLSX.utils.book_append_sheet(workbook, wsResumen, '📊 Resumen');
      XLSX.utils.book_append_sheet(workbook, wsPostulantes, '📋 Postulantes');

      // Generar nombre del archivo
      const fecha = new Date().toISOString().split('T')[0];
      const nombreArchivo = `postulantes_registrados_${fecha}.xlsx`;

      // Descargar archivo
      XLSX.writeFile(workbook, nombreArchivo);

      setNotification({ 
        message: `Excel descargado exitosamente: ${nombreArchivo}`, 
        type: 'success' 
      });
    } catch (error) {
      console.error('❌ Error al descargar Excel:', error);
      setNotification({ 
        message: 'Error al descargar el archivo Excel', 
        type: 'error' 
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('tramite-theme');
    window.location.href = '/';
  };


  const handleRegistrarPostulante = async (postulante: Postulante) => {
    try {
      setRegistrandoId(postulante.id);
      const token = localStorage.getItem('token');
      
      // Registrar el postulante con todos sus datos
      const response = await fetch(`${API_BASE_URL}/documentos/registrar-postulante`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          idVerificacion: postulante.id,
          certificadoId: postulante.certificadoId,
          nombreCompleto: postulante.nombreCompleto,
          apellidoPaterno: postulante.apellidoPaterno,
          apellidoMaterno: postulante.apellidoMaterno,
          dni: postulante.dni,
          email: postulante.email,
          telefono: postulante.telefono,
          numeroCAS: postulante.numeroCAS,
          puesto: postulante.puesto,
          area: postulante.area,
          anexoId: postulante.anexoId,
          curriculumId: postulante.curriculumId,
          convocatoriaId: postulante.convocatoriaId,
          expedienteSIGEA: postulante.expedienteSIGEA || ''
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Después de registrar exitosamente, obtener todas las convocatorias del postulante y crear verificaciones
          try {
            // Obtener todas las convocatorias del postulante desde sus anexos
            let convocatoriasPostulante: any[] = [];
            
            // Si hay un anexoId, obtener la convocatoria desde ese anexo
            if (postulante.anexoId) {
              try {
                const anexoIdNum = postulante.anexoId.toString().replace('ANEXO-', '');
                const anexoResponse = await fetch(`${API_BASE_URL}/documentos/anexos-completos/${anexoIdNum}`, {
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                  },
                });
                
                if (anexoResponse.ok) {
                  const anexoData = await anexoResponse.json();
                  if (anexoData.IDCONVOCATORIA) {
                    convocatoriasPostulante.push({
                      id: anexoData.IDCONVOCATORIA,
                      numeroCAS: anexoData.numeroCAS || postulante.numeroCAS,
                      area: anexoData.area || postulante.area,
                      puesto: anexoData.puesto || postulante.puesto
                    });
                  }
                }
              } catch (error) {
                console.warn('⚠️ Error al obtener convocatoria desde anexo:', error);
              }
            }
            
            // Si no se encontró convocatoria desde el anexo, usar la del postulante
            if (convocatoriasPostulante.length === 0 && postulante.convocatoriaId) {
              convocatoriasPostulante.push({
                id: postulante.convocatoriaId,
                numeroCAS: postulante.numeroCAS,
                area: postulante.area,
                puesto: postulante.puesto
              });
            }
            
            // Si aún no hay convocatorias, intentar obtener todas las convocatorias del usuario desde sus anexos
            if (convocatoriasPostulante.length === 0 && postulante.dni) {
              try {
                // Buscar usuario por DNI
                const usuarioResponse = await fetch(`${API_BASE_URL}/users?documento=${postulante.dni}`, {
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                  },
                });
                
                if (usuarioResponse.ok) {
                  const usuarios = await usuarioResponse.json();
                  if (usuarios.length > 0 && usuarios[0].IDUSUARIO) {
                    const userId = usuarios[0].IDUSUARIO;
                    
                    // Obtener todos los anexos del usuario
                    const anexosResponse = await fetch(`${API_BASE_URL}/documentos/anexos-completos/usuario/${userId}`, {
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'ngrok-skip-browser-warning': 'true'
                      },
                    });
                    
                    if (anexosResponse.ok) {
                      const anexosData = await anexosResponse.json();
                      const anexos = Array.isArray(anexosData) ? anexosData : [anexosData];
                      
                      // Extraer convocatorias únicas
                      const convocatoriasUnicas = new Map();
                      anexos.forEach((anexo: any) => {
                        if (anexo.IDCONVOCATORIA && !convocatoriasUnicas.has(anexo.IDCONVOCATORIA)) {
                          convocatoriasUnicas.set(anexo.IDCONVOCATORIA, {
                            id: anexo.IDCONVOCATORIA,
                            numeroCAS: anexo.numeroCAS || postulante.numeroCAS,
                            area: anexo.area || postulante.area,
                            puesto: anexo.puesto || postulante.puesto
                          });
                        }
                      });
                      
                      convocatoriasPostulante = Array.from(convocatoriasUnicas.values());
                    }
                  }
                }
              } catch (error) {
                console.warn('⚠️ Error al obtener convocatorias del usuario:', error);
              }
            }
            
            // Si aún no hay convocatorias, usar datos por defecto
            if (convocatoriasPostulante.length === 0) {
              convocatoriasPostulante.push({
                id: postulante.convocatoriaId || null,
                numeroCAS: postulante.numeroCAS,
                area: postulante.area,
                puesto: postulante.puesto
              });
            }
            
            const fechaActual = new Date();
            const fecha = fechaActual.toISOString().split('T')[0];
            const hora = fechaActual.toTimeString().split(' ')[0];
            
            // Crear una verificación QR por cada convocatoria
            let verificacionesCreadas = 0;
            let verificacionesExistentes = 0;
            
            for (const convocatoria of convocatoriasPostulante) {
              if (!convocatoria.id) continue;
              
              // Construir datosQR con toda la información del postulante y convocatoria
              const datosQR = {
                certificado: postulante.certificadoId,
                postulante: postulante.nombreCompleto,
                nombreCompleto: postulante.nombreCompleto,
                puesto: convocatoria.puesto || postulante.puesto || 'Postulante',
                convocatoriaId: convocatoria.id,
                fecha: fecha,
                hora: hora,
                entidad: 'UGEL TALARA',
                sistema: 'Sistema CAS 2025',
                anexoId: postulante.anexoId || null,
                curriculumId: postulante.curriculumId || null,
                convocatoriaInfo: `CONVOCATORIA-${convocatoria.id}`,
                area: convocatoria.area || postulante.area || null,
                numeroCAS: convocatoria.numeroCAS || postulante.numeroCAS || null,
                email: postulante.email || null
              };
              
              // Construir datosVerificados con los datos verificados
              const datosVerificados = {
                nombreCompleto: postulante.nombreCompleto,
                email: postulante.email || null,
                puesto: convocatoria.puesto || postulante.puesto || 'Postulante',
                dni: postulante.dni || null,
                telefono: postulante.telefono || null,
                estado: 'Registrado',
                expedienteSIGEA: postulante.expedienteSIGEA || null
              };
              
              // Crear verificación QR para enviar al comité
              try {
                const verificacionResponse = await fetch(`${API_BASE_URL}/documentos/verificacion`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                  },
                  body: JSON.stringify({
                    codigoCertificado: `${postulante.certificadoId}-CONV-${convocatoria.id}`, // Código único por convocatoria
                    datosQR: datosQR,
                    datosVerificados: datosVerificados,
                    fechaRegistro: fechaActual.toISOString()
                  })
                });
                
                if (verificacionResponse.ok) {
                  verificacionesCreadas++;
                  console.log(`✅ Verificación QR creada para comité (Convocatoria ${convocatoria.id}):`, await verificacionResponse.json());
                } else if (verificacionResponse.status === 409) {
                  verificacionesExistentes++;
                  console.log(`ℹ️ Verificación QR ya existe para Convocatoria ${convocatoria.id}`);
                } else {
                  const errorVerif = await verificacionResponse.json().catch(() => ({}));
                  console.warn(`⚠️ Error al crear verificación QR para Convocatoria ${convocatoria.id}:`, errorVerif);
                }
              } catch (verifError) {
                console.error(`❌ Error al crear verificación QR para Convocatoria ${convocatoria.id}:`, verifError);
              }
            }
            
            // Mensaje de notificación
            if (verificacionesCreadas > 0 || verificacionesExistentes > 0) {
              const mensaje = verificacionesCreadas > 0
                ? `Postulante registrado y enviado al comité${convocatoriasPostulante.length > 1 ? ` (${verificacionesCreadas} convocatorias)` : ` (Convocatoria ${convocatoriasPostulante[0].id})`}. Recargando datos...`
                : `Postulante registrado${verificacionesExistentes > 0 ? ' (ya estaba en comité)' : ''}. Recargando datos...`;
              setNotification({ message: mensaje, type: 'success' });
            } else {
              setNotification({ 
                message: 'Postulante registrado, pero hubo un problema al enviarlo al comité. Recargando datos...', 
                type: 'success' 
              });
            }
          } catch (verifError) {
            console.error('❌ Error al crear verificación QR:', verifError);
            setNotification({ 
              message: 'Postulante registrado, pero hubo un problema al enviarlo al comité. Recargando datos...', 
              type: 'success' 
            });
          }
          
          // Actualizar el estado local para marcar como registrado
          setPostulantes(prev => prev.map(p => 
            p.id === postulante.id 
              ? { ...p, registrado: true }
              : p
          ));
          
          // Recargar la lista de postulantes después de un breve delay
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          setNotification({ message: data.error || 'Error al registrar el postulante', type: 'error' });
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setNotification({ message: errorData.error || 'Error al registrar el postulante', type: 'error' });
      }
    } catch (error) {
      console.error('Error al registrar postulante:', error);
      setNotification({ message: 'Error al registrar el postulante', type: 'error' });
    } finally {
      setRegistrandoId(null);
    }
  };

  const handleIniciarEdicionExpediente = (postulante: Postulante) => {
    setEditandoExpedienteId(postulante.id);
    setExpedienteSIGEAEditando(postulante.expedienteSIGEA || '');
  };

  const handleCancelarEdicionExpediente = () => {
    setEditandoExpedienteId(null);
    setExpedienteSIGEAEditando('');
  };

  const handleActualizarExpediente = async (postulanteId: number) => {
    if (!expedienteSIGEAEditando.trim()) {
      setNotification({ message: 'El número de expediente SIGEA no puede estar vacío', type: 'error' });
      return;
    }

    try {
      setActualizandoExpedienteId(postulanteId);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/documentos/postulantes-registrados/${postulanteId}/expediente`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          expedienteSIGEA: expedienteSIGEAEditando.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotification({ message: 'Expediente SIGEA actualizado correctamente', type: 'success' });
          
          // Actualizar el estado local - SOLO el expediente SIGEA, NO cambiar el estado de registrado
          setPostulantes(prev => prev.map(p => 
            p.id === postulanteId 
              ? { ...p, expedienteSIGEA: expedienteSIGEAEditando.trim() }
              : p
          ));
          
          setEditandoExpedienteId(null);
          setExpedienteSIGEAEditando('');
        } else {
          setNotification({ message: data.error || 'Error al actualizar el expediente', type: 'error' });
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setNotification({ message: errorData.error || 'Error al actualizar el expediente', type: 'error' });
      }
    } catch (error) {
      console.error('Error al actualizar expediente:', error);
      setNotification({ message: 'Error al actualizar el expediente SIGEA', type: 'error' });
    } finally {
      setActualizandoExpedienteId(null);
    }
  };

  const handleRechazarPostulante = async (postulante: Postulante) => {
    try {
      setRechazandoId(postulante.id);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/documentos/postulantes-registrados/${postulante.id}/rechazar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotification({ message: 'Postulante rechazado correctamente', type: 'success' });
          
          // Actualizar el estado local
          setPostulantes(prev => prev.map(p => 
            p.id === postulante.id 
              ? { ...p, estado: 'Rechazado', registrado: false }
              : p
          ));
        } else {
          setNotification({ message: data.error || 'Error al rechazar el postulante', type: 'error' });
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setNotification({ message: errorData.error || 'Error al rechazar el postulante', type: 'error' });
      }
    } catch (error) {
      console.error('Error al rechazar postulante:', error);
      setNotification({ message: 'Error al rechazar el postulante', type: 'error' });
    } finally {
      setRechazandoId(null);
    }
  };

  const filteredPostulantes = postulantes.filter(p => {
    // Filtro por estado
    const estadoPostulante = p.estado || (p.registrado ? 'Registrado' : 'Pendiente');
    if (filtroEstado === 'registrados' && estadoPostulante !== 'Registrado') {
      return false;
    }
    if (filtroEstado === 'pendientes' && estadoPostulante !== 'Pendiente' && estadoPostulante !== 'En proceso') {
      return false;
    }
    if (filtroEstado === 'rechazados' && estadoPostulante !== 'Rechazado') {
      return false;
    }
    
    // Filtro por búsqueda
    const searchLower = searchTerm.toLowerCase();
    return (
      p.nombreCompleto.toLowerCase().includes(searchLower) ||
      p.apellidoPaterno.toLowerCase().includes(searchLower) ||
      p.apellidoMaterno.toLowerCase().includes(searchLower) ||
      p.certificadoId.toLowerCase().includes(searchLower) ||
      p.dni.toLowerCase().includes(searchLower) ||
      p.email.toLowerCase().includes(searchLower) ||
      p.telefono.toLowerCase().includes(searchLower) ||
      p.numeroCAS.toLowerCase().includes(searchLower) ||
      p.puesto.toLowerCase().includes(searchLower) ||
      p.area.toLowerCase().includes(searchLower) ||
      (p.expedienteSIGEA && p.expedienteSIGEA.toLowerCase().includes(searchLower))
    );
  });

  const sidebarLinks = [
    { label: "Postulantes", key: 'postulantes', icon: <IconFileText className="w-5 h-5" /> }
  ];

  return (
    <div className={cn("h-screen w-full relative flex overflow-hidden", darkMode ? "dark bg-black" : "bg-gray-100")}>
      {/* Background */}
      {darkMode && (
        <>
          <div className="absolute inset-0 z-0 bg-black" />
          <div
            className="absolute inset-0 z-0"
            style={{
              background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(59, 130, 246, 0.25), transparent 70%)",
            }}
          />
        </>
      )}

      {/* Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} animate={true}>
        <SidebarBody className={cn("backdrop-blur-xl border-r flex flex-col justify-between", darkMode ? "bg-neutral-900/80 border-neutral-800/50" : "bg-white border-blue-200 shadow-lg")}>
          <div>
            <div className={cn("py-5 px-4 flex items-center gap-4 h-[80px]")}>
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg", darkMode ? "bg-gradient-to-r from-blue-500 to-indigo-500 shadow-blue-500/30" : "bg-gradient-to-r from-blue-600 to-blue-700 shadow-blue-500/30")}>
                <UgelTalaraLogo className="w-7 h-7 text-white" />
              </div>
              <SidebarHeaderContent darkMode={darkMode} />
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={cn(
                  "absolute right-2 p-2 rounded-lg transition-all hover:scale-105",
                  darkMode ? "text-white hover:bg-neutral-800" : "text-blue-700 hover:bg-blue-50"
                )}
              >
                {sidebarOpen ? <IconX className="w-5 h-5" /> : <IconMenu2 className="w-5 h-5" />}
              </button>
            </div>
            <div className="mt-8 px-4 flex flex-col gap-2">
              {sidebarLinks.map((link) => (
                <SidebarLink 
                  key={link.key}
                  icon={link.icon} 
                  label={link.label} 
                  isActive={true}
                  onClick={() => {}}
                  darkMode={darkMode} 
                />
              ))}
            </div>
          </div>
          <div className={cn("border-t p-4 space-y-2", darkMode ? "border-neutral-800" : "border-blue-200")}>
            <button 
              onClick={() => setDarkMode(!darkMode)} 
              className={cn(
                "flex items-center gap-4 w-full py-3 px-4 rounded-xl transition-all shadow-md",
                darkMode ? "bg-neutral-800 hover:bg-neutral-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
              )}
            >
              {darkMode ? <IconSun className="w-5 h-5" /> : <IconMoon className="w-5 h-5" />}
              <span className="text-sm font-medium">{darkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
            </button>
            <button 
              onClick={handleLogout} 
              className={cn(
                "flex items-center gap-4 w-full py-3 px-4 rounded-xl transition-all shadow-md",
                darkMode ? "bg-red-600/80 hover:bg-red-600 text-white" : "bg-red-600 hover:bg-red-700 text-white"
              )}
            >
              <IconArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Cerrar Sesión</span>
            </button>
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Content */}
      <main className={cn("flex-1 relative z-10 overflow-y-auto", darkMode ? "" : "bg-white")}>
        {/* Mobile Header */}
        <div className={cn("md:hidden sticky top-0 z-20 p-4 backdrop-blur-md border-b flex items-center gap-4", darkMode ? "bg-neutral-950/80 border-neutral-800" : "bg-white/80 border-blue-200 shadow-sm")}>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn(
              "p-2 rounded-lg transition-all hover:scale-105",
              darkMode ? "text-white hover:bg-neutral-800" : "text-blue-700 hover:bg-blue-50"
            )}
          >
            <IconMenu2 className="w-6 h-6" />
          </button>
          <h1 className={cn("text-lg font-semibold", darkMode ? "text-white" : "text-blue-900")}>Postulantes</h1>
        </div>

        {/* Content */}
        <div className="p-4 lg:p-6 w-full">
          {/* Header with gradient */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "rounded-2xl shadow-2xl p-8 mb-6 relative overflow-hidden",
              darkMode 
                ? "bg-gradient-to-br from-neutral-800 via-neutral-800/90 to-blue-900/30 border border-blue-500/20" 
                : "bg-gradient-to-br from-white via-blue-50 to-blue-100 border-2 border-blue-500"
            )}
          >
            {/* Decorative circles */}
            <div className={cn(
              "absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-20",
              darkMode ? "bg-blue-500" : "bg-blue-300"
            )} />
            <div className={cn(
              "absolute -bottom-10 -left-10 w-32 h-32 rounded-full opacity-10",
              darkMode ? "bg-indigo-500" : "bg-indigo-300"
            )} />
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-3">
                <div className={cn(
                  "p-3 rounded-xl shadow-lg",
                  darkMode 
                    ? "bg-gradient-to-br from-blue-500 to-indigo-600" 
                    : "bg-gradient-to-br from-blue-600 to-blue-700"
                )}>
                  <IconFileText className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h1 className={cn(
                    "text-2xl font-bold tracking-tight",
                    darkMode ? "text-white" : "text-blue-950"
                  )}>
                    Registro de Postulantes
                  </h1>
                  <p className={cn(
                    "text-xs font-medium mt-1",
                    darkMode ? "text-blue-300" : "text-blue-700"
                  )}>
                    Mesa de Partes - UGEL Talara
                  </p>
                </div>
              </div>
              
              {/* Stats - Conteo de postulantes registrados */}
              {!loading && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-wrap gap-4 mt-4"
                >
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg",
                    darkMode 
                      ? "bg-blue-500/20 border border-blue-500/30" 
                      : "bg-blue-100 border border-blue-300"
                  )}>
                    <IconUser className={cn("w-4 h-4", darkMode ? "text-blue-400" : "text-blue-600")} />
                    <span className={cn("text-sm font-bold", darkMode ? "text-white" : "text-blue-950")}>
                      {postulantes.length}
                    </span>
                    <span className={cn("text-xs", darkMode ? "text-blue-300" : "text-blue-700")}>
                      Total Postulantes
                    </span>
                  </div>
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg",
                    darkMode 
                      ? "bg-green-500/20 border border-green-500/30" 
                      : "bg-green-100 border border-green-300"
                  )}>
                    <IconCheck className={cn("w-4 h-4", darkMode ? "text-green-400" : "text-green-600")} />
                    <span className={cn("text-sm font-bold", darkMode ? "text-white" : "text-green-950")}>
                      {postulantes.filter(p => p.registrado).length}
                    </span>
                    <span className={cn("text-xs", darkMode ? "text-green-300" : "text-green-700")}>
                      Registrados
                    </span>
                  </div>
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg",
                    darkMode 
                      ? "bg-yellow-500/20 border border-yellow-500/30" 
                      : "bg-yellow-100 border border-yellow-300"
                  )}>
                    <IconFileText className={cn("w-4 h-4", darkMode ? "text-yellow-400" : "text-yellow-600")} />
                    <span className={cn("text-sm font-bold", darkMode ? "text-white" : "text-yellow-950")}>
                      {postulantes.filter(p => {
                        const estado: 'Registrado' | 'Pendiente' | 'En proceso' | 'Rechazado' | undefined = p.estado || (p.registrado ? 'Registrado' : 'Pendiente');
                        return estado !== 'Registrado' && estado !== 'Rechazado';
                      }).length}
                    </span>
                    <span className={cn("text-xs", darkMode ? "text-yellow-300" : "text-yellow-700")}>
                      Pendientes
                    </span>
                  </div>
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg",
                    darkMode 
                      ? "bg-red-500/20 border border-red-500/30" 
                      : "bg-red-100 border border-red-300"
                  )}>
                    <IconX className={cn("w-4 h-4", darkMode ? "text-red-400" : "text-red-600")} />
                    <span className={cn("text-sm font-bold", darkMode ? "text-white" : "text-red-950")}>
                      {postulantes.filter(p => p.estado === 'Rechazado').length}
                    </span>
                    <span className={cn("text-xs", darkMode ? "text-red-300" : "text-red-700")}>
                      Rechazados
                    </span>
                  </div>
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg",
                    darkMode 
                      ? "bg-purple-500/20 border border-purple-500/30" 
                      : "bg-purple-100 border border-purple-300"
                  )}>
                    <IconHash className={cn("w-4 h-4", darkMode ? "text-purple-400" : "text-purple-600")} />
                    <span className={cn("text-sm font-bold", darkMode ? "text-white" : "text-purple-950")}>
                      {postulantes.filter(p => p.expedienteSIGEA && p.expedienteSIGEA.trim() !== '').length}
                    </span>
                    <span className={cn("text-xs", darkMode ? "text-purple-300" : "text-purple-700")}>
                      Con Expediente SIGEA
                    </span>
                  </div>
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg",
                    darkMode 
                      ? "bg-indigo-500/20 border border-indigo-500/30" 
                      : "bg-indigo-100 border border-indigo-300"
                  )}>
                    <IconFilter className={cn("w-4 h-4", darkMode ? "text-indigo-400" : "text-indigo-600")} />
                    <span className={cn("text-sm font-bold", darkMode ? "text-white" : "text-indigo-950")}>
                      {filteredPostulantes.length}
                    </span>
                    <span className={cn("text-xs", darkMode ? "text-indigo-300" : "text-indigo-700")}>
                      Mostrando
                    </span>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Search Bar and Filters */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={cn(
              "rounded-2xl shadow-xl p-6 mb-6 backdrop-blur-sm",
              darkMode 
                ? "bg-neutral-800/60 border border-neutral-700/50" 
                : "bg-white/80 border-2 border-blue-200"
            )}
          >
            <div className="flex flex-col md:flex-row gap-4">
              {/* Barra de búsqueda */}
              <div className="relative group flex-1">
                <div className={cn(
                  "absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all",
                  darkMode ? "bg-blue-500/20" : "bg-blue-100",
                  "group-focus-within:scale-110"
                )}>
                  <IconSearch className={cn("w-5 h-5", darkMode ? "text-blue-400" : "text-blue-600")} />
                </div>
                <input
                  type="text"
                  placeholder="🔍 Buscar por nombre, apellidos, DNI, email, teléfono, certificado, CAS, puesto, área o expediente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={cn(
                    "w-full pl-16 pr-6 py-3 rounded-xl border-2 transition-all text-sm",
                    "focus:outline-none focus:ring-4",
                    darkMode 
                      ? "bg-neutral-900/50 border-neutral-700 text-white placeholder-neutral-400 focus:border-blue-500 focus:ring-blue-500/20" 
                      : "bg-white border-blue-200 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-200"
                  )}
                />
              </div>
              
              {/* Filtro de estado */}
              <div className="flex items-center gap-3">
                <IconFilter className={cn("w-5 h-5", darkMode ? "text-blue-400" : "text-blue-600")} />
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value as 'todos' | 'registrados' | 'pendientes' | 'rechazados')}
                  className={cn(
                    "px-4 py-3 rounded-xl border-2 transition-all text-sm font-semibold",
                    "focus:outline-none focus:ring-4",
                    darkMode 
                      ? "bg-neutral-900/50 border-neutral-700 text-white focus:border-blue-500 focus:ring-blue-500/20" 
                      : "bg-white border-blue-200 text-gray-900 focus:border-blue-500 focus:ring-blue-200"
                  )}
                >
                  <option value="todos">Todos</option>
                  <option value="registrados">Registrados</option>
                  <option value="pendientes">Pendientes</option>
                  <option value="rechazados">Rechazados</option>
                </select>
              </div>

              {/* Botón de descargar Excel */}
              <button
                onClick={descargarExcel}
                className={cn(
                  "px-6 py-3 rounded-xl transition-all font-semibold text-sm flex items-center gap-2",
                  "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800",
                  "text-white shadow-md hover:shadow-lg transform hover:scale-105",
                  darkMode 
                    ? "border border-green-500/30" 
                    : ""
                )}
                title="Descargar reporte en Excel"
              >
                <IconDownload className="w-5 h-5" />
                <span className="hidden sm:inline">Descargar Excel</span>
                <span className="sm:hidden">Excel</span>
              </button>
            </div>
          </motion.div>

          {/* Table with enhanced design */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={cn(
              "rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm",
              darkMode 
                ? "bg-neutral-800/60 border border-neutral-700/50" 
                : "bg-white/90 border-2 border-blue-200"
            )}
          >
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className={cn("inline-block animate-spin rounded-full h-12 w-12 border-b-2", darkMode ? "border-blue-400" : "border-blue-600")}></div>
              </div>
            ) : filteredPostulantes.length === 0 ? (
              <div className="text-center py-12">
                <IconUser className={cn("w-16 h-16 mx-auto mb-4", darkMode ? "text-neutral-600" : "text-blue-300")} />
                <p className={cn("text-lg font-semibold", darkMode ? "text-neutral-400" : "text-blue-900")}>
                  {searchTerm ? 'No se encontraron postulantes' : 'No hay postulantes registrados'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={cn(
                    "border-b-2",
                    darkMode 
                      ? "bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 border-blue-500/30" 
                      : "bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 border-blue-300"
                  )}>
                    <tr>
                      <th className={cn("px-4 py-3 text-left text-xs font-bold tracking-wide uppercase", darkMode ? "text-blue-300" : "text-white")}>
                        <div className="flex items-center gap-1.5">
                          <IconCertificate className="w-4 h-4" />
                          ID Certificado
                        </div>
                      </th>
                      <th className={cn("px-4 py-3 text-left text-xs font-bold tracking-wide uppercase", darkMode ? "text-blue-300" : "text-white")}>
                        <div className="flex items-center gap-1.5">
                          <IconUser className="w-4 h-4" />
                          Nombres
                        </div>
                      </th>
                      <th className={cn("px-4 py-3 text-left text-xs font-bold tracking-wide uppercase", darkMode ? "text-blue-300" : "text-white")}>
                        <div className="flex items-center gap-1.5">
                          <IconUser className="w-4 h-4" />
                          Apellidos
                        </div>
                      </th>
                      <th className={cn("px-4 py-3 text-left text-xs font-bold tracking-wide uppercase", darkMode ? "text-blue-300" : "text-white")}>
                        <div className="flex items-center gap-1.5">
                          <IconFileText className="w-4 h-4" />
                          DNI
                        </div>
                      </th>
                      <th className={cn("px-4 py-3 text-left text-xs font-bold tracking-wide uppercase", darkMode ? "text-blue-300" : "text-white")}>
                        <div className="flex items-center gap-1.5">
                          <IconMail className="w-4 h-4" />
                          Email
                        </div>
                      </th>
                      <th className={cn("px-4 py-3 text-left text-xs font-bold tracking-wide uppercase", darkMode ? "text-blue-300" : "text-white")}>
                        <div className="flex items-center gap-1.5">
                          <IconPhone className="w-4 h-4" />
                          Teléfono
                        </div>
                      </th>
                      <th className={cn("px-4 py-3 text-left text-xs font-bold tracking-wide uppercase", darkMode ? "text-blue-300" : "text-white")}>
                        <div className="flex items-center gap-1.5">
                          <IconHash className="w-4 h-4" />
                          N° CAS
                        </div>
                      </th>
                      <th className={cn("px-4 py-3 text-left text-xs font-bold tracking-wide uppercase", darkMode ? "text-blue-300" : "text-white")}>
                        <div className="flex items-center gap-1.5">
                          <IconBriefcase className="w-4 h-4" />
                          Puesto
                        </div>
                      </th>
                      <th className={cn("px-4 py-3 text-left text-xs font-bold tracking-wide uppercase", darkMode ? "text-blue-300" : "text-white")}>
                        <div className="flex items-center gap-1.5">
                          <IconBuilding className="w-4 h-4" />
                          Área
                        </div>
                      </th>
                      <th className={cn("px-4 py-3 text-left text-xs font-bold tracking-wide uppercase", darkMode ? "text-blue-300" : "text-white")}>
                        <div className="flex items-center gap-1.5">
                          <IconFileText className="w-4 h-4" />
                          N° Expediente SIGEA
                        </div>
                      </th>
                      <th className={cn("px-4 py-3 text-center text-xs font-bold tracking-wide uppercase", darkMode ? "text-blue-300" : "text-white")}>
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPostulantes.map((postulante, index) => (
                      <motion.tr 
                        key={postulante.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          "border-b transition-all duration-200 group",
                          darkMode 
                            ? "border-neutral-700/50 hover:bg-neutral-900/40 hover:shadow-lg hover:shadow-blue-500/10" 
                            : "border-blue-100 hover:bg-blue-50 hover:shadow-lg hover:shadow-blue-200/50"
                        )}
                      >
                        <td className={cn("px-4 py-3 text-xs font-mono", darkMode ? "text-blue-300" : "text-blue-700")}>
                          <span className={cn(
                            "px-2 py-0.5 rounded-md text-xs font-semibold",
                            darkMode ? "bg-blue-500/20" : "bg-blue-100"
                          )}>
                            {postulante.certificadoId}
                          </span>
                        </td>
                        <td className={cn("px-4 py-3 text-sm font-semibold", darkMode ? "text-white" : "text-gray-900")}>
                          {postulante.apellidoPaterno && postulante.apellidoMaterno 
                            ? postulante.nombreCompleto
                                .replace(postulante.apellidoPaterno, '')
                                .replace(postulante.apellidoMaterno, '')
                                .trim()
                            : postulante.nombreCompleto.split(' ').slice(0, -2).join(' ') || postulante.nombreCompleto}
                        </td>
                        <td className={cn("px-4 py-3 text-sm font-semibold", darkMode ? "text-white" : "text-gray-900")}>
                          {postulante.apellidoPaterno && postulante.apellidoMaterno 
                            ? `${postulante.apellidoPaterno} ${postulante.apellidoMaterno}`
                            : postulante.nombreCompleto.split(' ').slice(-2).join(' ') || 'N/A'}
                        </td>
                        <td className={cn("px-4 py-3 text-sm font-mono", darkMode ? "text-neutral-300" : "text-gray-700")}>
                          {postulante.dni}
                        </td>
                        <td className={cn("px-4 py-3 text-sm", darkMode ? "text-neutral-300" : "text-gray-700")}>
                          {postulante.email}
                        </td>
                        <td className={cn("px-4 py-3 text-sm", darkMode ? "text-neutral-300" : "text-gray-700")}>
                          {postulante.telefono}
                        </td>
                        <td className={cn("px-4 py-3 text-sm", darkMode ? "text-neutral-300" : "text-gray-700")}>
                          {postulante.numeroCAS}
                        </td>
                        <td className={cn("px-4 py-3 text-sm", darkMode ? "text-neutral-300" : "text-gray-700")}>
                          {postulante.puesto}
                        </td>
                        <td className={cn("px-4 py-3 text-sm", darkMode ? "text-neutral-300" : "text-gray-700")}>
                          {postulante.area}
                        </td>
                        <td className="px-4 py-3">
                          {editandoExpedienteId === postulante.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={expedienteSIGEAEditando}
                                onChange={(e) => setExpedienteSIGEAEditando(e.target.value)}
                                className={cn(
                                  "px-2 py-1 text-xs font-mono rounded-md border-2 focus:outline-none focus:ring-2",
                                  darkMode 
                                    ? "bg-neutral-900 border-blue-500 text-white focus:ring-blue-500/50" 
                                    : "bg-white border-blue-300 text-gray-900 focus:ring-blue-200"
                                )}
                                placeholder="Ingrese número SIGEA"
                                autoFocus
                              />
                              <button
                                onClick={() => handleActualizarExpediente(postulante.id)}
                                disabled={actualizandoExpedienteId === postulante.id}
                                className={cn(
                                  "px-2 py-1 rounded-md text-xs font-semibold transition-all",
                                  "bg-green-600 hover:bg-green-700 text-white",
                                  "disabled:opacity-50 disabled:cursor-not-allowed"
                                )}
                                title="Guardar expediente SIGEA"
                              >
                                {actualizandoExpedienteId === postulante.id ? (
                                  <div className={cn("w-4 h-4 border-2 rounded-full animate-spin", darkMode ? "border-white border-t-transparent" : "border-white border-t-transparent")}></div>
                                ) : (
                                  <IconCheck className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={handleCancelarEdicionExpediente}
                                disabled={actualizandoExpedienteId === postulante.id}
                                className={cn(
                                  "px-2 py-1 rounded-md text-xs font-semibold transition-all",
                                  "bg-red-600 hover:bg-red-700 text-white",
                                  "disabled:opacity-50 disabled:cursor-not-allowed"
                                )}
                                title="Cancelar edición"
                              >
                                <IconX className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-xs font-mono px-2 py-0.5 rounded-md",
                                postulante.expedienteSIGEA 
                                  ? (darkMode ? "bg-green-500/20 text-green-300" : "bg-green-100 text-green-700")
                                  : (darkMode ? "text-neutral-500" : "text-gray-400")
                              )}>
                                {postulante.expedienteSIGEA || '- Sin asignar -'}
                              </span>
                              {/* Solo permitir editar si NO está registrado */}
                              {!(postulante.estado === 'Registrado' || postulante.registrado) && (
                                <button
                                  onClick={() => handleIniciarEdicionExpediente(postulante)}
                                  className={cn(
                                    "px-2 py-1 rounded-md text-xs font-semibold transition-all",
                                    darkMode 
                                      ? "bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30" 
                                      : "bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300"
                                  )}
                                  title="Editar expediente SIGEA"
                                >
                                  Editar
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {postulante.estado === 'Rechazado' ? (
                              <span className={cn(
                                "inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold",
                                darkMode 
                                  ? "bg-red-500/20 text-red-300 border border-red-500/30" 
                                  : "bg-red-100 text-red-700 border border-red-300"
                              )}>
                                ✗ Rechazado
                              </span>
                            ) : postulante.estado === 'Registrado' || postulante.registrado ? (
                              <span className={cn(
                                "inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold",
                                darkMode 
                                  ? "bg-green-500/20 text-green-300 border border-green-500/30" 
                                  : "bg-green-100 text-green-700 border border-green-300"
                              )}>
                                ✓ Registrado
                              </span>
                            ) : registrandoId === postulante.id ? (
                              <div className="flex items-center justify-center">
                                <div className={cn(
                                  "w-5 h-5 border-2 rounded-full animate-spin",
                                  darkMode ? "border-blue-400 border-t-transparent" : "border-blue-500 border-t-transparent"
                                )}></div>
                              </div>
                            ) : rechazandoId === postulante.id ? (
                              <div className="flex items-center justify-center">
                                <div className={cn(
                                  "w-5 h-5 border-2 rounded-full animate-spin",
                                  darkMode ? "border-red-400 border-t-transparent" : "border-red-500 border-t-transparent"
                                )}></div>
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleRegistrarPostulante(postulante)}
                                  disabled={registrandoId !== null || rechazandoId !== null}
                                  className={cn(
                                    "px-4 py-2 rounded-lg transition-all font-semibold text-sm",
                                    "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
                                    "text-white shadow-md hover:shadow-lg transform hover:scale-105",
                                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                  )}
                                  title="Registrar postulante con todos sus datos (ID certificado, nombre, apellidos, DNI, email, teléfono, N° CAS, puesto, área, ID anexos, ID curriculum)"
                                >
                                  Registrar
                                </button>
                                <button
                                  onClick={() => handleRechazarPostulante(postulante)}
                                  disabled={registrandoId !== null || rechazandoId !== null}
                                  className={cn(
                                    "px-4 py-2 rounded-lg transition-all font-semibold text-sm",
                                    "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
                                    "text-white shadow-md hover:shadow-lg transform hover:scale-105",
                                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                  )}
                                  title="Rechazar postulante"
                                >
                                  Rechazar
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>

          {/* Stats Footer */}
          {!loading && filteredPostulantes.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={cn(
                "mt-6 rounded-2xl shadow-xl p-6 backdrop-blur-sm",
                darkMode 
                  ? "bg-gradient-to-r from-neutral-800/60 via-neutral-800/80 to-neutral-800/60 border border-neutral-700/50" 
                  : "bg-gradient-to-r from-blue-50 via-white to-blue-50 border-2 border-blue-200"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    darkMode ? "bg-blue-500/20" : "bg-blue-100"
                  )}>
                    <IconFileText className={cn("w-5 h-5", darkMode ? "text-blue-400" : "text-blue-600")} />
                  </div>
                  <p className={cn("text-sm font-medium", darkMode ? "text-white" : "text-blue-950")}>
                    Mostrando <span className={cn("text-lg font-bold mx-1", darkMode ? "text-blue-400" : "text-blue-600")}>{filteredPostulantes.length}</span> de <span className={cn("text-lg font-bold mx-1", darkMode ? "text-blue-400" : "text-blue-600")}>{postulantes.length}</span> postulantes
                  </p>
                </div>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105 shadow-md",
                      darkMode 
                        ? "bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-red-500/30" 
                        : "bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-red-400/30"
                    )}
                  >
                    Limpiar búsqueda
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Enhanced Notification */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, x: 100, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.8 }}
          className={cn(
            "fixed bottom-6 right-6 px-6 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-4 max-w-md backdrop-blur-lg border-2",
            notification.type === 'success' 
              ? "bg-gradient-to-r from-green-600 to-green-700 text-white border-green-400/50 shadow-green-500/50" 
              : "bg-gradient-to-r from-red-600 to-red-700 text-white border-red-400/50 shadow-red-500/50"
          )}
        >
          <div className="p-2 bg-white/20 rounded-lg">
            {notification.type === 'success' ? (
              <IconCheck className="w-6 h-6" />
            ) : (
              <IconX className="w-6 h-6" />
            )}
          </div>
          <p className="font-semibold text-sm">{notification.message}</p>
          <button 
            onClick={() => setNotification(null)} 
            className="ml-auto p-2 hover:bg-white/20 rounded-lg transition-all hover:scale-110"
          >
            <IconX className="w-5 h-5" />
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default TramitePostulantes;

