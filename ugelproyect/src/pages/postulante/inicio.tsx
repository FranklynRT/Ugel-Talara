import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { IconBriefcase, IconFileText, IconUpload, IconSun, IconMoon, IconArrowLeft, IconMenu2, IconX, IconCertificate, IconUser } from '@tabler/icons-react';
import { UgelTalaraLogo } from '@/components/icons';
import { API_BASE_URL } from '@/lib/api';

// Importa tus componentes de sección
import { ConvocatoriasSection } from '@/pages/postulante/ConvocatoriasSection';
import { AnexosSection } from '@/pages/postulante/AnexosSection';
import CurriculumSection from '@/pages/postulante/CurriculumSection';
import { ProfileSection } from '@/pages/postulante/ProfileSection';
import { AnexosCompletadosView } from '@/pages/postulante/AnexosCompletadosView';

// Importa los componentes de UI
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from '@/components/ui/sidebar';
// Removed: import { Notification } from '@/components/ui/Notification'; // Keep this import

// New Notification Component (reused from previous sections, centralized here)
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
    <div
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
    </div>
  );
};

type PostulacionActionResult = {
  success: boolean;
  message: string;
  type: 'success' | 'error';
  navigate: boolean;
};

const SidebarHeaderContent = ({ darkMode }: { darkMode: boolean }) => { 
    const { open } = useSidebar();
    return (
        <motion.div initial={false} animate={{ opacity: open ? 1 : 0, x: open ? 0 : -10, width: open ? "auto" : 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <h2 className={cn("font-bold text-lg whitespace-nowrap", darkMode ? "text-white" : "text-blue-900")}>UGEL Talara</h2>
            <p className={cn("text-xs whitespace-nowrap", darkMode ? "text-neutral-400" : "text-blue-600")}>Sistema CAS 2025</p>
        </motion.div>
    );
};

// Componente CertificadoGenerator
interface CertificadoGeneratorProps {
  darkMode: boolean;
  cardClasses: string;
  textClasses: string;
  textSecondaryClasses: string;
  authToken?: string | null;
  convocatoriaSeleccionada?: any | null;
}

const CertificadoGenerator: React.FC<CertificadoGeneratorProps> = ({ darkMode, cardClasses, textClasses, textSecondaryClasses, authToken, convocatoriaSeleccionada }) => {
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    dni: '',
    evento: '',
    descripcion: '',
    fecha: new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }),
    certificadoId: '',
    anexoId: '',
    curriculumId: '',
    numeroCAS: '',
    puesto: '',
    area: '',
    idConvocatoria: '',
    userId: '' // Agregar campo para mostrar el ID del usuario
  });
  const [loading, setLoading] = useState(true);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const generarCertificado = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = 1200;
    const height = 848;
    canvas.width = width;
    canvas.height = height;
    
    // Fondo blanco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Borde exterior doble
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, width - 80, height - 80);
    
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 50, width - 100, height - 100);
    
    // Decoración en esquinas
    const drawCorner = (x: number, y: number, flipX: boolean, flipY: boolean) => {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (flipX ? -60 : 60), y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + (flipY ? -60 : 60));
      ctx.stroke();
    };
    
    drawCorner(70, 70, false, false);
    drawCorner(width - 70, 70, true, false);
    drawCorner(70, height - 70, false, true);
    drawCorner(width - 70, height - 70, true, true);
    
    // Encabezado
    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('UGEL TALARA', width / 2, 100);
    
    ctx.fillStyle = '#374151';
    ctx.font = '16px Arial';
    ctx.fillText('Unidad de Gestión Educativa Local Talara', width / 2, 130);
    
    // Título CERTIFICADO
    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 48px Arial';
    ctx.fillText('CERTIFICADO', width / 2, 220);
    
    // Línea decorativa
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 150, 240);
    ctx.lineTo(width / 2 + 150, 240);
    ctx.stroke();
    
    // Texto introductorio
    ctx.fillStyle = '#374151';
    ctx.font = '18px Arial';
    ctx.fillText('La UGEL Talara certifica que', width / 2, 290);
    
    // Nombre completo con nombres y apellidos
    let nombreY = 350;
    
    // Usar nombreCompleto directamente (contiene nombres + apellidos)
    const nombreParaCertificado = (formData.nombreCompleto && formData.nombreCompleto.trim()) 
      ? formData.nombreCompleto.toUpperCase() 
      : 'POSTULANTE';
    
    // Calcular tamaño de fuente según longitud total
    const fontSize = nombreParaCertificado.length > 50 ? 28 : nombreParaCertificado.length > 35 ? 32 : 36;
    
    ctx.fillStyle = '#1e40af';
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(nombreParaCertificado, width / 2, nombreY);
    
    // DNI
    ctx.fillStyle = '#6b7280';
    ctx.font = '16px Arial';
    ctx.fillText(`DNI: ${formData.dni}`, width / 2, nombreY + 40);
    
    // Descripción
    ctx.fillStyle = '#374151';
    ctx.font = '18px Arial';
    const maxWidth = 900;
    const words = formData.descripcion.split(' ');
    let line = '';
    let y = nombreY + 75; // Posición después del DNI
    
    for (let word of words) {
      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line !== '') {
        ctx.fillText(line, width / 2, y);
        line = word + ' ';
        y += 25;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, width / 2, y);
    
    // Evento
    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(formData.evento, width / 2, y + 50);
    
    // Código de Certificado - mostrar código en lugar de QR
    const codigoY = height - 280; // Posición Y del código
    
    // Fecha (antes del código)
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(formData.fecha, width / 2, codigoY - 35);
    
    ctx.fillStyle = '#6b7280';
    ctx.font = '14px Arial';
    ctx.fillText('Fecha de emisión', width / 2, codigoY - 15);
    
    // Código de Certificado (en lugar de QR)
    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Código de Certificado', width / 2, codigoY + 20);
    
    // Dibujar caja alrededor del código - Asegurar que sea lo suficientemente ancha
    const codigoTexto = formData.certificadoId || 'PENDIENTE';
    
    // Medir el texto con la fuente que vamos a usar
    ctx.font = 'bold 20px monospace'; // Fuente más grande para que sea más legible
    const codigoWidth = ctx.measureText(codigoTexto).width;
    const codigoPadding = 30; // Más padding para que no se vea apretado
    const codigoBoxY = codigoY + 35;
    
    // Asegurar un ancho mínimo y máximo razonable
    const minBoxWidth = 400;
    const maxBoxWidth = width - 200; // Dejar margen de 100px a cada lado
    const codigoBoxWidth = Math.max(minBoxWidth, Math.min(maxBoxWidth, codigoWidth + (codigoPadding * 2)));
    const codigoBoxX = width / 2 - (codigoBoxWidth / 2);
    const codigoBoxHeight = 60; // Más alto para acomodar el texto
    
    // Fondo de la caja
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(codigoBoxX, codigoBoxY, codigoBoxWidth, codigoBoxHeight);
    
    // Borde de la caja
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 2;
    ctx.strokeRect(codigoBoxX, codigoBoxY, codigoBoxWidth, codigoBoxHeight);
    
    // Código de certificado - Asegurar que se muestre completo
    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 20px monospace'; // Fuente monospace para que todos los caracteres tengan el mismo ancho
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Si el texto es muy largo, ajustar el tamaño de fuente
    let codigoFontSize = 20;
    let finalCodigoTexto = codigoTexto;
    
    if (codigoWidth > maxBoxWidth - (codigoPadding * 2)) {
      // Si el texto es demasiado largo, reducir el tamaño de fuente
      codigoFontSize = 16;
      ctx.font = `bold ${codigoFontSize}px monospace`;
      const newWidth = ctx.measureText(codigoTexto).width;
      if (newWidth > maxBoxWidth - (codigoPadding * 2)) {
        codigoFontSize = 14;
        ctx.font = `bold ${codigoFontSize}px monospace`;
      }
    } else {
      ctx.font = `bold ${codigoFontSize}px monospace`;
    }
    
    // Dibujar el texto centrado en la caja
    ctx.fillText(finalCodigoTexto, width / 2, codigoBoxY + (codigoBoxHeight / 2));
    
    // IDs del anexo y certificado (debajo del código)
    ctx.fillStyle = '#6b7280';
    ctx.font = '14px Arial'; // Fuente un poco más grande para mejor legibilidad
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic'; // Restablecer baseline
    let idsY = codigoBoxY + codigoBoxHeight + 30;
    
    if (formData.anexoId) {
      const anexoText = `ID Anexo: ${formData.anexoId}`;
      ctx.fillText(anexoText, width / 2, idsY);
      idsY += 20;
    }
    
    // Mostrar el ID del Certificado completo
    const certificadoText = `ID Certificado: ${formData.certificadoId || 'PENDIENTE'}`;
    
    // Si el texto es muy largo, puede que necesite dividirse en múltiples líneas
    const maxTextWidth = width - 200; // Ancho máximo para el texto
    ctx.font = '14px Arial';
    const textMetrics = ctx.measureText(certificadoText);
    
    if (textMetrics.width > maxTextWidth) {
      // Dividir en dos líneas si es necesario
      const prefix = 'ID Certificado: ';
      const certificadoIdOnly = formData.certificadoId || 'PENDIENTE';
      
      ctx.fillText(prefix, width / 2, idsY);
      idsY += 20;
      ctx.font = 'bold 14px monospace'; // Monospace para el ID
      ctx.fillText(certificadoIdOnly, width / 2, idsY);
      ctx.font = '14px Arial'; // Restaurar fuente
    } else {
      ctx.fillText(certificadoText, width / 2, idsY);
    }
    
    // Instrucción para presentar en mesa de partes (debajo del ID del Certificado)
    idsY += 30;
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('Presentar en Mesa de Partes para culminar la postulación', width / 2, idsY);
    
    // Línea separadora footer
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(200, height - 50);
    ctx.lineTo(width - 200, height - 50);
    ctx.stroke();
    
    // Footer
    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('UGEL TALARA', width / 2, height - 30);
    
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px Arial';
    ctx.fillText('Sistema de Contrtacion de Cas de Ugel  Talara | Documento generado electrónicamente', width / 2, height - 12);
  };

  const descargarCertificado = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `certificado_${formData.dni}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Cargar datos del usuario al montar el componente
  React.useEffect(() => {
    const loadUserData = async () => {
      const token = authToken || localStorage.getItem('token');
      
      if (!token) {
        console.warn('⚠️ No hay token disponible para cargar datos del usuario');
        setLoading(false);
        return;
      }
      
      try {
        // Decodificar el token para obtener el ID del usuario
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          console.error('❌ Token inválido: no tiene 3 partes');
          setLoading(false);
          return;
        }
        
        const payload = JSON.parse(atob(tokenParts[1]));
        const decodedUserId = payload?.id || payload?.IDUSUARIO;
        
        if (!decodedUserId) {
          console.error('❌ No se encontró userId en el token:', payload);
          setLoading(false);
          return;
        }

        const numericUserId = Number(decodedUserId);
        if (Number.isNaN(numericUserId)) {
          console.error('❌ El userId obtenido del token no es un número válido:', decodedUserId);
          setLoading(false);
          return;
        }

        
        // Obtener datos del usuario desde el backend
        const response = await fetch(`${API_BASE_URL}/users/${numericUserId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true'
          },
        });
        
        if (!response.ok) {
          console.error('❌ Error al cargar datos del usuario:', response.status, response.statusText);
          setLoading(false);
          return;
        }
        
        const userData = await response.json();
        console.log('✅ Datos del usuario recibidos:', userData);
        
        // Cargar datos del usuario
        const apellidoPaterno = userData.apellidoPaterno || '';
        const apellidoMaterno = userData.apellidoMaterno || '';
        const documento = userData.documento || userData.dni || '';
        
        // Construir nombre completo: nombres + apellidos
        // nombreCompleto de la API contiene todos los nombres (ej: "Franklin Edin")
        let nombreCompleto = '';
        
        if (userData.nombreCompleto && userData.nombreCompleto.trim()) {
          // Combinar nombres completos con apellidos
          const nombresCompletos = userData.nombreCompleto.trim();
          nombreCompleto = `${nombresCompletos} ${apellidoPaterno} ${apellidoMaterno}`.trim();
        } else if (apellidoPaterno || apellidoMaterno) {
          // Si no hay nombreCompleto pero hay apellidos, usar solo apellidos
          nombreCompleto = `${apellidoPaterno} ${apellidoMaterno}`.trim();
        } else {
          // Fallback por defecto
          nombreCompleto = 'Postulante';
        }
        // Obtener datos de anexos para conseguir anexoId
        let evento = 'CONVOCATORIA';
        let descripcion = 'Por su participación como postulante en el proceso de selección del régimen de Contratación Administrativa de Servicios';
        let anexoId = '';
        let curriculumId = '';
        
        // Priorizar la convocatoria seleccionada (si está disponible)
        let convocatoriaParaCertificado = convocatoriaSeleccionada;
        
        // Intentar obtener anexoId desde la tabla consolidada primero (más completa)
        try {
          const anexosCompletosResponse = await fetch(`${API_BASE_URL}/documentos/anexos-completos/usuario/${numericUserId}`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'ngrok-skip-browser-warning': 'true'
            },
          });
          
          if (anexosCompletosResponse.ok) {
            const anexosCompletosData = await anexosCompletosResponse.json();
            const anexosCompletos = Array.isArray(anexosCompletosData) ? anexosCompletosData : [anexosCompletosData];
            
            if (anexosCompletos.length > 0 && anexosCompletos[0] && anexosCompletos[0].IDANEXO) {
              anexoId = `ANEXO-${anexosCompletos[0].IDANEXO}`;
              console.log('✅ ID del anexo obtenido desde tabla consolidada:', anexoId);
              
              // Si no hay convocatoria, intentar obtenerla desde el anexo completo
              if (!convocatoriaParaCertificado && anexosCompletos[0].IDCONVOCATORIA) {
                try {
                  const convocatoriaResponse = await fetch(`${API_BASE_URL}/convocatorias/${anexosCompletos[0].IDCONVOCATORIA}`, {
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`,
                      'ngrok-skip-browser-warning': 'true'
                    },
                  });
                  
                  if (convocatoriaResponse.ok) {
                    const convocatoriaData = await convocatoriaResponse.json();
                    convocatoriaParaCertificado = Array.isArray(convocatoriaData) ? convocatoriaData[0] : convocatoriaData;
                    console.log('✅ Convocatoria cargada desde anexo completo:', convocatoriaParaCertificado);
                  }
                } catch (error) {
                  console.warn('⚠️ Error al cargar convocatoria desde anexo completo:', error);
                }
              }
            }
          }
        } catch (error) {
          console.warn('⚠️ Error al cargar anexos completos (tabla consolidada):', error);
        }
        
        // Si aún no hay anexoId, intentar obtenerlo desde la tabla principal de anexos
        if (!anexoId) {
          try {
            const anexosResponse = await fetch(`${API_BASE_URL}/anexos/${numericUserId}`, {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'ngrok-skip-browser-warning': 'true'
              },
            });
            
            if (anexosResponse.ok) {
              const anexosData = await anexosResponse.json();
              console.log('✅ Datos de anexos recibidos:', anexosData);
              
              // Obtener el último anexo o el primero disponible
              const anexo = Array.isArray(anexosData) ? anexosData[0] : anexosData;
              if (anexo?.IDANEXO) {
                anexoId = `ANEXO-${anexo.IDANEXO}`;
                console.log('✅ ID del anexo obtenido desde tabla principal:', anexoId);
              }
              
              if (!convocatoriaParaCertificado && anexo && anexo.IDCONVOCATORIA) {
                // Obtener datos de la convocatoria desde el anexo
                try {
                  const convocatoriaResponse = await fetch(`${API_BASE_URL}/convocatorias/${anexo.IDCONVOCATORIA}`, {
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`,
                      'ngrok-skip-browser-warning': 'true'
                    },
                  });
                  
                  if (convocatoriaResponse.ok) {
                    const convocatoriaData = await convocatoriaResponse.json();
                    convocatoriaParaCertificado = Array.isArray(convocatoriaData) ? convocatoriaData[0] : convocatoriaData;
                    console.log('✅ Convocatoria cargada desde anexo:', convocatoriaParaCertificado);
                  }
                } catch (error) {
                  console.warn('⚠️ Error al cargar datos de convocatoria desde anexo:', error);
                }
              }
            }
          } catch (error) {
            console.warn('⚠️ Error al cargar datos de anexos:', error);
          }
        }
        
        // Si aún no hay convocatoria, intentar obtenerla del localStorage
        if (!convocatoriaParaCertificado) {
          const convocatoriaIdFromStorage = localStorage.getItem('currentConvocatoriaId');
          if (convocatoriaIdFromStorage) {
            try {
              const convocatoriaResponse = await fetch(`${API_BASE_URL}/convocatorias/${convocatoriaIdFromStorage}`, {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                  'ngrok-skip-browser-warning': 'true'
                },
              });
              
              if (convocatoriaResponse.ok) {
                const convocatoriaData = await convocatoriaResponse.json();
                convocatoriaParaCertificado = Array.isArray(convocatoriaData) ? convocatoriaData[0] : convocatoriaData;
                console.log('✅ Convocatoria cargada desde API por ID:', convocatoriaParaCertificado);
              }
            } catch (error) {
              console.warn('⚠️ Error al cargar convocatoria desde localStorage:', error);
            }
          }
        }
        
        // Procesar la convocatoria para obtener evento y descripción
        let numeroCAS = '';
        let puesto = '';
        let area = '';
        let idConvocatoria = '';
        
        console.log('📋 convocatoriaParaCertificado:', convocatoriaParaCertificado);
        console.log('📋 convocatoriaSeleccionada:', convocatoriaSeleccionada);
        
        if (convocatoriaParaCertificado) {
          // Construir nombre de la convocatoria con número CAS
          // La API devuelve: numeroCAS, IDCONVOCATORIA, area, puesto
          numeroCAS = convocatoriaParaCertificado.numeroCAS 
            || convocatoriaParaCertificado.numeroCas 
            || convocatoriaParaCertificado.numero_cas 
            || '';
          
          // Extraer y validar ID de convocatoria (evitar null, undefined, "NULL", etc.)
          const rawIdConvocatoria = convocatoriaParaCertificado.IDCONVOCATORIA 
            || convocatoriaParaCertificado.id
            || null;
          
          // Validar que el ID sea válido (no null, undefined, "NULL", o string vacío)
          if (rawIdConvocatoria !== null 
              && rawIdConvocatoria !== undefined 
              && rawIdConvocatoria !== '' 
              && String(rawIdConvocatoria).trim().toUpperCase() !== 'NULL') {
            idConvocatoria = String(rawIdConvocatoria).trim();
          } else {
            idConvocatoria = '';
          }
          
          puesto = convocatoriaParaCertificado.puesto || '';
          area = convocatoriaParaCertificado.area || '';
          
          console.log('📊 Datos extraídos de convocatoria:', {
            numeroCAS,
            idConvocatoria: idConvocatoria || 'NO DISPONIBLE',
            puesto,
            area,
            rawIdConvocatoria: rawIdConvocatoria,
            todasLasKeys: Object.keys(convocatoriaParaCertificado),
            objetoCompleto: convocatoriaParaCertificado
          });
          
          // Evento: CONVOCATORIA CAS {número}
          if (numeroCAS && numeroCAS.trim() !== '') {
            // Verificar si numeroCAS ya contiene "CAS" para evitar duplicación
            const numeroCASLimpio = numeroCAS.trim();
            if (numeroCASLimpio.toUpperCase().includes('CAS')) {
              evento = `CONVOCATORIA ${numeroCASLimpio}`;
            } else {
              evento = `CONVOCATORIA CAS ${numeroCASLimpio}`;
            }
          } else if (idConvocatoria && idConvocatoria.toString().trim() !== '') {
            evento = `CONVOCATORIA CAS N° ${idConvocatoria}-${new Date().getFullYear()}`;
          }
          
          // Descripción: Área y Puesto
          const partesDescripcion = [];
          if (area && area.trim() !== '') {
            partesDescripcion.push(`Área: ${area}`);
          }
          if (puesto && puesto.trim() !== '') {
            partesDescripcion.push(`Puesto: ${puesto}`);
          }
          
          if (partesDescripcion.length > 0) {
            descripcion = partesDescripcion.join(' | ');
          } else {
            descripcion = 'Por su participación como postulante en el proceso de selección del régimen de Contratación Administrativa de Servicios';
          }
          
          console.log('✅ Evento y descripción finales:', { evento, descripcion });
        } else {
          console.warn('⚠️ No se encontró convocatoria para el certificado');
          // Intentar obtener desde localStorage como último recurso
          const convocatoriaStorage = localStorage.getItem('convocatoriaSeleccionada');
          if (convocatoriaStorage) {
            try {
              const convocatoriaFromStorage = JSON.parse(convocatoriaStorage);
              console.log('📋 Convocatoria desde localStorage:', convocatoriaFromStorage);
              
              numeroCAS = convocatoriaFromStorage.numeroCAS 
                || convocatoriaFromStorage.numeroCas 
                || convocatoriaFromStorage.numero_cas 
                || '';
              
              // Extraer y validar ID de convocatoria desde localStorage
              const rawIdConvocatoriaStorage = convocatoriaFromStorage.IDCONVOCATORIA 
                || convocatoriaFromStorage.id
                || null;
              
              // Validar que el ID sea válido (no null, undefined, "NULL", o string vacío)
              if (rawIdConvocatoriaStorage !== null 
                  && rawIdConvocatoriaStorage !== undefined 
                  && rawIdConvocatoriaStorage !== '' 
                  && String(rawIdConvocatoriaStorage).trim().toUpperCase() !== 'NULL') {
                idConvocatoria = String(rawIdConvocatoriaStorage).trim();
              } else {
                idConvocatoria = '';
              }
              
              puesto = convocatoriaFromStorage.puesto || '';
              area = convocatoriaFromStorage.area || '';
              
              if (numeroCAS && numeroCAS.trim() !== '') {
                // Verificar si numeroCAS ya contiene "CAS" para evitar duplicación
                const numeroCASLimpio = numeroCAS.trim();
                if (numeroCASLimpio.toUpperCase().includes('CAS')) {
                  evento = `CONVOCATORIA ${numeroCASLimpio}`;
                } else {
                  evento = `CONVOCATORIA CAS ${numeroCASLimpio}`;
                }
              }
              
              const partesDescripcion = [];
              if (area && area.trim() !== '') {
                partesDescripcion.push(`Área: ${area}`);
              }
              if (puesto && puesto.trim() !== '') {
                partesDescripcion.push(`Puesto: ${puesto}`);
              }
              
              if (partesDescripcion.length > 0) {
                descripcion = partesDescripcion.join(' | ');
              }
            } catch (e) {
              console.warn('⚠️ Error al parsear convocatoria desde localStorage:', e);
            }
          }
        }

        // Obtener ID del curriculum
        try {
          const curriculumResponse = await fetch(`${API_BASE_URL}/documentos/curriculum`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'ngrok-skip-browser-warning': 'true'
            },
          });
          
          if (curriculumResponse.ok) {
            const curriculumData = await curriculumResponse.json();
            console.log('✅ Datos de curriculum recibidos:', curriculumData);
            
            const curriculum = Array.isArray(curriculumData) ? curriculumData[0] : curriculumData;
            if (curriculum?.IDCURRICULUM) {
              curriculumId = `CURRICULUM-${curriculum.IDCURRICULUM}`;
              console.log('✅ ID del curriculum obtenido:', curriculumId);
            } else {
              console.warn('⚠️ No se encontró IDCURRICULUM en los datos:', curriculum);
            }
          }
        } catch (error) {
          console.warn('⚠️ Error al cargar datos de curriculum:', error);
        }
        
        // Generar ID único del certificado después de obtener todos los datos
        // Formato: CERT-{userId}-{convocatoriaId}-{año}-{timestamp completo}
        const año = new Date().getFullYear();
        const timestamp = Date.now(); // Timestamp completo en milisegundos
        let certificadoId = '';
        
        // Validar que el userId esté disponible
        if (!numericUserId || Number.isNaN(numericUserId)) {
          console.error('❌ Error: No se puede generar el certificado sin un ID de usuario válido');
          setLoading(false);
          return;
        }
        
        // Validar y limpiar el ID de convocatoria (evitar "NULL", null, undefined, o strings vacíos)
        const convocatoriaIdValido = idConvocatoria 
          && idConvocatoria.toString().trim() !== '' 
          && idConvocatoria.toString().toUpperCase() !== 'NULL'
          && idConvocatoria !== null
          && idConvocatoria !== undefined
          ? idConvocatoria.toString().trim() 
          : null;
        
        if (convocatoriaIdValido) {
          // Si tenemos ID de convocatoria válido, incluirla en el ID del certificado
          // Formato: CERT-{userId}-{convocatoriaId}-{año}-{timestamp completo}
          certificadoId = `CERT-${numericUserId}-${convocatoriaIdValido}-${año}-${timestamp}`;
        } else {
          // Si no hay ID de convocatoria válido, usar formato alternativo sin convocatoria
          certificadoId = `CERT-${numericUserId}-${año}-${timestamp}`;
        }
        
        console.log('✅ ID del certificado generado:', certificadoId);
        console.log('📋 Detalles de generación:', {
          userId: numericUserId,
          convocatoriaId: convocatoriaIdValido || 'NO DISPONIBLE',
          año,
          timestamp,
          certificadoId
        });
        
        // Log final de todos los IDs obtenidos
        console.log('📋 Resumen de IDs obtenidos:', {
          userId: numericUserId,
          anexoId,
          curriculumId,
          certificadoId,
          idConvocatoria: idConvocatoria || 'NO DISPONIBLE',
          idConvocatoriaValido: convocatoriaIdValido || 'NO DISPONIBLE'
        });
        
        setFormData(prev => ({
          ...prev,
          nombreCompleto: nombreCompleto, // Nombre completo con nombres y apellidos
          apellidoPaterno: apellidoPaterno,
          apellidoMaterno: apellidoMaterno,
          dni: documento,
          evento: evento,
          descripcion: descripcion,
          certificadoId: certificadoId, // ID del certificado con formato: CERT-{userId}-{convocatoriaId}-{año}-{timestamp}
          anexoId: anexoId,
          curriculumId: curriculumId,
          numeroCAS: numeroCAS,
          puesto: puesto,
          area: area,
          idConvocatoria: idConvocatoria || '',
          userId: numericUserId.toString(), // Guardar el ID del usuario para mostrar en el formulario
          fecha: new Date().toLocaleDateString('es-PE', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })
        }));
        
        console.log('✅ FormData actualizado:', {
          userId: numericUserId,
          nombreCompleto: nombreCompleto,
          apellidoPaterno,
          apellidoMaterno,
          documento,
          certificadoId: certificadoId,
          idConvocatoria: idConvocatoria || 'NO DISPONIBLE',
          convocatoriaIdValido: convocatoriaIdValido || 'NO DISPONIBLE'
        });
        
        console.log('🔍 VERIFICACIÓN FINAL DEL CERTIFICADO:', {
          'ID Usuario': numericUserId,
          'ID Convocatoria Original': idConvocatoria || 'NO DISPONIBLE',
          'ID Convocatoria Validado': convocatoriaIdValido || 'NO DISPONIBLE',
          'ID Certificado Generado': certificadoId,
          'Formato Certificado': convocatoriaIdValido 
            ? `CERT-${numericUserId}-${convocatoriaIdValido}-${año}-${timestamp}`
            : `CERT-${numericUserId}-${año}-${timestamp}-[RANDOM]`
        });
        
        setLoading(false);
      } catch (error) {
        console.error('❌ Error al cargar datos del usuario:', error);
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [authToken]);

  React.useEffect(() => {
    if (!loading && formData.nombreCompleto) {
      generarCertificado().catch(console.error);
    }
  }, [formData, loading]);

  if (loading) {
    return (
      <div className={cn("w-full flex items-center justify-center min-h-[400px]", darkMode ? "text-white" : "text-gray-800")}>
        <div className="text-center">
          <div className={cn("inline-block animate-spin rounded-full h-12 w-12 border-b-2 mb-4", darkMode ? "border-blue-400" : "border-blue-600")}></div>
          <p className={cn("text-lg", textSecondaryClasses)}>Cargando datos del postulante...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", darkMode ? "text-white" : "text-gray-800")}>
      <div className={cn("rounded-xl shadow-lg p-6 mb-6", cardClasses)}>
        <div className="flex items-center gap-3 mb-6">
          <IconCertificate className={cn("w-8 h-8", darkMode ? "text-blue-400" : "text-blue-600")} />
          <h2 className={cn("text-2xl font-bold", textClasses)}>Generador de Certificados</h2>
        </div>
        <p className={cn("mb-6", textSecondaryClasses)}>UGEL Talara - Sistema CAS 2025</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario */}
        <div className={cn("rounded-xl shadow-lg p-6", cardClasses)}>
          <div className="flex items-center gap-2 mb-6">
            <IconFileText className={cn("w-6 h-6", darkMode ? "text-blue-400" : "text-blue-600")} />
            <h3 className={cn("text-xl font-bold", textClasses)}>Datos del Certificado</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className={cn("block text-sm font-semibold mb-2", textSecondaryClasses)}>
                Nombre Completo
              </label>
              <input
                type="text"
                name="nombreCompleto"
                value={formData.nombreCompleto}
                readOnly
                className={cn(
                  "w-full px-4 py-2 rounded-lg cursor-not-allowed",
                  darkMode 
                    ? "bg-neutral-800/50 border border-neutral-700 text-neutral-300" 
                    : "bg-gray-100 border border-gray-300 text-gray-700"
                )}
              />
            </div>
            <div>
              <label className={cn("block text-sm font-semibold mb-2", textSecondaryClasses)}>
                DNI
              </label>
              <input
                type="text"
                name="dni"
                value={formData.dni}
                readOnly
                className={cn(
                  "w-full px-4 py-2 rounded-lg cursor-not-allowed",
                  darkMode 
                    ? "bg-neutral-800/50 border border-neutral-700 text-neutral-300" 
                    : "bg-gray-100 border border-gray-300 text-gray-700"
                )}
              />
            </div>

            <div>
              <label className={cn("block text-sm font-semibold mb-2", textSecondaryClasses)}>
                Evento / Convocatoria
              </label>
              <input
                type="text"
                name="evento"
                value={formData.evento}
                readOnly
                className={cn(
                  "w-full px-4 py-2 rounded-lg cursor-not-allowed",
                  darkMode 
                    ? "bg-neutral-800/50 border border-neutral-700 text-neutral-300" 
                    : "bg-gray-100 border border-gray-300 text-gray-700"
                )}
              />
            </div>

            <div>
              <label className={cn("block text-sm font-semibold mb-2", textSecondaryClasses)}>
                Descripción
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                readOnly
                rows={3}
                className={cn(
                  "w-full px-4 py-2 rounded-lg cursor-not-allowed resize-none",
                  darkMode 
                    ? "bg-neutral-800/50 border border-neutral-700 text-neutral-300" 
                    : "bg-gray-100 border border-gray-300 text-gray-700"
                )}
              />
            </div>

            <div>
              <label className={cn("block text-sm font-semibold mb-2", textSecondaryClasses)}>
                Fecha de Emisión
              </label>
              <input
                type="text"
                name="fecha"
                value={formData.fecha}
                readOnly
                className={cn(
                  "w-full px-4 py-2 rounded-lg cursor-not-allowed",
                  darkMode 
                    ? "bg-neutral-800/50 border border-neutral-700 text-neutral-300" 
                    : "bg-gray-100 border border-gray-300 text-gray-700"
                )}
              />
            </div>

            <div>
              <label className={cn("block text-sm font-semibold mb-2", textSecondaryClasses)}>
                ID del Certificado
              </label>
              <input
                type="text"
                name="certificadoId"
                value={formData.certificadoId || 'Generando...'}
                readOnly
                className={cn(
                  "w-full px-4 py-3 rounded-lg cursor-not-allowed font-mono text-base",
                  darkMode 
                    ? "bg-blue-900/40 border-2 border-blue-600 text-blue-200 font-bold shadow-lg" 
                    : "bg-blue-50 border-2 border-blue-500 text-blue-800 font-bold shadow-md"
                )}
              />
              <div className="mt-2 space-y-1">
                <p className={cn("text-xs font-medium", textSecondaryClasses)}>
                  Formato: CERT-{formData.userId || '[ID]'}-{formData.idConvocatoria ? `[Convocatoria]-[Año]-[Timestamp]` : '[Año]-[Timestamp]-[Random]'}
                </p>
                {formData.certificadoId && (
                  <div className={cn("text-xs p-2 rounded", darkMode ? "bg-green-900/20 text-green-300" : "bg-green-50 text-green-700")}>
                    ✓ Certificado generado correctamente
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={descargarCertificado}
              className={cn(
                "w-full font-bold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2 shadow-lg",
                darkMode
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              )}
            >
              <IconCertificate className="w-5 h-5" />
              Descargar Certificado
            </button>
          </div>
        </div>

        {/* Vista previa */}
        <div className={cn("rounded-xl shadow-lg p-6", cardClasses)}>
          <h3 className={cn("text-xl font-bold mb-4", textClasses)}>Vista Previa</h3>
          <div className={cn("border-4 rounded-lg overflow-hidden", darkMode ? "border-neutral-700" : "border-gray-200")}>
            <canvas
              ref={canvasRef}
              className="w-full h-auto"
              style={{ maxHeight: '600px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const InicioPostulante = () => {
  const [activeSection, setActiveSection] = useState('perfil');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Inicializar el tema basado en localStorage para evitar flash de tema incorrecto
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('postulante-theme');
      return savedTheme === 'dark';
    }
    return false; // Valor por defecto para SSR
  });
  const [convocatoriaSeleccionada, setConvocatoriaSeleccionada] = useState<any>(null);
  const [convocatoriasPostuladas, setConvocatoriasPostuladas] = useState<any[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [anexosCompletados, setAnexosCompletados] = useState(false);
  const [, setCurriculumSubido] = useState(false);

  const fetchPostulaciones = React.useCallback(
    async (tokenValue: string, usuarioId: number) => {
      try {
        const response = await fetch(`${API_BASE_URL}/postulaciones/usuario/${usuarioId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenValue}`,
            'ngrok-skip-browser-warning': 'true',
          },
        });

        if (!response.ok) {
          const stored = localStorage.getItem('convocatoriasPostuladas');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              setConvocatoriasPostuladas(parsed);
            }
          }
          console.warn('⚠️ No se pudieron obtener las postulaciones desde la API:', response.statusText);
          return;
        }

        const data = await response.json();
        const listado = Array.isArray(data?.data) ? data.data : [];
        setConvocatoriasPostuladas(listado);
        localStorage.setItem('convocatoriasPostuladas', JSON.stringify(listado));
      } catch (error) {
        console.warn('⚠️ Error al obtener postulaciones:', error);
        try {
          const stored = localStorage.getItem('convocatoriasPostuladas');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              setConvocatoriasPostuladas(parsed);
            }
          }
        } catch (storageError) {
          console.warn('⚠️ Tampoco se pudieron cargar postulaciones desde localStorage:', storageError);
        }
      }
    },
    []
  );

  useEffect(() => {
    const tokenValue = authToken || localStorage.getItem('token');
    if (!tokenValue || userId === null || Number.isNaN(userId)) {
      return;
    }
    fetchPostulaciones(tokenValue, userId).catch((error) => {
      console.warn('⚠️ Error inesperado al sincronizar postulaciones:', error);
    });
  }, [authToken, userId, fetchPostulaciones]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthToken(token);
    }
    
    // Aplicar el tema inicial al documento
    const savedTheme = localStorage.getItem('postulante-theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      // Si no hay tema guardado, establecer el tema claro por defecto
      if (!savedTheme) {
        localStorage.setItem('postulante-theme', 'light');
      }
    }
    
    // Inicializar el sidebar como abierto en desktop
    if (window.innerWidth >= 768) {
      setSidebarOpen(true);
    }
  }, []);
  
  useEffect(() => {
    const tokenValue = authToken || localStorage.getItem('token');

    if (!tokenValue) {
      setUserId(null);
      return;
    }

    try {
      const tokenParts = tokenValue.split('.');
      if (tokenParts.length !== 3) {
        setUserId(null);
        return;
      }

      const payload = JSON.parse(atob(tokenParts[1]));
      const decodedId = payload?.id || payload?.IDUSUARIO;
      const numericId = Number(decodedId);

      if (Number.isNaN(numericId)) {
        setUserId(null);
        return;
      }

      setUserId(numericId);
    } catch (error) {
      console.warn('⚠️ No se pudo decodificar el token para obtener el ID del usuario:', error);
      setUserId(null);
    }
  }, [authToken]);

  // Guardar el tema cuando cambie y aplicar inmediatamente
  useEffect(() => {
    localStorage.setItem('postulante-theme', darkMode ? 'dark' : 'light');
    // Aplicar el tema al documento para asegurar persistencia
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
      }, 5000); // Hide after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Verificar si el usuario ya completó los anexos
  useEffect(() => {
    const verificarAnexosCompletados = async () => {
      const token = authToken || localStorage.getItem('token');
      
      if (!token) {
        return;
      }

      try {
        // Decodificar el token para obtener el ID del usuario
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          return;
        }
        
        const payload = JSON.parse(atob(tokenParts[1]));
        const userId = payload?.id || payload?.IDUSUARIO;
        
        if (!userId) {
          return;
        }

        // Primero intentar verificar en la tabla consolidada (más completa)
        try {
          const responseCompletos = await fetch(`${API_BASE_URL}/documentos/anexos-completos/usuario/${userId}`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'ngrok-skip-browser-warning': 'true'
            },
          });

          if (responseCompletos.ok) {
            const anexosCompletosData = await responseCompletos.json();
            const anexosCompletos = Array.isArray(anexosCompletosData) ? anexosCompletosData : [anexosCompletosData];
            
            // Si hay al menos un anexo completo, significa que ya completó
            if (anexosCompletos.length > 0 && anexosCompletos[0] && anexosCompletos[0].IDANEXO) {
              setAnexosCompletados(true);
              console.log('✅ Usuario ya completó los anexos (tabla consolidada)');
              return; // Salir si encontramos anexos completos
            }
          }
        } catch (errorCompletos) {
          console.warn('⚠️ Error al verificar anexos completos (tabla consolidada):', errorCompletos);
          // Continuar con la verificación alternativa
        }

        // Verificación alternativa: verificar en la tabla principal de anexos
        const response = await fetch(`${API_BASE_URL}/documentos/anexos-completos`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true'
          },
        });

        if (response.ok) {
          const anexosData = await response.json();
          const anexos = Array.isArray(anexosData) ? anexosData : [anexosData];
          
          // Si hay al menos un anexo, significa que ya completó
          if (anexos.length > 0 && anexos[0] && anexos[0].IDANEXO) {
            setAnexosCompletados(true);
            console.log('✅ Usuario ya completó los anexos (tabla principal)');
          } else {
            setAnexosCompletados(false);
            console.log('ℹ️ Usuario aún no ha completado ningún anexo');
          }
        }
      } catch (error) {
        console.warn('⚠️ Error al verificar anexos completados:', error);
      }
    };

    if (authToken) {
      verificarAnexosCompletados();
    }
  }, [authToken]);

  // Verificar si el usuario ya tiene curriculum subido
  useEffect(() => {
    const verificarCurriculumSubido = async () => {
      const token = authToken || localStorage.getItem('token');
      
      if (!token) {
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/documentos/has-curriculum`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true'
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCurriculumSubido(data.hasCurriculum || false);
          console.log('✅ Estado del curriculum:', data.hasCurriculum ? 'Subido' : 'No subido');
        }
      } catch (error) {
        console.warn('⚠️ Error al verificar curriculum subido:', error);
      }
    };

    if (authToken) {
      verificarCurriculumSubido();
    }
  }, [authToken]);

  // --- LÓGICA DE NAVEGACIÓN Y SELECCIÓN ---
  const handleSectionChange = (newSection: string, force?: boolean | { state?: any }) => {
    // Si force es un objeto (opciones de navegación), extraer solo la sección
    let shouldForce = false;
    if (typeof force === 'boolean') {
      shouldForce = force;
    } else if (force?.state?.anexosCompletados) {
      setAnexosCompletados(true);
    }
    
    if (activeSection !== newSection) {
      // Bloquear SIEMPRE el acceso al certificado desde el sidebar (solo se puede acceder mediante navegación forzada)
      if (newSection === 'certificado' && !shouldForce) {
        setNotification({ 
          message: 'El acceso al certificado está bloqueado.', 
          type: 'error' 
        });
        return;
      }
      
      // Si va a anexos y ya están completados, mostrar notificación informativa pero permitir ver
      if (newSection === 'anexos' && anexosCompletados) {
        setNotification({ 
          message: 'Tus anexos ya están completados. Puedes verlos aquí pero no editarlos.', 
          type: 'success' 
        });
      }
      
      // Cambiar de sección inmediatamente sin animación
      setActiveSection(newSection);
    }
  };

  const handleSelectConvocatoria = async (dataDeConvocatoria: any): Promise<PostulacionActionResult> => {
    const selectedId = dataDeConvocatoria?.IDCONVOCATORIA ?? dataDeConvocatoria?.id;
    const normalizedId = selectedId !== undefined && selectedId !== null ? String(selectedId) : '';

    if (!normalizedId) {
      return {
        success: false,
        message: 'No se pudo identificar la convocatoria seleccionada. Intenta nuevamente.',
        type: 'error',
        navigate: false,
      };
    }

    const numericConvocatoriaId = Number(normalizedId);
    if (Number.isNaN(numericConvocatoriaId)) {
      return {
        success: false,
        message: 'El identificador de la convocatoria no es válido.',
        type: 'error',
        navigate: false,
      };
    }

    const tokenValue = authToken || localStorage.getItem('token');
    if (!tokenValue) {
      return {
        success: false,
        message: 'Debes iniciar sesión para postular a una convocatoria.',
        type: 'error',
        navigate: false,
      };
    }

    let effectiveUserId = userId;
    if (effectiveUserId === null || Number.isNaN(effectiveUserId)) {
      try {
        const tokenParts = tokenValue.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const decodedId = payload?.id || payload?.IDUSUARIO;
          const numericId = Number(decodedId);
          if (!Number.isNaN(numericId)) {
            effectiveUserId = numericId;
            setUserId(numericId);
          }
        }
      } catch (error) {
        console.warn('⚠️ No se pudo decodificar el token para obtener el ID del usuario:', error);
      }
    }

    if (effectiveUserId === null || Number.isNaN(effectiveUserId)) {
      return {
        success: false,
        message: 'No se pudo identificar al postulante. Intenta cerrar sesión y volver a ingresar.',
        type: 'error',
        navigate: false,
      };
    }

    const alreadyPostulated = convocatoriasPostuladas.some((conv) => {
      const convId = conv?.IDCONVOCATORIA ?? conv?.id ?? conv?.idConvocatoria;
      return String(convId) === normalizedId;
    });

    const activePostulaciones = convocatoriasPostuladas.filter(
      (conv) => (conv?.estado ?? 'registrada') === 'registrada'
    );

    let result: PostulacionActionResult = {
      success: true,
      message: '',
      type: 'success',
      navigate: false,
    };

    if (alreadyPostulated) {
      await fetchPostulaciones(tokenValue, effectiveUserId);
      result = {
        success: false,
        message: 'Ya te encuentras registrado en esta convocatoria.',
        type: 'error',
        navigate: false,
      };
    } else if (activePostulaciones.length >= 2) {
      await fetchPostulaciones(tokenValue, effectiveUserId);
      result = {
        success: false,
        message: 'Solo puedes postular a un máximo de dos convocatorias activas.',
        type: 'error',
        navigate: false,
      };
    } else {
      try {
        const response = await fetch(`${API_BASE_URL}/postulaciones`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenValue}`,
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify({
            idUsuario: effectiveUserId,
            idConvocatoria: numericConvocatoriaId,
          }),
        });

        if (response.ok) {
          result = {
            success: true,
            message: `Te has inscrito a la convocatoria: ${dataDeConvocatoria.puesto ?? 'Convocatoria seleccionada'}.`,
            type: 'success',
            navigate: true,
          };
          await fetchPostulaciones(tokenValue, effectiveUserId);
        } else {
          const errorData = await response.json().catch(() => null);
          result = {
            success: false,
            message: errorData?.message || 'No se pudo registrar la postulación.',
            type: 'error',
            navigate: false,
          };
        }
      } catch (error) {
        console.error('❌ Error al registrar postulación:', error);
        result = {
          success: false,
          message: 'Ocurrió un error al registrar la postulación. Inténtalo nuevamente.',
          type: 'error',
          navigate: false,
        };
      }
    }

    if (result.navigate) {
      setConvocatoriaSeleccionada(dataDeConvocatoria);

      localStorage.setItem('convocatoriaSeleccionada', JSON.stringify(dataDeConvocatoria));
      const convocatoriaIdToPersist =
        dataDeConvocatoria?.id ?? dataDeConvocatoria?.IDCONVOCATORIA ?? dataDeConvocatoria?.idConvocatoria;
      if (convocatoriaIdToPersist !== undefined && convocatoriaIdToPersist !== null) {
        localStorage.setItem('currentConvocatoriaId', String(convocatoriaIdToPersist));
      }

      console.log('✅ Convocatoria seleccionada y guardada:', dataDeConvocatoria);

      if (anexosCompletados) {
        result = {
          ...result,
          message: `${result.message} Tus datos guardados se cargarán automáticamente.`.trim(),
        };
      }

      handleSectionChange('anexos');
    }

    return result;
  };

  const handleLogout = async () => {
    try {
      // Clear all authentication data immediately
      localStorage.removeItem('token');
      localStorage.removeItem('userName');
      localStorage.removeItem('userProfilePicture');
      localStorage.removeItem('userProfileData');
      localStorage.removeItem('postulante-theme'); // También limpiar el tema
      
      // Clear component state
      setAuthToken(null);
      setConvocatoriaSeleccionada(null);
      
      // Redirect to login page immediately
      window.location.href = '/';
      
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if there's an error, try to redirect
      window.location.href = '/';
    }
  };

  const sidebarLinks = [
    { label: "Perfil", key: 'perfil', icon: <IconUser className="w-5 h-5" /> },
    { label: "Convocatorias", key: 'convocatorias', icon: <IconBriefcase className="w-5 h-5" /> },
    { label: "Anexos", key: 'anexos', icon: <IconFileText className="w-5 h-5" /> },
    { label: "Curriculum", key: 'curriculum', icon: <IconUpload className="w-5 h-5" /> },
    { label: "Certificado", key: 'certificado', icon: <IconCertificate className="w-5 h-5" /> }
  ];

  const commonProps = {
    cardClasses: darkMode ? "bg-neutral-800/50 border border-neutral-700/50" : "bg-white border-2 border-blue-500 shadow-lg",
    textClasses: darkMode ? "text-slate-100" : "text-blue-950 font-semibold",
    textSecondaryClasses: darkMode ? "text-slate-300" : "text-blue-900 font-medium",
    darkMode: darkMode,
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'perfil':
        return <ProfileSection 
                 authToken={authToken || localStorage.getItem('token')} 
                 navigate={handleSectionChange}
                 {...commonProps} 
               />;
      case 'convocatorias':
        return <ConvocatoriasSection onSelectConvocatoria={handleSelectConvocatoria} {...commonProps} />;
      case 'curriculum':
        return <CurriculumSection 
                 authToken={authToken} 
                 onUploadSuccess={async () => {
                   // Verificar nuevamente el estado del curriculum desde el backend
                   const token = authToken || localStorage.getItem('token');
                   if (token) {
                    try {
                      const response = await fetch(`${API_BASE_URL}/documentos/has-curriculum`, {
                         headers: {
                           'Content-Type': 'application/json',
                           'Authorization': `Bearer ${token}`,
                           'ngrok-skip-browser-warning': 'true'
                         },
                       });
                       
                       if (response.ok) {
                         const data = await response.json();
                         setCurriculumSubido(data.hasCurriculum || false);
                         console.log('✅ Estado del curriculum actualizado:', data.hasCurriculum ? 'Subido' : 'No subido');
                       }
                     } catch (error) {
                       console.warn('⚠️ Error al verificar curriculum después de subir:', error);
                       // Aún así marcar como subido si la verificación falla
                       setCurriculumSubido(true);
                     }
                   } else {
                     // Si no hay token, marcar como subido de todas formas
                     setCurriculumSubido(true);
                   }
                   
                   // Después de subir el curriculum, redirigir automáticamente a la sección de certificados
                   setNotification({ 
                     message: 'Curriculum subido exitosamente. Redirigiendo a certificados...', 
                     type: 'success' 
                   });
                   // Pequeño delay para que el usuario vea el mensaje
                   setTimeout(() => {
                     handleSectionChange('certificado', true); // Forzar navegación después de subir
                   }, 500);
                 }} 
                 {...commonProps} 
               />;
      case 'anexos':
        if (anexosCompletados) {
          // Mostrar vista de anexos completados con todos los datos
          return <AnexosCompletadosView 
            authToken={authToken || localStorage.getItem('token')} 
            onEditAnexo={(anexo) => {
              // Guardar el anexo en localStorage para cargarlo después
              localStorage.setItem('anexoToEdit', JSON.stringify(anexo));
              // Cambiar a modo edición (no completados) y redirigir a anexos
              setAnexosCompletados(false);
              handleSectionChange('anexos', true);
            }}
            {...commonProps} 
          />;
        }
        return <AnexosSection 
                   convocatoriaSeleccionada={convocatoriaSeleccionada}
                   navigate={(section: string, options?: { state?: any }) => {
                     handleSectionChange(section, options);
                   }}
                   authToken={authToken || localStorage.getItem('token')} // Use state or fallback to localStorage
                   {...commonProps} 
               />;
      case 'certificado':
        return <CertificadoGenerator 
                 {...commonProps} 
                 authToken={authToken || localStorage.getItem('token')} 
                 convocatoriaSeleccionada={convocatoriaSeleccionada}
               />;
      default:
        return <AnexosSection 
                   convocatoriaSeleccionada={convocatoriaSeleccionada}
                   navigate={handleSectionChange} // Pass handleSectionChange as navigate prop
                   authToken={authToken || localStorage.getItem('token')} // Use state or fallback to localStorage
                   {...commonProps} 
               />;
    }
  };

  return (
    <div className={cn("h-screen w-full relative flex overflow-hidden", darkMode ? "dark bg-black" : "bg-gray-100")}>
      {/* Indigo Cosmos Background - Solo visible en modo oscuro */}
      {darkMode && (
        <>
          <div className="absolute inset-0 z-0 bg-black" />
          <div
            className="absolute inset-0 z-0"
            style={{
              background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99, 102, 241, 0.25), transparent 70%)",
            }}
          />
        </>
      )}

                                                       <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} animate={true}>
           <SidebarBody className={cn("backdrop-blur-xl border-r flex flex-col justify-between", darkMode ? "bg-neutral-900/80 border-neutral-800/50" : "bg-white border-gray-200 shadow-lg")}>
            <div>
                <div className={cn("py-5 flex items-center h-[80px] overflow-hidden relative transition-all duration-200", sidebarOpen ? "px-4 gap-4" : "px-2 justify-center")}>
                     <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg", darkMode ? "bg-gradient-to-r from-indigo-500 to-purple-500 shadow-indigo-500/30" : "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/30")}>
                        <UgelTalaraLogo className={cn("w-7 h-7", darkMode ? "text-white" : "text-white")} />
                    </div>
                    <SidebarHeaderContent darkMode={darkMode} />
                    {/* Botón de toggle en el sidebar */}
                    <button
                      onClick={() => setSidebarOpen(!sidebarOpen)}
                      className={cn(
                        "absolute p-2 rounded-lg transition-all hover:scale-105",
                        sidebarOpen ? "right-2" : "right-1",
                        darkMode ? "text-white hover:bg-neutral-800" : "text-blue-700 hover:bg-blue-50"
                      )}
                      title={sidebarOpen ? "Minimizar sidebar" : "Expandir sidebar"}
                    >
                      {sidebarOpen ? <IconX className="w-5 h-5" /> : <IconMenu2 className="w-5 h-5" />}
                    </button>
                </div>
                <div className={cn("mt-8 flex flex-col gap-2 transition-all duration-200", sidebarOpen ? "px-4" : "px-2")}>
                    {sidebarLinks.map((link) => {
                      // Bloquear SIEMPRE el certificado - no se puede acceder desde el sidebar
                      // Todos los demás enlaces (perfil, convocatorias, anexos, curriculum) estarán siempre habilitados
                      const isDisabled = link.key === 'certificado';
                      
                      return (
                        <div key={link.key} className={cn(isDisabled && "opacity-50 cursor-not-allowed pointer-events-none")}>
                          <SidebarLink 
                            icon={link.icon} 
                            label={link.label} 
                            isActive={activeSection === link.key} 
                            onClick={() => {
                              if (!isDisabled) {
                                handleSectionChange(link.key);
                              }
                            }} 
                            darkMode={darkMode} 
                          />
                        </div>
                      );
                    })}
                </div>
            </div>
             <div className={cn("border-t space-y-2 transition-all duration-200", darkMode ? "border-neutral-800" : "border-blue-500", sidebarOpen ? "p-4" : "p-2")}>
                  <button 
                    onClick={() => setDarkMode(!darkMode)} 
                    className={cn(
                      "flex items-center w-full rounded-xl transition-all shadow-md",
                      sidebarOpen ? "gap-4 py-3 px-4 justify-start" : "gap-0 py-3 px-2 justify-center",
                      darkMode ? "bg-neutral-800 hover:bg-neutral-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
                    )}
                    title={!sidebarOpen ? (darkMode ? 'Modo Claro' : 'Modo Oscuro') : undefined}
                  >
                     <span className="flex items-center justify-center shrink-0">
                       {darkMode ? <IconSun className="w-5 h-5" /> : <IconMoon className="w-5 h-5" />}
                     </span>
                     <motion.span 
                       initial={false} 
                       animate={{ 
                         opacity: sidebarOpen ? 1 : 0,
                         width: sidebarOpen ? "auto" : 0
                       }} 
                       transition={{ duration: 0.2 }}
                       className={cn("text-sm whitespace-pre font-medium", !sidebarOpen && "absolute opacity-0 pointer-events-none")}
                     >
                       {darkMode ? 'Modo Claro' : 'Modo Oscuro'}
                     </motion.span>
                 </button>
                  <button 
                    onClick={handleLogout} 
                    className={cn(
                      "flex items-center w-full rounded-xl transition-all shadow-md",
                      sidebarOpen ? "gap-4 py-3 px-4 justify-start" : "gap-0 py-3 px-2 justify-center",
                      darkMode ? "bg-red-600/80 hover:bg-red-600 text-white" : "bg-red-600 hover:bg-red-700 text-white"
                    )}
                    title={!sidebarOpen ? "Cerrar Sesión" : undefined}
                  >
                     <span className="flex items-center justify-center shrink-0">
                       <IconArrowLeft className="w-5 h-5" />
                     </span>
                     <motion.span 
                       initial={false} 
                       animate={{ 
                         opacity: sidebarOpen ? 1 : 0,
                         width: sidebarOpen ? "auto" : 0
                       }} 
                       transition={{ duration: 0.2 }}
                       className={cn("text-sm whitespace-pre font-medium", !sidebarOpen && "absolute opacity-0 pointer-events-none")}
                     >
                       Cerrar Sesión
                     </motion.span>
                 </button>
             </div>
        </SidebarBody>
      </Sidebar>
      
      <main className={cn("flex-1 relative z-10 overflow-y-auto", darkMode ? "" : "bg-white")}>
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
            <h1 className={cn("text-lg font-semibold", darkMode ? "text-white" : "text-blue-900")}>{sidebarLinks.find(link => link.key === activeSection)?.label}</h1>
        </div>
        <div className={cn("p-4 lg:p-6 w-full", darkMode ? "" : "bg-white")}>
            {renderActiveSection()}
        </div>
      </main>

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default InicioPostulante;